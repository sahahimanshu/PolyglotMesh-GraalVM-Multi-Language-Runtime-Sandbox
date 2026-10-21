
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

@Service
public class PolyglotExecutionService {

    private static final long TIMEOUT_SECONDS = 3;

    private String cleanError(String language, Throwable error) {
        if (error instanceof PolyglotException) {
            PolyglotException pe = (PolyglotException) error;

            if (pe.isSyntaxError()) {
                return language + " syntax error:\n" + pe.getMessage();
            }

            if (pe.isCancelled()) {
                return language + " execution timed out or was cancelled.";
            }

            if (pe.isGuestException()) {
                return language + " runtime error:\n" + pe.getMessage();
            }
        }

        String message = error.getMessage();
        if (message == null || message.isBlank()) {
            message = error.getClass().getSimpleName();
        }

        return language + " execution error:\n" + message;
    }

    private String executePolyglot(String languageId, String languageName,
                                   String code) {
        if (code == null || code.isBlank()) {
            return "Input error: Code cannot be empty.";
        }

        ExecutorService executor = Executors.newSingleThreadExecutor();

        try {
            Future<String> future = executor.submit(() -> {
                ByteArrayOutputStream output = new ByteArrayOutputStream();

                try (Context context = Context.newBuilder(languageId)
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

                    Value result = context.eval(languageId, code);

                    String captured = output.toString(StandardCharsets.UTF_8);

                    if (!captured.isEmpty()) {
                        return captured;
                    }

                    return result.isString()
                            ? result.asString()
                            : result.toString();

                } catch (Throwable error) {
                    return cleanError(languageName, error);
                }
            });

            try {
                return future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            } catch (TimeoutException e) {
                future.cancel(true);
                return languageName + " execution timed out after "
                        + TIMEOUT_SECONDS + " seconds.";
            } catch (ExecutionException e) {
                Throwable cause = e.getCause() != null
                        ? e.getCause() : e;
                return cleanError(languageName, cause);
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return "Execution interrupted. Please try again.";
        } catch (Exception e) {
            return cleanError(languageName, e);
        } finally {
            executor.shutdownNow();
        }
    }

    public String executePython(String code) {
        return executePolyglot("python", "Python", code);
    }

    public String executeJavaScript(String code) {
        return executePolyglot("js", "JavaScript", code);
    }

    public String executeJava(String code) {
        if (code == null || code.isBlank()) {
            return "Input error: Java code cannot be empty.";
        }

        String javaHome = System.getenv("JAVA_HOME");

        if (javaHome == null || javaHome.isBlank()) {
            return "Configuration error: JAVA_HOME is not configured.";
        }

        boolean windows = System.getProperty("os.name")
                .toLowerCase().contains("win");

        String extension = windows ? ".exe" : "";

        Path javac = Path.of(javaHome, "bin", "javac" + extension);
        Path java = Path.of(javaHome, "bin", "java" + extension);

        if (!Files.exists(javac) || !Files.exists(java)) {
            return "Configuration error: javac/java not found in JAVA_HOME.";
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
                compile.waitFor();
                return "Java compilation timed out after 10 seconds.";
            }

            String compileOutput =
                    Files.readString(outputFile, StandardCharsets.UTF_8);

            if (compile.exitValue() != 0) {
                return "Java compilation error:\n" + compileOutput;
            }

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
                run.waitFor();
                return "Java execution timed out after "
                        + TIMEOUT_SECONDS + " seconds.";
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
            return "Java execution interrupted. Please try again.";
        } catch (Exception e) {
            String message = e.getMessage();
            return "Java execution error:\n"
                    + (message == null
                    ? e.getClass().getSimpleName() : message);
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
