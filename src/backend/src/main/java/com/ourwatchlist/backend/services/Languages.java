// Works out which language to ask TMDB for. The browser tells us with the Accept-Language header
// (our frontend sends just "en" or "ru"). We support English and Russian; anything else gets English.
package com.ourwatchlist.backend.services;

public final class Languages {

    public static final String ENGLISH = "en-US";
    public static final String RUSSIAN = "ru-RU";

    // How we save a language in our own database.
    public static final String ENGLISH_SHORT = "en";
    public static final String RUSSIAN_SHORT = "ru";

    private Languages() {}

    // "ru-RU" gives "ru", anything else "en".
    public static String shortCode(String tmdbCode) {
        return RUSSIAN.equals(tmdbCode) ? RUSSIAN_SHORT : ENGLISH_SHORT;
    }

    // "ru", "ru-RU" or "ru-RU,ru;q=0.9,en;q=0.8" all give "ru-RU". Missing or unknown gives "en-US".
    public static String tmdbCode(String acceptLanguage) {
        if (acceptLanguage == null) {
            return ENGLISH;
        }
        // Only the first (preferred) language matters.
        String first = acceptLanguage.split("[,;]")[0].trim().toLowerCase();
        return first.startsWith("ru") ? RUSSIAN : ENGLISH;
    }
}
