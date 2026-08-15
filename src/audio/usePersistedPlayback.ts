import { useCallback, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "./constants";
import { safeRemoveStorage, safeWriteStorage, useStoredString } from "./storage";

export type SavedPlayback = {
  id: string;
  time: number;
};

function parseSavedPlayback(raw: string | null): SavedPlayback | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SavedPlayback>;

    if (typeof parsed.id !== "string" || parsed.id.length === 0) {
      return null;
    }

    if (typeof parsed.time !== "number" || !Number.isFinite(parsed.time)) {
      return null;
    }

    return {
      id: parsed.id,
      time: Math.max(0, Math.floor(parsed.time)),
    };
  } catch {
    return null;
  }
}

export function usePersistedPlayback(slug: string) {
  const key = STORAGE_KEYS.playback(slug);
  const raw = useStoredString(key);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const savedPlayback = useMemo(() => parseSavedPlayback(raw), [raw]);

  const savePlayback = useCallback(
    (id: string, time: number) => {
      if (!id) {
        return;
      }

      safeWriteStorage(
        key,
        JSON.stringify({
          id,
          time: Math.max(0, Math.floor(time)),
        })
      );
    },
    [key]
  );

  const clearPlayback = useCallback(() => {
    safeRemoveStorage(key);
  }, [key]);

  return {
    clearPlayback,
    hydrated,
    savePlayback,
    savedPlayback,
  };
}
