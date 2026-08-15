import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FATAL_PLAYER_ERRORS,
  PROGRESS_POLL_MS,
  REWIND_THRESHOLD,
} from "./constants";
import type {
  AdvanceReason,
  Repeat,
  Track,
  YouTubePlayer,
} from "./types";

type UsePlaybackOptions = {
  tracks: Track[];
  repeatByDefault?: Repeat;
};

export function usePlayback({
  tracks,
  repeatByDefault = "all",
}: UsePlaybackOptions) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const deadTrackIdsRef = useRef(new Set<string>());

  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState<Repeat>(repeatByDefault);

  const activeIndex = useMemo(() => {
    if (tracks.length === 0) {
      return 0;
    }

    return Math.min(index, tracks.length - 1);
  }, [index, tracks.length]);

  const track = useMemo(() => tracks[activeIndex], [activeIndex, tracks]);
  const currentId = track?.id;

  useEffect(() => {
    if (!ready) {
      return;
    }

    const pollId = window.setInterval(() => {
      const player = playerRef.current;

      if (!player) {
        return;
      }

      setCurrentTime(player.getCurrentTime() ?? 0);
      setDuration(player.getDuration() ?? 0);
    }, PROGRESS_POLL_MS);

    return () => {
      window.clearInterval(pollId);
    };
  }, [ready]);

  const seek = useCallback(
    (seconds: number) => {
      const nextTime =
        duration > 0 ? Math.max(0, Math.min(seconds, duration)) : Math.max(0, seconds);

      playerRef.current?.seekTo(nextTime, true);
      setCurrentTime(nextTime);
    },
    [duration]
  );

  const select = useCallback(
    (nextIndex: number) => {
      if (tracks.length === 0) {
        return;
      }

      const normalized =
        ((nextIndex % tracks.length) + tracks.length) % tracks.length;

      setCurrentTime(0);
      setDuration(0);
      setPlaying(false);
      setIndex(normalized);
    },
    [tracks.length]
  );

  const advance = useCallback(
    (reason: AdvanceReason) => {
      if (tracks.length === 0) {
        return;
      }

      setCurrentTime(0);
      setDuration(0);

      if (reason === "ended" && repeat === "one") {
        playerRef.current?.seekTo(0, true);
        playerRef.current?.playVideo();
        return;
      }

      const lastTrack = activeIndex >= tracks.length - 1;

      if (lastTrack && repeat === "off" && reason === "ended") {
        setPlaying(false);
        return;
      }

      setPlaying(false);
      setIndex(lastTrack ? 0 : activeIndex + 1);
    },
    [activeIndex, repeat, tracks.length]
  );

  const play = useCallback(() => {
    const player = playerRef.current;

    if (player) {
      player.playVideo();
      return;
    }

    setPending(true);
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
    setPending(false);
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (playing) {
      pause();
      return;
    }

    play();
  }, [pause, play, playing]);

  const next = useCallback(() => {
    advance("manual");
  }, [advance]);

  const previous = useCallback(() => {
    if (currentTime > REWIND_THRESHOLD) {
      seek(0);
      return;
    }

    if (tracks.length === 0) {
      return;
    }

    select(activeIndex <= 0 ? tracks.length - 1 : activeIndex - 1);
  }, [activeIndex, currentTime, seek, select, tracks.length]);

  const seekBy = useCallback(
    (delta: number) => {
      seek(currentTime + delta);
    },
    [currentTime, seek]
  );

  const handleReady = useCallback(
    (player: YouTubePlayer) => {
      playerRef.current = player;
      setDuration(player.getDuration() ?? 0);
      setReady(true);

      if (pending) {
        setPending(false);
        player.playVideo();
      }
    },
    [pending]
  );

  const handleStateChange = useCallback(
    (code: number) => {
      if (code === 1) {
        setPlaying(true);
        return;
      }

      if (code === 2) {
        setPlaying(false);
        return;
      }

      if (code === 0) {
        setPlaying(false);
        advance("ended");
      }
    },
    [advance]
  );

  const handleError = useCallback(
    (code: number) => {
      if (!FATAL_PLAYER_ERRORS.has(code) || !currentId) {
        return;
      }

      deadTrackIdsRef.current.add(currentId);

      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      for (let step = 1; step <= tracks.length; step += 1) {
        const probeIndex = (activeIndex + step) % tracks.length;
        const probeTrack = tracks[probeIndex];

        if (probeTrack && !deadTrackIdsRef.current.has(probeTrack.id)) {
          setIndex(probeIndex);
          return;
        }
      }
    },
    [activeIndex, currentId, tracks]
  );

  return {
    currentTime,
    duration,
    handleError,
    handleReady,
    handleStateChange,
    index: activeIndex,
    next,
    pause,
    pending,
    play,
    playing,
    previous,
    ready,
    repeat,
    seek,
    seekBy,
    select,
    setRepeat,
    toggle,
    track,
    tracks,
  };
}
