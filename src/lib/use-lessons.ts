"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultLessons, type Lesson } from "@/lib/lessons";

type LessonsState = { lessons: Lesson[]; canEdit: boolean };

async function fetchLessons(): Promise<LessonsState | null> {
  try {
    const res = await fetch("/api/lessons", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as LessonsState;
  } catch {
    return null;
  }
}

/**
 * The live lecture-video list. Starts from the bundled defaults so the page
 * renders at once, then swaps in the database copy; a failed fetch just keeps
 * the list we already had. `canEdit` is decided server-side, never by the
 * client.
 */
export function useLessons() {
  const [state, setState] = useState<LessonsState>({
    lessons: defaultLessons,
    canEdit: false,
  });

  const refresh = useCallback(async () => {
    const next = await fetchLessons();
    if (next) setState(next);
  }, []);

  useEffect(() => {
    void fetchLessons().then((next) => {
      if (next) setState(next);
    });
  }, []);

  return { ...state, refresh };
}
