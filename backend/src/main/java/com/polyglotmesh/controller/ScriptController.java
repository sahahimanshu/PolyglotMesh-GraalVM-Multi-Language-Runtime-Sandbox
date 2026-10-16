
package com.polyglotmesh.controller;

import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/scripts")
@CrossOrigin(origins = "http://localhost:5173")
public class ScriptController {

    private final Map<String, Map<String, String>> scripts =
            new ConcurrentHashMap<>();

    @PostMapping
    public Map<String, String> saveScript(
            @RequestBody Map<String, String> request) {

        String name = request.get("name");
        String language = request.get("language");
        String code = request.get("code");

        if (name == null || name.isBlank()
                || language == null || language.isBlank()
                || code == null) {
            throw new IllegalArgumentException(
                    "Name, language and code are required.");
        }

        String id = UUID.randomUUID().toString();

        Map<String, String> script = new HashMap<>();
        script.put("id", id);
        script.put("name", name);
        script.put("language", language);
        script.put("code", code);

        scripts.put(id, script);
        return script;
    }

    @GetMapping
    public List<Map<String, String>> getScripts() {
        return new ArrayList<>(scripts.values());
    }

    @GetMapping("/{id}")
    public Map<String, String> getScript(@PathVariable String id) {
        Map<String, String> script = scripts.get(id);

        if (script == null) {
            throw new NoSuchElementException("Script not found: " + id);
        }

        return script;
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteScript(@PathVariable String id) {
        Map<String, String> removed = scripts.remove(id);

        if (removed == null) {
            throw new NoSuchElementException("Script not found: " + id);
        }

        return Map.of("message", "Script deleted successfully.");
    }
}
