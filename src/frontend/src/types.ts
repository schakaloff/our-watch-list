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
