
package com.polyglotmesh.controller;

import com.polyglotmesh.service.PolyglotExecutionService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/execute")
@CrossOrigin(origins = "http://localhost:5173")
public class ExecutionController {

    private final PolyglotExecutionService executionService;

    public ExecutionController(
            PolyglotExecutionService executionService) {
        this.executionService = executionService;
    }

    
    @PostMapping("/python")
    public String executePython(@RequestBody String code) {
        return executionService.executePython(code);
    }

   
    @PostMapping("/javascript")
    public String executeJavaScript(@RequestBody String code) {
        return executionService.executeJavaScript(code);
    }

    
    @PostMapping("/java")
    public String executeJava(@RequestBody String code) {
        return executionService.executeJava(code);
    }

    @PostMapping("/mock-rest")
    public String mockRestCall(@RequestBody String code) {
        try {
            Thread.sleep(50);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return "Mock REST request interrupted.";
        }

        return "Mock REST API executed successfully";
    }
}
