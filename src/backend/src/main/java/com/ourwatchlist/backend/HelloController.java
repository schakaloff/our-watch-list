package com.ourwatchlist.java

@RestController
public class HelloController{

    @GetMapping("/api/hello")
    public String Hello(){
        return "hello";
    }
}