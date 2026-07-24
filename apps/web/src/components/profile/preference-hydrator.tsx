"use client";

import { useEffect } from "react";
import type { UserProfile } from "@/lib/profile";
import { applyUserPreferences } from "@/lib/user-preferences";

export function PreferenceHydrator({
  profile,
}: {
  profile: UserProfile | null;
}) {
  useEffect(() => {
    if (!profile) return;
    applyUserPreferences(profile);
  }, [profile]);

  return null;
}
