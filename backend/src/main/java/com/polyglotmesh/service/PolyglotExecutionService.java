
package com.polyglotmesh.service;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.HostAccess;
import org.graalvm.polyglot.PolyglotException;
import org.graalvm.polyglot.Value;
import org.springframework.stereotype.Service;

import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.io.IOException;
import java.net.URI;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
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
                        .allowIO(false)
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

                    if (result.isString()) {
                        return result.asString();
                    }

                    return result.toString();
                }
            });

            return future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

        } catch (TimeoutException e) {
            Context context = contextRef.get();

            if (context != null) {
                try {
                    context.close(true);
                } catch (Exception ignored) {
                    // Context may already be closed.
                }
            }

            return "Execution timed out after "
                    + TIMEOUT_SECONDS + " seconds.";

        } catch (ExecutionException e) {
            Throwable cause = e.getCause();
            String message = cause != null
                    ? cause.getMessage()
                    : e.getMessage();

            return "Execution error: " + message;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return "Execution interrupted.";

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

    // Local Java runner for development and trusted code only.
    public String executeJava(String code) {
        if (code == null || code.isBlank()) {
            return "Error: Java code cannot be empty.";
        }

        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();

        if (compiler == null) {
            return "Java execution error: JDK compiler not available. "
                    + "Run the backend with a full JDK.";
        }

        Path tempDir = null;

        try {
            tempDir = Files.createTempDirectory("polyglot-java-");

            Path sourceFile = tempDir.resolve("Main.java");
            Files.writeString(sourceFile, code, StandardCharsets.UTF_8);

            Path outputDir = tempDir.resolve("classes");
            Files.createDirectories(outputDir);

            ByteArrayOutputStream compilerErrors =
                    new ByteArrayOutputStream();

            try (StandardJavaFileManager fileManager =
                         compiler.getStandardFileManager(
                                 null, null, StandardCharsets.UTF_8)) {

                Iterable<? extends JavaFileObject> units =
                        fileManager.getJavaFileObjects(sourceFile.toFile());

                boolean compiled = compiler.getTask(
                        null,
                        fileManager,
                        null,
                        List.of("-d", outputDir.toString()),
                        null,
                        units
                ).call();

                if (!compiled) {
                    return "Java compilation failed:\n"
                            + compilerErrors.toString(StandardCharsets.UTF_8);
                }
            }

            ByteArrayOutputStream output = new ByteArrayOutputStream();
            PrintStream originalOut = System.out;

            try (URLClassLoader loader = new URLClassLoader(
                    new URL[]{outputDir.toUri().toURL()},
                    ClassLoader.getPlatformClassLoader())) {

                Class<?> mainClass = loader.loadClass("Main");
                var mainMethod =
                        mainClass.getMethod("main", String[].class);

                try (PrintStream captured = new PrintStream(
                        output, true, StandardCharsets.UTF_8)) {
                    System.setOut(captured);

                    try {
                        mainMethod.invoke(null, (Object) new String[0]);
                    } catch (java.lang.reflect.InvocationTargetException e) {
                        Throwable cause = e.getCause();
                        return "Java runtime error: "
                                + (cause == null
                                ? e.getMessage()
                                : cause.getMessage());
                    } finally {
                        System.setOut(originalOut);
                    }
                }
            }

            return output.toString(StandardCharsets.UTF_8);

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
                                    // Best-effort cleanup.
                                }
                            });
                } catch (IOException ignored) {
                    // Best-effort cleanup.
                }
            }
        }
    }
}
