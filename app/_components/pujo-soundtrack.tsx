"use client";

import { AGOMONI_PLAYLIST, FALLBACK_TRACKS } from "@/src/audio/playlists";
import type { Track } from "@/src/audio/types";
import { usePlayback } from "@/src/audio/usePlayback";
import { useYouTubeHost } from "@/src/audio/useYouTubeHost";

function formatTime(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(whole / 60);
  const remainder = whole % 60;

  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

type PujoSoundtrackProps = {
  tracks?: Track[];
};

export function PujoSoundtrack({ tracks = FALLBACK_TRACKS }: PujoSoundtrackProps) {
  const playback = usePlayback({
    playlist: AGOMONI_PLAYLIST,
    tracks: tracks.length > 0 ? tracks : FALLBACK_TRACKS,
  });

  const { hostRef } = useYouTubeHost({
    onError: playback.handleError,
    onReady: playback.handleReady,
    onStateChange: playback.handleStateChange,
    videoId: playback.track?.id,
  });

  const buttonLabel = playback.pending
    ? "Calling the soundtrack..."
    : playback.playing
      ? "Pause the soundtrack"
      : "Start the soundtrack";

  const statusLabel = playback.playing
    ? "The pandal is singing now."
    : playback.pending
      ? "Hold on. The first tap is on its way to the hidden player."
      : "One tap, and the evening begins to breathe.";

  return (
    <>
      <div ref={hostRef} aria-hidden="true" className="pujo-soundtrack__host" />

      <div className="pujo-soundtrack">
        <p aria-live="polite" className="pujo-soundtrack__status">
          {statusLabel}
        </p>

        <div className="pujo-soundtrack__controls">
          <button
            className="pujo-soundtrack__button"
            type="button"
            onClick={playback.toggle}
          >
            {buttonLabel}
          </button>

          {playback.tracks.length > 1 ? (
            <button
              className="pujo-soundtrack__button pujo-soundtrack__button--ghost"
              type="button"
              onClick={playback.next}
            >
              Next memory
            </button>
          ) : null}
        </div>

        <div className="pujo-soundtrack__meta">
          <p className="pujo-soundtrack__line">
            {AGOMONI_PLAYLIST.label} playlist
            <span aria-hidden="true"> · </span>
            Track {playback.index + 1} of {playback.tracks.length}
          </p>
          <p className="pujo-soundtrack__line">
            {playback.track?.title ?? "Waiting for the first song"}
            <span aria-hidden="true"> · </span>
            {playback.ready
              ? `${formatTime(playback.currentTime)} / ${formatTime(playback.duration)}`
              : "warming the speakers"}
          </p>
        </div>
      </div>
    </>
  );
}
