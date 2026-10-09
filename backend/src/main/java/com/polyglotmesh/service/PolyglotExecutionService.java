package com.polyglotmesh.service;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

@Service
public class PolyglotExecutionService {

    public String executePython(String code) {

        ByteArrayOutputStream output = new ByteArrayOutputStream();

        try (Context context = Context.newBuilder("python")
                .allowAllAccess(false)
                .allowHostAccess(org.graalvm.polyglot.HostAccess.NONE)
                .allowHostClassLookup(className -> false)
                .option("engine.WarnInterpreterOnly", "false")
                .allowIO(false)
                .out(output)
                .err(output)
                .build()) {

            context.eval("python", code);

            return output.toString(StandardCharsets.UTF_8);

        } catch (Exception e) {
            return "Python execution error: " + e.getMessage();
        }
    }

    public String executeJavaScript(String code) {

        ByteArrayOutputStream output = new ByteArrayOutputStream();

        try (Context context = Context.newBuilder("js")
                .allowAllAccess(false)
                .allowHostAccess(org.graalvm.polyglot.HostAccess.NONE)
                .allowHostClassLookup(className -> false)
                .option("engine.WarnInterpreterOnly", "false")
                .allowIO(false)
                .out(output)
                .err(output)
                .build()) {

            Value result = context.eval("js", code);

            String consoleOutput =
                    output.toString(StandardCharsets.UTF_8);

            if (!consoleOutput.isEmpty()) {
                return consoleOutput;
            }

            if (result.isString()) {
                return result.asString();
            }

            return result.toString();

        } catch (Exception e) {
            return "JavaScript execution error: " + e.getMessage();
        }
    }
    public String executeJava(String code) {
    try {
        javax.tools.JavaCompiler compiler =
                javax.tools.ToolProvider.getSystemJavaCompiler();

        if (compiler == null) {
            return "Java execution error: JDK compiler not available.";
        }

        java.io.ByteArrayOutputStream output =
                new java.io.ByteArrayOutputStream();

        java.io.ByteArrayOutputStream errors =
                new java.io.ByteArrayOutputStream();

        javax.tools.JavaFileObject source =
                new javax.tools.SimpleJavaFileObject(
                        java.net.URI.create("string:///Main.java"),
                        javax.tools.JavaFileObject.Kind.SOURCE) {
                    @Override
                    public CharSequence getCharContent(
                            boolean ignoreEncodingErrors) {
                        return code;
                    }
                };

        java.nio.file.Path tempDir =
                java.nio.file.Files.createTempDirectory("polyglot-java-");

        javax.tools.StandardJavaFileManager fileManager =
                compiler.getStandardFileManager(
                        null, null, java.nio.charset.StandardCharsets.UTF_8);

        try {
            java.util.List<String> options = java.util.List.of(
                    "-d", tempDir.toString()
            );

            boolean compiled = compiler.getTask(
                    null, fileManager, null, options, null,
                    java.util.List.of(source)
            ).call();

            if (!compiled) {
                return "Compilation failed. Check your Java code.";
            }

            try (java.net.URLClassLoader loader =
                         new java.net.URLClassLoader(
                                 new java.net.URL[]{
                                         tempDir.toUri().toURL()
                                 })) {

                Class<?> mainClass =
                        loader.loadClass("Main");

                java.lang.reflect.Method main =
                        mainClass.getMethod("main", String[].class);

                java.io.PrintStream originalOut = System.out;

                try (java.io.PrintStream captured =
                             new java.io.PrintStream(output)) {
                    System.setOut(captured);

                    main.invoke(null, (Object) new String[0]);
                } finally {
                    System.setOut(originalOut);
                }
            }

            return output.toString(
                    java.nio.charset.StandardCharsets.UTF_8);

        } finally {
            fileManager.close();

            try (var paths = java.nio.file.Files.walk(tempDir)) {
                paths.sorted(java.util.Comparator.reverseOrder())
                        .forEach(path -> {
                            try {
                                java.nio.file.Files.deleteIfExists(path);
                            } catch (java.io.IOException ignored) {
                            }
                        });
            }
        }

    } catch (Exception e) {
        return "Java execution error: " + e.getMessage();
    }
}
}