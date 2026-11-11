// A test route: GET /api/hello returns "hello".
// Used to check that the backend and its routes work.
package com.ourwatchlist.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    // Answers GET /api/hello with the text "hello".
    // A simple way to check the backend is running.
    @GetMapping("/api/hello")
    public String Hello(){
        return "hello";
    }
}
