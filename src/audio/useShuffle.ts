import { useCallback, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "./constants";
import { safeWriteStorage, useStoredString } from "./storage";
import type { Track } from "./types";

type UseShuffleOptions = {
  currentTrackId: string | null;
  shuffleByDefault?: boolean;
  slug: string;
  tracks: Track[];
};

function parseShuffled(raw: string | null, fallback: boolean) {
  if (raw == null) {
    return fallback;
  }

  return raw === "true";
}

function createRandom(seed: number) {
  let value = Math.floor(seed * 2_147_483_647);

  if (value <= 0) {
    value += 2_147_483_646;
  }

  return () => {
    value = (value * 48_271) % 2_147_483_647;
    return (value - 1) / 2_147_483_646;
  };
}

function shuffleTracks(tracks: Track[], seed: number) {
  const random = createRandom(seed);
  const copy = [...tracks];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function anchorCurrentTrack(
  tracks: Track[],
  currentTrackId: string | null,
  seed: number
) {
  if (tracks.length < 2) {
    return tracks;
  }

  const currentTrack = currentTrackId
    ? tracks.find((track) => track.id === currentTrackId)
    : undefined;
  const rest = currentTrack
    ? tracks.filter((track) => track.id !== currentTrack.id)
    : tracks;
  const shuffledTracks = shuffleTracks(rest, seed);

  return currentTrack ? [currentTrack, ...shuffledTracks] : shuffledTracks;
}

export function useShuffle({
  currentTrackId,
  shuffleByDefault = true,
  slug,
  tracks,
}: UseShuffleOptions) {
  const raw = useStoredString(STORAGE_KEYS.shuffle(slug));
  const shuffled = useMemo(
    () => parseShuffled(raw, shuffleByDefault),
    [raw, shuffleByDefault]
  );
  const [shuffleSeed, setShuffleSeed] = useState(() => Math.random());
  const [shuffleReady, setShuffleReady] = useState(() => !shuffleByDefault);

  useEffect(() => {
    if (!shuffled) {
      setShuffleReady(true);
      return;
    }

    setShuffleSeed(Math.random());
    setShuffleReady(false);

    const frameId = window.requestAnimationFrame(() => {
      setShuffleReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [shuffled, slug, tracks.length]);

  const toggleShuffle = useCallback(() => {
    const next = !shuffled;

    safeWriteStorage(STORAGE_KEYS.shuffle(slug), String(next));

    if (next) {
      setShuffleSeed(Math.random());
      setShuffleReady(true);
    }
  }, [shuffled, slug]);

  const orderedTracks = useMemo(() => {
    if (!shuffled || !shuffleReady) {
      return tracks;
    }

    return anchorCurrentTrack(tracks, currentTrackId, shuffleSeed);
  }, [currentTrackId, shuffleReady, shuffleSeed, shuffled, tracks]);

  return {
    orderedTracks,
    shuffled,
    toggleShuffle,
  };
}
