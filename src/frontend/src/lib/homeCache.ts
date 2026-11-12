// What the home page last learned: the popular movies, your groups, and which movies are already added.
// Stored in the memory cache (see cache.ts), so coming back to the home page shows the right buttons at once.
import type { Group, SavedMovie } from "../types";
import { getCached, setCached } from "./cache";

export interface HomeData {
  popular: SavedMovie[];
  groups: Group[];
  savedIn: Record<number, string[]>;
  loggedIn: boolean;
}

export function getHomeData(): HomeData | undefined {
  return getCached<HomeData>("home");
}

export function setHomeData(next: HomeData): void {
  setCached("home", next);
}
