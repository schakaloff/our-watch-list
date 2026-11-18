// The language the site is in right now ("en" or "ru"), and the names of the remembered pages that depend on it.
// The backend asks TMDB for movie titles and descriptions in this language, so what we remember
// for English must never be shown in Russian, and the other way round.
import i18n from "../i18n";

export type Language = "en" | "ru";

export function currentLanguage(): Language {
  return i18n.resolvedLanguage === "ru" ? "ru" : "en";
}

// The remembered movies of one group, in one language.
export function moviesKey(groupId: string | undefined, language: Language): string {
  return `movies:${groupId}:${language}`;
}

// The start of every remembered copy of one group's movies (all languages), for forgetting them together.
export function moviesKeyPrefix(groupId: string): string {
  return `movies:${groupId}:`;
}
