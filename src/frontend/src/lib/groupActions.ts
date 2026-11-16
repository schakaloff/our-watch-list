// Things you can do to a whole group.
import i18n from "../i18n";
import { apiFetch } from "./api";
import { forget } from "./cache";

// Deletes the group on the backend. Returns an error message, or null if it worked.
// On success it also forgets the remembered pages that mention the group.
export async function deleteGroup(groupId: string): Promise<string | null> {
  try {
    const res = await apiFetch(`/api/groups/${groupId}`, { method: "DELETE" });
    if (!res.ok) {
      return (await res.json()).message;
    }
  } catch {
    return i18n.t("common.serverUnreachable");
  }

  forget(`movies:${groupId}`);
  forget("groups");
  forget("home");
  return null;
}
