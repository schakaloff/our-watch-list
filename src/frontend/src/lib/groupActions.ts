// Things you can do to a whole group.
import { apiFetch } from "./api";
import { forget } from "./cache";

// The question asked before a group is deleted. It spells out what will be lost.
export function deleteWarning(groupName: string): string {
  return `Delete "${groupName}"?\n\nThis permanently deletes the group, its whole movie list, and everyone's ratings and notes. This cannot be undone.`;
}

// Deletes the group on the backend. Returns an error message, or null if it worked.
// On success it also forgets the remembered pages that mention the group.
export async function deleteGroup(groupId: string): Promise<string | null> {
  try {
    const res = await apiFetch(`/api/groups/${groupId}`, { method: "DELETE" });
    if (!res.ok) {
      return (await res.json()).message;
    }
  } catch {
    return "Could not reach the server. Try again.";
  }

  forget(`movies:${groupId}`);
  forget("groups");
  forget("home");
  return null;
}
