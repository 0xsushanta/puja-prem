import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import { STALL_ESCAPE_MS, STALL_GRACE_MS } from "./constants";
import type { YouTubePlayer } from "./types";

type UseWatchdogOptions = {
  onAdvance(): void;
  playerRef: RefObject<YouTubePlayer | null>;
  playing: boolean;
};

export function useWatchdog({
  onAdvance,
  playerRef,
  playing,
}: UseWatchdogOptions) {
  const stallTimerRef = useRef<number | null>(null);
  const escalateTimerRef = useRef<number | null>(null);
  const lastProgressRef = useRef({
    at: 0,
    time: 0,
  });
  const wasPlayingRef = useRef(false);

  const clearStall = useCallback(() => {
    if (stallTimerRef.current !== null) {
      window.clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }

    if (escalateTimerRef.current !== null) {
      window.clearTimeout(escalateTimerRef.current);
      escalateTimerRef.current = null;
    }
  }, []);

  const armStall = useCallback(() => {
    clearStall();

    stallTimerRef.current = window.setTimeout(() => {
      const player = playerRef.current;

      if (!player) {
        return;
      }

      const now = player.getCurrentTime() ?? 0;

      if (Math.abs(now - lastProgressRef.current.time) > 0.5) {
        return;
      }

      player.seekTo(Math.max(0, now - 0.5), true);
      player.playVideo();

      escalateTimerRef.current = window.setTimeout(() => {
        const after = player.getCurrentTime() ?? 0;

        if (Math.abs(after - now) < 0.5) {
          onAdvance();
        }
      }, STALL_ESCAPE_MS);
    }, STALL_GRACE_MS);
  }, [clearStall, onAdvance, playerRef]);

  const noteProgress = useCallback(
    (time: number) => {
      if (!playing) {
        lastProgressRef.current = {
          at: Date.now(),
          time,
        };
        return;
      }

      if (Math.abs(time - lastProgressRef.current.time) < 0.01) {
        if (Date.now() - lastProgressRef.current.at > STALL_GRACE_MS) {
          armStall();
        }

        return;
      }

      lastProgressRef.current = {
        at: Date.now(),
        time,
      };
      clearStall();
    },
    [armStall, clearStall, playing]
  );

  useEffect(() => {
    if (!playing) {
      clearStall();
      return;
    }

    lastProgressRef.current = {
      at: Date.now(),
      time: playerRef.current?.getCurrentTime() ?? 0,
    };
  }, [clearStall, playerRef, playing]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOffline = () => {
      wasPlayingRef.current = playing;
    };

    const handleOnline = () => {
      if (wasPlayingRef.current) {
        playerRef.current?.playVideo();
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [playerRef, playing]);

  useEffect(() => {
    return () => {
      clearStall();
    };
  }, [clearStall]);

  return {
    armStall,
    clearStall,
    noteProgress,
  };
}
