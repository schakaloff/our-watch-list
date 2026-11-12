// An error we throw on purpose, with the HTTP status and message the user should see.
// Example: new ApiException(HttpStatus.CONFLICT, "This group is full").
package com.ourwatchlist.backend.exception;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
