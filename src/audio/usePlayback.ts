import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createKeepAlive, destroyKeepAlive } from "./keepAlive";
import {
  FATAL_PLAYER_ERRORS,
  PROGRESS_POLL_MS,
  RESUME_MIN_SECONDS,
  REWIND_THRESHOLD,
  STORAGE_KEYS,
} from "./constants";
import { useMediaSession } from "./useMediaSession";
import { usePersistedPlayback } from "./usePersistedPlayback";
import { useShuffle } from "./useShuffle";
import { useSleepTimer } from "./useSleepTimer";
import { safeWriteStorage, useStoredString } from "./storage";
import { useTabExclusivity } from "./useTabExclusivity";
import { useVolume } from "./useVolume";
import { useVisibility } from "./useVisibility";
import { useWatchdog } from "./useWatchdog";
import type {
  AdvanceReason,
  Playlist,
  Repeat,
  Track,
  SleepTimerValue,
  YouTubePlayer,
} from "./types";

type UsePlaybackOptions = {
  playlist: Playlist;
  tracks: Track[];
  repeatByDefault?: Repeat;
};

function normalizeIndex(nextIndex: number, length: number) {
  return ((nextIndex % length) + length) % length;
}

function normalizeRepeat(raw: string | null, fallback: Repeat): Repeat {
  if (raw === "all" || raw === "one" || raw === "off") {
    return raw;
  }

  return fallback;
}

function getSeekStep(duration: number) {
  if (duration > 1800) {
    return 60;
  }

  if (duration > 600) {
    return 30;
  }

  return 10;
}

