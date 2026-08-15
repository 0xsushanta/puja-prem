import { useEffect, useRef } from "react";
import { AWAY_GRACE_MS, STORAGE_KEYS } from "./constants";
import { safeWriteStorage } from "./storage";
import type { YouTubePlayer } from "./types";

/**
 * §17 — Backgrounding / Visibility handler.
 *
 * On `hidden`:
 *  - Immediately snapshot the current playback position to localStorage
 *    (bypasses the 1/sec cadence from the progress poll so we never lose
 *    more than PROGRESS_POLL_MS worth of position on a surprise kill).
 *  - Records `hiddenAt` timestamp.
 *
 * On `visible`:
 *  - If the tab was hidden for ≤ AWAY_GRACE_MS (30 min) AND was playing
 *    when it went hidden, call `playVideo()` to resume.
 *
 * The handler intentionally does NOT pause on hide — music continuing
 * while the screen is locked is the entire product.
 *
 * This module must not contain JSX.
 */
type UseVisibilityOptions = {
  currentTime: number;
  playing: boolean;
  playerRef: React.RefObject<YouTubePlayer | null>;
  playlistSlug: string;
  trackId: string | undefined;
};

export function useVisibility({
  currentTime,
  playing,
  playerRef,
  playlistSlug,
  trackId,
}: UseVisibilityOptions) {
  const hiddenAtRef = useRef<number | null>(null);
  const wasPlayingRef = useRef(false);

  // Keep refs fresh for the event handler closure.
  const playingRef = useRef(playing);
  playingRef.current = playing;

  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;

  const trackIdRef = useRef(trackId);
  trackIdRef.current = trackId;

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        // Snapshot position immediately.
        const id = trackIdRef.current;
        if (id) {
          safeWriteStorage(
            STORAGE_KEYS.playback(playlistSlug),
            JSON.stringify({ id, time: Math.floor(currentTimeRef.current) })
          );
        }

        hiddenAtRef.current = Date.now();
        wasPlayingRef.current = playingRef.current;
        return;
      }

      // visible
      if (hiddenAtRef.current === null) {
        return;
      }

      const awayMs = Date.now() - hiddenAtRef.current;
      hiddenAtRef.current = null;

      if (wasPlayingRef.current && awayMs <= AWAY_GRACE_MS) {
        playerRef.current?.playVideo();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [playerRef, playlistSlug]);
}
