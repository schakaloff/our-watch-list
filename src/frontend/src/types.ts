export type Status = "want" | "watched";

export interface SavedMovie {
  id: number;
  title: string;
  poster: string | null;
  year: number | null;
  tmdbRating: number;
  overview: string;
  status: Status;
  myRating?: number;
  notes?: string;
  addedAt: string;
  watchedAt?: string;
}
