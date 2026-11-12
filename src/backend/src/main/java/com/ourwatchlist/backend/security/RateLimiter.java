// Limits how often something can be tried, to stop guessing (invite codes, passwords).
// Remembers the time of each recent attempt per key, in memory only. A restart forgets everything.
package com.ourwatchlist.backend.security;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

@Component
public class RateLimiter {

    // Stops the memory from growing forever if many different keys show up.
    private static final int MAX_KEYS = 10_000;

    private final Map<String, Deque<Long>> attempts = new ConcurrentHashMap<>();

    // Records an attempt for this key and says whether it is allowed:
    // false once there have already been maxAttempts within the last windowMillis.
    public boolean allow(String key, int maxAttempts, long windowMillis) {
        if (attempts.size() >= MAX_KEYS) {
            attempts.clear();
        }

        long now = System.currentTimeMillis();
        Deque<Long> times = attempts.computeIfAbsent(key, k -> new ArrayDeque<>());

        synchronized (times) {
            while (!times.isEmpty() && now - times.peekFirst() > windowMillis) {
                times.pollFirst();
            }
            if (times.size() >= maxAttempts) {
                return false;
            }
            times.addLast(now);
            return true;
        }
    }
}
