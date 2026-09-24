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
}