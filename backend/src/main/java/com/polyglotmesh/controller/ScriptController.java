package com.polyglotmesh.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/scripts")
@CrossOrigin(origins = "http://localhost:5173")
public class ScriptController {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Path storageFile =
            Path.of("data", "scripts.json").toAbsolutePath();

    private final List<Script> scripts = new ArrayList<>();

    public ScriptController() {
        loadFromFile();
    }

    public static class Script {
        public String id;
        public String name;
        public String language;
        public String code;

        public Script() {
        }

        public Script(String id, String name, String language, String code) {
            this.id = id;
            this.name = name;
            this.language = language;
            this.code = code;
        }
    }

    private synchronized void loadFromFile() {
        try {
            Files.createDirectories(storageFile.getParent());

            if (Files.exists(storageFile)) {
                List<Script> saved = objectMapper.readValue(
                        storageFile.toFile(),
                        new TypeReference<List<Script>>() {}
                );

                scripts.clear();
                scripts.addAll(saved);
            } else {
                saveToFile();
            }

            System.out.println("Scripts loaded: " + scripts.size());
            System.out.println("Storage location: " + storageFile);

        } catch (IOException e) {
            throw new IllegalStateException(
                    "Unable to load saved scripts: " + e.getMessage(), e);
        }
    }

    private synchronized void saveToFile() {
        try {
            Files.createDirectories(storageFile.getParent());

            objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValue(storageFile.toFile(), scripts);

        } catch (IOException e) {
            throw new IllegalStateException(
                    "Unable to save scripts: " + e.getMessage(), e);
        }
    }

    @PostMapping
    public synchronized Script saveScript(@RequestBody Script request) {
        if (request.name == null || request.name.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Script name is required");
        }

        if (request.language == null || request.language.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Language is required");
        }

        if (request.code == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Code is required");
        }

        Script script = new Script(
                UUID.randomUUID().toString(),
                request.name.trim(),
                request.language.trim(),
                request.code
        );

        scripts.add(script);
        saveToFile();

        return script;
    }

    @GetMapping
    public synchronized List<Script> getAllScripts() {
        return new ArrayList<>(scripts);
    }

    @GetMapping("/{id}")
    public synchronized Script getScript(@PathVariable String id) {
        return scripts.stream()
                .filter(script -> script.id.equals(id))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Script not found"));
    }

    @DeleteMapping("/{id}")
    public synchronized String deleteScript(@PathVariable String id) {
        boolean removed = scripts.removeIf(
                script -> script.id.equals(id));

        if (!removed) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Script not found");
        }

        saveToFile();
        return "Script deleted successfully";
    }
}