
package com.polyglotmesh.controller;

import com.polyglotmesh.service.PolyglotExecutionService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/execute")
@CrossOrigin(origins = "http://localhost:5173")
public class ExecutionController {

    private final PolyglotExecutionService executionService;

    public ExecutionController(PolyglotExecutionService executionService) {
        this.executionService = executionService;
    }

    @PostMapping("/python")
    public String executePython(@RequestBody Map<String, String> request) {
        return executionService.executePython(request.get("code"));
    }

    @PostMapping("/javascript")
    public String executeJavaScript(@RequestBody Map<String, String> request) {
        return executionService.executeJavaScript(request.get("code"));
    }

    @PostMapping("/java")
    public String executeJava(@RequestBody Map<String, String> request) {
        return executionService.executeJava(request.get("code"));
    }

    @PostMapping("/mock-rest")
    public String mockRestCall(@RequestBody Map<String, String> request) {
        try {
            Thread.sleep(50);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return "Mock REST request interrupted.";
        }

        return "Mock REST API executed successfully";
    }
}