export function usePlayback({
  playlist,
  tracks,
  repeatByDefault = "all",
}: UsePlaybackOptions) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const keepAliveRef = useRef<HTMLAudioElement | null>(null);
  const deadTrackIdsRef = useRef(new Set<string>());
  const didResumeRef = useRef(false);
  const fadeInTrackIdRef = useRef<string | null>(null);

  const repeatRaw = useStoredString(STORAGE_KEYS.repeat);
  const repeat = useMemo(
    () => normalizeRepeat(repeatRaw, repeatByDefault),
    [repeatByDefault, repeatRaw]
  );
  const {
    hydrated: playbackHydrated,
    savePlayback,
    savedPlayback,
  } = usePersistedPlayback(playlist.slug);

  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [initialTrackResolved, setInitialTrackResolved] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const {
    consumeTrackEndStop,
    finishExpiring,
    setSleepTimer,
    shouldSleepNow,
    sleepLabel,
    sleepTimer,
  } = useSleepTimer();

  const preferredTrackId = useMemo(() => {
    if (savedPlayback && tracks.some((track) => track.id === savedPlayback.id)) {
      return savedPlayback.id;
    }

    return tracks[0]?.id ?? null;
  }, [savedPlayback, tracks]);

  useEffect(() => {
    didResumeRef.current = false;
    deadTrackIdsRef.current.clear();
    fadeInTrackIdRef.current = null;
    setCurrentTrackId(null);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    setPending(false);
    setInitialTrackResolved(false);
  }, [playlist.slug]);

  useEffect(() => {
    if (!playbackHydrated) {
      return;
    }

    setCurrentTrackId((previousTrackId) => {
      if (
        previousTrackId &&
        tracks.some((track) => track.id === previousTrackId)
      ) {
        return previousTrackId;
      }

      return preferredTrackId;
    });
    setInitialTrackResolved(true);
  }, [playbackHydrated, preferredTrackId, tracks]);

  const { orderedTracks, shuffled, toggleShuffle } = useShuffle({
    currentTrackId,
    shuffleByDefault: playlist.shuffleByDefault,
    slug: playlist.slug,
    tracks,
  });

  const track = useMemo(() => {
    if (orderedTracks.length === 0) {
      return undefined;
    }

    return (
      orderedTracks.find((candidate) => candidate.id === currentTrackId) ??
      orderedTracks[0]
    );
  }, [currentTrackId, orderedTracks]);

  const index = useMemo(() => {
    if (!track) {
      return 0;
    }

    const foundIndex = orderedTracks.findIndex(
      (candidate) => candidate.id === track.id
    );

    return foundIndex < 0 ? 0 : foundIndex;
  }, [orderedTracks, track]);

  const currentId = track?.id;
  const seekStep = useMemo(() => getSeekStep(duration), [duration]);

  useEffect(() => {
    if (track || !orderedTracks[0]) {
      return;
    }

    setCurrentTrackId(orderedTracks[0].id);
  }, [orderedTracks, track]);

  useEffect(() => {
    if (!currentId) {
      return;
    }

    fadeInTrackIdRef.current = currentId;
  }, [currentId]);

  useEffect(() => {
    if (!savedPlayback || savedPlayback.time <= RESUME_MIN_SECONDS) {
      didResumeRef.current = true;
      return;
    }

    if (initialTrackResolved && currentId && currentId !== savedPlayback.id) {
      didResumeRef.current = true;
    }
  }, [currentId, initialTrackResolved, savedPlayback]);

  const {
    applyVolume,
    changeVolume,
    fadeIn,
    fadeToSilence,
    muted,
    resetFade,
    toggleMute,
    volume,
  } = useVolume({
    currentTime,
    duration,
    playerRef,
    playing,
    ready,
    repeat,
  });

  const setRepeat = useCallback((nextRepeat: Repeat) => {
    safeWriteStorage(STORAGE_KEYS.repeat, nextRepeat);
  }, []);

  const stopPlayback = useCallback(() => {
    playerRef.current?.pauseVideo();
    setPending(false);
    setPlaying(false);
    resetFade();
  }, [resetFade]);

  const seek = useCallback(
    (seconds: number) => {
      const nextTime =
        duration > 0
          ? Math.max(0, Math.min(seconds, duration))
          : Math.max(0, seconds);

      resetFade();
      playerRef.current?.seekTo(nextTime, true);
      setCurrentTime(nextTime);
    },
    [duration, resetFade]
  );

  const select = useCallback(
    (nextIndex: number) => {
      if (orderedTracks.length === 0) {
        return;
      }

      const normalized = normalizeIndex(nextIndex, orderedTracks.length);
      const nextTrack = orderedTracks[normalized];

      if (!nextTrack) {
        return;
      }

      setCurrentTime(0);
      setDuration(0);
      setPlaying(false);
      resetFade();
      setCurrentTrackId(nextTrack.id);
    },
    [orderedTracks, resetFade]
  );

  const advance = useCallback(
    (reason: AdvanceReason) => {
      if (orderedTracks.length === 0) {
        return;
      }

      setCurrentTime(0);
      setDuration(0);

      if (reason === "ended" && consumeTrackEndStop()) {
        stopPlayback();
        return;
      }

      if (reason === "ended" && repeat === "one" && currentId) {
        fadeInTrackIdRef.current = currentId;
        resetFade();
        playerRef.current?.seekTo(0, true);
        playerRef.current?.playVideo();
        return;
      }

      const lastTrack = index >= orderedTracks.length - 1;

      if (lastTrack && repeat === "off" && reason === "ended") {
        stopPlayback();
        return;
      }

      const nextTrack = orderedTracks[lastTrack ? 0 : index + 1];

      if (!nextTrack) {
        stopPlayback();
        return;
      }

      setPlaying(false);
      resetFade();
      setCurrentTrackId(nextTrack.id);
    },
    [consumeTrackEndStop, currentId, index, orderedTracks, repeat, resetFade, stopPlayback]
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
    stopPlayback();
  }, [stopPlayback]);

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

    if (orderedTracks.length === 0) {
      return;
    }

    select(index <= 0 ? orderedTracks.length - 1 : index - 1);
  }, [currentTime, index, orderedTracks.length, seek, select]);

  const seekBy = useCallback(
    (delta: number) => {
      seek(currentTime + delta);
    },
    [currentTime, seek]
  );

  const resumeOnce = useCallback(() => {
    if (didResumeRef.current || !savedPlayback || !currentId) {
      return;
    }

    if (savedPlayback.time <= RESUME_MIN_SECONDS || savedPlayback.id !== currentId) {
      return;
    }

    didResumeRef.current = true;
    playerRef.current?.seekTo(savedPlayback.time, true);
    setCurrentTime(savedPlayback.time);
  }, [currentId, savedPlayback]);

  const handleReady = useCallback(
    (player: YouTubePlayer) => {
      playerRef.current = player;
      setDuration(player.getDuration() ?? 0);
      setReady(true);
      applyVolume();
      resumeOnce();

      if (pending) {
        setPending(false);
        player.playVideo();
      }
    },
    [applyVolume, pending, resumeOnce]
  );

  const { armStall, clearStall, noteProgress } = useWatchdog({
    onAdvance: () => advance("stalled"),
    playerRef,
    playing,
  });

  const handleStateChange = useCallback(
    (code: number) => {
      if (code === 1 || code === 5) {
        resumeOnce();
      }

      if (code === 1) {
        setPlaying(true);
        setPending(false);

        if (currentId && fadeInTrackIdRef.current === currentId) {
          fadeInTrackIdRef.current = null;
          fadeIn();
        }

        clearStall();
        return;
      }

      if (code === 2) {
        setPlaying(false);
        resetFade();
        clearStall();
        return;
      }

      if (code === 3) {
        armStall();
        return;
      }

      if (code === 0) {
        clearStall();
        setPlaying(false);
        advance("ended");
      }
    },
    [advance, armStall, clearStall, currentId, fadeIn, resetFade, resumeOnce]
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

      for (let step = 1; step <= orderedTracks.length; step += 1) {
        const probeIndex = (index + step) % orderedTracks.length;
        const probeTrack = orderedTracks[probeIndex];

        if (probeTrack && !deadTrackIdsRef.current.has(probeTrack.id)) {
          resetFade();
          setCurrentTrackId(probeTrack.id);
          return;
        }
      }

      stopPlayback();
    },
    [currentId, index, orderedTracks, resetFade, stopPlayback]
  );


  useTabExclusivity({
    onYield: () => {
      setPending(false);
      setPlaying(false);
      resetFade();
    },
    playerRef,
    playing,
  });

  useVisibility({
    currentTime,
    playing,
    playerRef,
    playlistSlug: playlist.slug,
    trackId: currentId,
  });

  useMediaSession({
    currentTime,
    duration,
    onNext: next,
    onPause: pause,
    onPlay: play,
    onPrevious: previous,
    onSeek: seek,
    playing,
    playlistLabel: playlist.label,
    track,
  });

  useEffect(() => {
    if (!ready) {
      return;
    }

    const pollId = window.setInterval(() => {
      const player = playerRef.current;

      if (!player) {
        return;
      }

      const nextTime = player.getCurrentTime() ?? 0;
      const nextDuration = player.getDuration() ?? 0;

      setCurrentTime(nextTime);
      setDuration(nextDuration);
      noteProgress(nextTime);

      if (shouldSleepNow()) {
        void fadeToSilence()
          .then(() => {
            stopPlayback();
            resetFade();
          })
          .finally(() => {
            finishExpiring();
          });
      }
    }, PROGRESS_POLL_MS);

    return () => {
      window.clearInterval(pollId);
    };
  }, [
    fadeToSilence,
    finishExpiring,
    noteProgress,
    ready,
    resetFade,
    shouldSleepNow,
    stopPlayback,
  ]);

  useEffect(() => {
    if (!playing || !currentId) {
      return;
    }

    savePlayback(currentId, Math.floor(currentTime));
  }, [currentId, currentTime, playing, savePlayback]);

  useEffect(() => {
    if (!playing) {
      keepAliveRef.current?.pause();
      return;
    }

    keepAliveRef.current ??= createKeepAlive();
    void keepAliveRef.current.play().catch(() => {});
  }, [playing]);

  useEffect(() => {
    return () => {
      if (!keepAliveRef.current) {
        return;
      }

      destroyKeepAlive(keepAliveRef.current);
      keepAliveRef.current = null;
    };
  }, []);

  return {
    changeVolume,
    currentTime,
    duration,
    handleError,
    handleReady,
    handleStateChange,
    index,
    muted,
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
    seekStep,
    select,
    setRepeat,
    setSleepTimer: setSleepTimer as (value: SleepTimerValue) => void,
    shuffled,
    sleepLabel,
    sleepTimer,
    toggleMute,
    toggleShuffle,
    toggle,
    track,
    tracks: orderedTracks,
    volume,
  };
}
