import { useEffect, useRef } from "react";
import type { Track } from "./types";

type UseMediaSessionOptions = {
  currentTime: number;
  duration: number;
  onNext(): void;
  onPause(): void;
  onPlay(): void;
  onPrevious(): void;
  onSeek(seconds: number): void;
  playing: boolean;
  playlistLabel: string;
  track?: Track;
};

export function useMediaSession({
  currentTime,
  duration,
  onNext,
  onPause,
  onPlay,
  onPrevious,
  onSeek,
  playing,
  playlistLabel,
  track,
}: UseMediaSessionOptions) {
  const callbacksRef = useRef({
    currentTime,
    onNext,
    onPause,
    onPlay,
    onPrevious,
    onSeek,
  });

  callbacksRef.current = {
    currentTime,
    onNext,
    onPause,
    onPlay,
    onPrevious,
    onSeek,
  };

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    const session = navigator.mediaSession;

    const setHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null
    ) => {
      try {
        session.setActionHandler(action, handler);
      } catch {}
    };

    setHandler("play", () => callbacksRef.current.onPlay());
    setHandler("pause", () => callbacksRef.current.onPause());
    setHandler("previoustrack", () => callbacksRef.current.onPrevious());
    setHandler("nexttrack", () => callbacksRef.current.onNext());
    setHandler("seekbackward", (details) => {
      callbacksRef.current.onSeek(
        callbacksRef.current.currentTime - (details.seekOffset ?? 10)
      );
    });
    setHandler("seekforward", (details) => {
      callbacksRef.current.onSeek(
        callbacksRef.current.currentTime + (details.seekOffset ?? 10)
      );
    });
    setHandler("seekto", (details) => {
      if (details.seekTime == null) {
        return;
      }

      callbacksRef.current.onSeek(details.seekTime);
    });

    return () => {
      setHandler("play", null);
      setHandler("pause", null);
      setHandler("previoustrack", null);
      setHandler("nexttrack", null);
      setHandler("seekbackward", null);
      setHandler("seekforward", null);
      setHandler("seekto", null);
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    if (!track) {
      navigator.mediaSession.metadata = null;
      return;
    }

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        album: playlistLabel,
        artist: track.singer ?? track.artist ?? playlistLabel,
        artwork: [
          {
            sizes: "480x360",
            src: `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`,
            type: "image/jpeg",
          },
        ],
        title: track.title,
      });
    } catch {}
  }, [playlistLabel, track]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [playing]);

  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !("mediaSession" in navigator) ||
      duration <= 0
    ) {
      return;
    }

    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(Math.floor(currentTime), duration),
      });
    } catch {}
  }, [currentTime, duration]);
}
