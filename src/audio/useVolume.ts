import { useCallback, useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import {
  DEFAULT_VOLUME,
  FADE_IN_S,
  FADE_OUT_S,
  LONG_FORM_FADE_CUTOFF_S,
  SLEEP_FADE_MS,
  STORAGE_KEYS,
} from "./constants";
import { safeWriteStorage, useStoredString } from "./storage";
import type { Repeat, YouTubePlayer } from "./types";

type UseVolumeOptions = {
  currentTime: number;
  duration: number;
  playerRef: RefObject<YouTubePlayer | null>;
  playing: boolean;
  ready: boolean;
  repeat: Repeat;
};

function clampVolume(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseMuted(raw: string | null) {
  return raw === "true";
}

function parseVolume(raw: string | null) {
  if (!raw) {
    return DEFAULT_VOLUME;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_VOLUME;
  }

  return clampVolume(parsed);
}

export function useVolume({
  currentTime,
  duration,
  playerRef,
  playing,
  ready,
  repeat,
}: UseVolumeOptions) {
  const mutedRaw = useStoredString(STORAGE_KEYS.muted);
  const volumeRaw = useStoredString(STORAGE_KEYS.volume);
  const fadeRef = useRef(1);
  const animationFrameRef = useRef<number | null>(null);

  const muted = useMemo(() => parseMuted(mutedRaw), [mutedRaw]);
  const volume = useMemo(() => parseVolume(volumeRaw), [volumeRaw]);
  const shouldFade =
    duration > 0 && duration < LONG_FORM_FADE_CUTOFF_S && repeat !== "one";

  const cancelFadeAnimation = useCallback(() => {
    if (animationFrameRef.current === null) {
      return;
    }

    window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  }, []);

  const applyVolume = useCallback(() => {
    playerRef.current?.setVolume(
      muted ? 0 : Math.round(clampVolume(volume) * fadeRef.current)
    );
  }, [muted, playerRef, volume]);

  const resetFade = useCallback(() => {
    cancelFadeAnimation();
    fadeRef.current = 1;
    applyVolume();
  }, [applyVolume, cancelFadeAnimation]);

  const fadeTo = useCallback(
    (target: number, durationMs: number) =>
      new Promise<void>((resolve) => {
        cancelFadeAnimation();

        const startValue = fadeRef.current;
        const nextTarget = Math.max(0, Math.min(1, target));

        if (durationMs <= 0 || startValue === nextTarget) {
          fadeRef.current = nextTarget;
          applyVolume();
          resolve();
          return;
        }

        const startedAt = performance.now();

        const step = (now: number) => {
          const progress = Math.min(1, (now - startedAt) / durationMs);

          fadeRef.current =
            startValue + (nextTarget - startValue) * progress;
          applyVolume();

          if (progress < 1) {
            animationFrameRef.current = window.requestAnimationFrame(step);
            return;
          }

          animationFrameRef.current = null;
          resolve();
        };

        animationFrameRef.current = window.requestAnimationFrame(step);
      }),
    [applyVolume, cancelFadeAnimation]
  );

  const fadeIn = useCallback(() => {
    cancelFadeAnimation();
    fadeRef.current = 0;
    applyVolume();

    const startedAt = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / (FADE_IN_S * 1000));

      fadeRef.current = progress;
      applyVolume();

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(step);
        return;
      }

      animationFrameRef.current = null;
    };

    animationFrameRef.current = window.requestAnimationFrame(step);
  }, [applyVolume, cancelFadeAnimation]);

  const fadeToSilence = useCallback(() => {
    return fadeTo(0, SLEEP_FADE_MS);
  }, [fadeTo]);

  const changeVolume = useCallback((nextVolume: number) => {
    safeWriteStorage(STORAGE_KEYS.volume, String(clampVolume(nextVolume)));
  }, []);

  const toggleMute = useCallback(() => {
    safeWriteStorage(STORAGE_KEYS.muted, String(!muted));
  }, [muted]);

  useEffect(() => {
    if (ready) {
      applyVolume();
    }
  }, [applyVolume, ready]);

  useEffect(() => {
    if (!playing || !shouldFade || duration <= 0) {
      return;
    }

    const remaining = duration - currentTime;

    if (remaining > FADE_OUT_S) {
      if (fadeRef.current !== 1) {
        fadeRef.current = 1;
        applyVolume();
      }

      return;
    }

    fadeRef.current = Math.max(0, remaining / FADE_OUT_S);
    applyVolume();
  }, [applyVolume, currentTime, duration, playing, shouldFade]);

  useEffect(() => {
    if (!playing || shouldFade) {
      return;
    }

    if (fadeRef.current !== 1) {
      fadeRef.current = 1;
      applyVolume();
    }
  }, [applyVolume, playing, shouldFade]);

  useEffect(() => {
    return () => {
      cancelFadeAnimation();
    };
  }, [cancelFadeAnimation]);

  return {
    applyVolume,
    changeVolume,
    fadeIn,
    fadeRef,
    fadeToSilence,
    muted,
    resetFade,
    shouldFade,
    toggleMute,
    volume,
  };
}
