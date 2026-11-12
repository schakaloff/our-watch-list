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

// A person in a group, as the backend sends it.
export interface Member {
  userId: string;
  displayName: string;
}

// A couple's shared list. The invite code lets the partner join.
export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  members: Member[];
}

// The logged-in user's profile, as shown on the Settings page.
export interface Profile {
  email: string;
  displayName: string;
  username: string | null;
}

// One person's score and notes for a movie.
export interface MemberRating {
  userId: string;
  displayName: string;
  score: number;
  notes: string | null;
}

// A movie on a group's shared list, as the backend sends it.
export interface GroupMovie {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
  tmdbRating: number | null;
  overview: string | null;
  status: Status;
  addedBy: string;
  addedAt: string;
  watchedAt: string | null;
  ratings: MemberRating[];
}
