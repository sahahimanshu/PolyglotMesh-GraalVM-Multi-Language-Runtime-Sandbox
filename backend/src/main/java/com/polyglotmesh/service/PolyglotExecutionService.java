
package com.polyglotmesh.service;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.HostAccess;
import org.graalvm.polyglot.PolyglotException;
import org.graalvm.polyglot.Value;
import org.graalvm.polyglot.io.IOAccess;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class PolyglotExecutionService {

    private static final long TIMEOUT_SECONDS = 3;

    private String executePolyglot(String language, String code) {
        if (code == null || code.isBlank()) {
            return "Error: Code cannot be empty.";
        }

        ExecutorService executor = Executors.newSingleThreadExecutor();
        AtomicReference<Context> contextRef = new AtomicReference<>();

        try {
            Future<String> future = executor.submit(() -> {
                ByteArrayOutputStream output = new ByteArrayOutputStream();

                try (Context context = Context.newBuilder(language)
                        .allowAllAccess(false)
                        .allowHostAccess(HostAccess.NONE)
                        .allowHostClassLookup(name -> false)
                        .allowIO(IOAccess.NONE)
                        .allowCreateProcess(false)
                        .allowCreateThread(false)
                        .allowNativeAccess(false)
                        .option("engine.WarnInterpreterOnly", "false")
                        .out(output)
                        .err(output)
                        .build()) {

                    contextRef.set(context);
                    Value result = context.eval(language, code);

                    String captured =
                            output.toString(StandardCharsets.UTF_8);

                    if (!captured.isEmpty()) {
                        return captured;
                    }

                    return result.isString()
                            ? result.asString()
                            : result.toString();
                }
            });

            return future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

        } catch (TimeoutException e) {
            Context context = contextRef.get();

            if (context != null) {
                try {
                    context.close(true);
                } catch (Exception ignored) {
                }
            }

            return "Execution timed out after "
                    + TIMEOUT_SECONDS + " seconds.";

        } catch (ExecutionException e) {
            Throwable cause = e.getCause();
            String message = cause == null
                    ? e.getMessage()
                    : cause.getMessage();

            return "Execution error: " + message;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return "Execution interrupted.";

        } catch (Exception e) {
            return "Execution error: " + e.getMessage();

        } finally {
            executor.shutdownNow();
        }
    }

    public String executePython(String code) {
        return executePolyglot("python", code);
    }

    public String executeJavaScript(String code) {
        return executePolyglot("js", code);
    }

    
    public String executeJava(String code) {
        if (code == null || code.isBlank()) {
            return "Error: Java code cannot be empty.";
        }

        String javaHome = System.getenv("JAVA_HOME");

        if (javaHome == null || javaHome.isBlank()) {
            return "Error: JAVA_HOME is not configured.";
        }

        boolean windows = System.getProperty("os.name")
                .toLowerCase().contains("win");

        String extension = windows ? ".exe" : "";

        Path javac = Path.of(javaHome, "bin", "javac" + extension);
        Path java = Path.of(javaHome, "bin", "java" + extension);

        if (!Files.exists(javac) || !Files.exists(java)) {
            return "Error: javac/java not found in JAVA_HOME.";
        }

        Path tempDir = null;

        try {
            tempDir = Files.createTempDirectory("polyglot-java-");

            Path source = tempDir.resolve("Main.java");
            Path outputFile = tempDir.resolve("output.txt");

            Files.writeString(source, code, StandardCharsets.UTF_8);

            
            Process compile = new ProcessBuilder(
                    javac.toString(),
                    "-proc:none",
                    "-d", tempDir.toString(),
                    source.toString()
            )
                    .directory(tempDir.toFile())
                    .redirectErrorStream(true)
                    .redirectOutput(outputFile.toFile())
                    .start();

            if (!compile.waitFor(10, TimeUnit.SECONDS)) {
                compile.destroyForcibly();
                return "Error: Java compilation timed out.";
            }

            String compileOutput =
                    Files.readString(outputFile, StandardCharsets.UTF_8);

            if (compile.exitValue() != 0) {
                return "Java compilation failed:\n" + compileOutput;
            }

            // Run compiled Java class.
            Process run = new ProcessBuilder(
                    java.toString(),
                    "-cp", tempDir.toString(),
                    "Main"
            )
                    .directory(tempDir.toFile())
                    .redirectErrorStream(true)
                    .redirectOutput(outputFile.toFile())
                    .start();

            if (!run.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
                run.destroyForcibly();
                return "Error: Java execution timed out.";
            }

            String output =
                    Files.readString(outputFile, StandardCharsets.UTF_8);

            if (run.exitValue() != 0) {
                return "Java runtime error:\n" + output;
            }

            return output.isBlank()
                    ? "Program executed successfully."
                    : output;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return "Java execution interrupted.";

        } catch (Exception e) {
            return "Java execution error: " + e.getMessage();

        } finally {
            if (tempDir != null) {
                try (var paths = Files.walk(tempDir)) {
                    paths.sorted(Comparator.reverseOrder())
                            .forEach(path -> {
                                try {
                                    Files.deleteIfExists(path);
                                } catch (IOException ignored) {
                                }
                            });
                } catch (IOException ignored) {
                }
            }
        }
    }
}
