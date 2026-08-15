import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { PLAYBACK_CHANNEL_NAME } from "./constants";
import type { YouTubePlayer } from "./types";

type UseTabExclusivityOptions = {
  onYield(): void;
  playerRef: RefObject<YouTubePlayer | null>;
  playing: boolean;
};

function createTabId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useTabExclusivity({
  onYield,
  playerRef,
  playing,
}: UseTabExclusivityOptions) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const tabIdRef = useRef(createTabId());

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") {
      return;
    }

    const channel = new BroadcastChannel(PLAYBACK_CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      if (event.data?.type !== "playing" || event.data.id === tabIdRef.current) {
        return;
      }

      playerRef.current?.pauseVideo();
      onYield();
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [onYield, playerRef]);

  useEffect(() => {
    if (!playing) {
      return;
    }

    channelRef.current?.postMessage({
      id: tabIdRef.current,
      type: "playing",
    });
  }, [playing]);
}
