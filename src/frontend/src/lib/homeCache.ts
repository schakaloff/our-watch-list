// What the home page last learned: the popular movies, your groups, and which movies are already added.
// Stored in the memory cache (see cache.ts), so coming back to the home page shows the right buttons at once.
// Kept separately for each language, because the movie titles in it are in that language.
import type { Group, SavedMovie } from "../types";
import { getCached, setCached } from "./cache";
import type { Language } from "./language";

export interface HomeData {
  popular: SavedMovie[];
  groups: Group[];
  savedIn: Record<number, string[]>;
  loggedIn: boolean;
}

export function getHomeData(language: Language): HomeData | undefined {
  return getCached<HomeData>(`home:${language}`);
}

export function setHomeData(language: Language, next: HomeData): void {
  setCached(`home:${language}`, next);
}
