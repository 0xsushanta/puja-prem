import { useEffect, useRef } from "react";
import { YOUTUBE_IFRAME_API_SRC } from "./constants";
import type { YouTubePlayer } from "./types";

type UseYouTubeHostOptions = {
  onError(code: number): void;
  onReady(player: YouTubePlayer): void;
  onStateChange(code: number): void;
  videoId?: string;
};

export function useYouTubeHost({
  onError,
  onReady,
  onStateChange,
  videoId,
}: UseYouTubeHostOptions) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const lastLoadedIdRef = useRef<string | null>(null);
  const latestVideoIdRef = useRef(videoId);
  const latestHandlersRef = useRef({
    onError,
    onReady,
    onStateChange,
  });

  useEffect(() => {
    latestVideoIdRef.current = videoId;
    latestHandlersRef.current = {
      onError,
      onReady,
      onStateChange,
    };
  }, [videoId, onError, onReady, onStateChange]);

  useEffect(() => {
    let cancelled = false;

    const initPlayer = () => {
      if (
        cancelled ||
        playerRef.current ||
        !hostRef.current ||
        !window.YT?.Player
      ) {
        return;
      }

      const initialId = latestVideoIdRef.current;

      if (initialId) {
        lastLoadedIdRef.current = initialId;
      }

      playerRef.current = new window.YT.Player(hostRef.current, {
        events: {
          onError: (event) => {
            latestHandlersRef.current.onError(event.data);
          },
          onReady: (event) => {
            playerRef.current = event.target;
            latestHandlersRef.current.onReady(event.target);
          },
          onStateChange: (event) => {
            latestHandlersRef.current.onStateChange(event.data);
          },
        },
        playerVars: {
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          modestbranding: 1,
          origin: window.location.origin,
          playsinline: 1,
          rel: 0,
        },
        videoId: initialId,
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      if (!document.querySelector(`script[src="${YOUTUBE_IFRAME_API_SRC}"]`)) {
        const script = document.createElement("script");

        script.src = YOUTUBE_IFRAME_API_SRC;
        script.async = true;
        document.head.appendChild(script);
      }

      const previous = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        initPlayer();
      };
    }

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;

    if (!player || !videoId || videoId === lastLoadedIdRef.current) {
      return;
    }

    lastLoadedIdRef.current = videoId;
    player.loadVideoById(videoId);
  }, [videoId]);

  return {
    hostRef,
  };
}
