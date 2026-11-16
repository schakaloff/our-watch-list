import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { getCached } from "../lib/cache";
import type { Group } from "../types";

// "My List" in the top bar. It sends you to your first group's list,
// or tells you what to do if you are logged out or not in a group yet.
export default function MyList() {
  const { t } = useTranslation();
  // If we already know your groups, go straight to the first one without waiting.
  const known = getCached<Group[]>("groups");
  const [state, setState] = useState<"loading" | "loggedOut" | "noGroups" | "ready">(known && known.length > 0 ? "ready" : "loading");
  const [firstGroupId, setFirstGroupId] = useState<string | null>(known && known.length > 0 ? known[0].id : null);

  useEffect(() => {
    apiFetch("/api/groups")
      .then(async (res) => {
        if (res.status === 401) {
          setState("loggedOut");
          return;
        }
        const groups: Group[] = await res.json();
        if (groups.length === 0) {
          setState("noGroups");
        } else {
          setFirstGroupId(groups[0].id);
          setState("ready");
        }
      })
      .catch(() => setState("loggedOut"));
  }, []);

  if (state === "ready" && firstGroupId) {
    return <Navigate to={`/groups/${firstGroupId}`} replace />;
  }

  if (state === "loading") {
    return <p className="text-muted">{t("common.loading")}</p>;
  }

  if (state === "loggedOut") {
    return (
      <p className="text-muted">
        <Trans
          i18nKey="list.pleaseSignIn"
          components={{ go: <Link to="/login" className="text-white hover:underline" /> }}
        />
      </p>
    );
  }

  return (
    <p className="text-muted">
      <Trans
        i18nKey="list.notInGroup"
        components={{ go: <Link to="/groups" className="text-white hover:underline" /> }}
      />
    </p>
  );
}
