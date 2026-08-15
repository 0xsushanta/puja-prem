"use client";

import { useState } from "react";
import { AGOMONI_PLAYLIST, FALLBACK_TRACKS } from "@/src/audio/playlists";
import type { Track, Repeat } from "@/src/audio/types";
import { usePlayback } from "@/src/audio/usePlayback";
import { useYouTubeHost } from "@/src/audio/useYouTubeHost";

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(whole / 60);
  const remainder = whole % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

type PujoSoundtrackProps = {
  tracks?: Track[];
};

export function PujoSoundtrack({ tracks = FALLBACK_TRACKS }: PujoSoundtrackProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const activeTracks = tracks.length > 0 ? tracks : FALLBACK_TRACKS;

  const playback = usePlayback({
    playlist: AGOMONI_PLAYLIST,
    tracks: activeTracks,
  });

  const { hostRef } = useYouTubeHost({
    onError: playback.handleError,
    onReady: playback.handleReady,
    onStateChange: playback.handleStateChange,
    videoId: playback.track?.id,
  });

  const cycleRepeat = () => {
    const nextRepeat: Record<Repeat, Repeat> = {
      all: "one",
      one: "off",
      off: "all",
    };
    playback.setRepeat(nextRepeat[playback.repeat]);
  };

  const progressPercent = playback.duration > 0
    ? (playback.currentTime / playback.duration) * 100
    : 0;

  return (
    <>
      {/* Hidden YouTube Iframe Host */}
      <div ref={hostRef} aria-hidden="true" className="pujo-soundtrack__host" />

      {/* Floating Bottom Dock (busdriver.wtf style) */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center px-3 pb-4 sm:px-6 sm:pb-6 pointer-events-none">
        
        {/* Tracklist Popover Drawer */}
        {drawerOpen && (
          <div className="pointer-events-auto mb-3 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-[#140b09]/90 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition-all duration-300">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-[#dfbd73] shadow-[0_0_8px_#dfbd73]" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7ead7]/90">
                  {AGOMONI_PLAYLIST.label} Playlist
                </h3>
                <span className="text-[10px] text-[#f7ead7]/50">
                  · {playback.tracks.length} tracks
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full p-1 text-xs text-[#f7ead7]/60 hover:bg-white/10 hover:text-white transition"
                aria-label="Close tracklist"
              >
                ✕
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin">
              {playback.tracks.map((t, idx) => {
                const isSelected = t.id === playback.track?.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      playback.select(idx);
                      if (!playback.playing) playback.play();
                    }}
                    className={`group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition ${
                      isSelected
                        ? "bg-white/12 text-[#dfbd73] font-semibold"
                        : "text-[#f7ead7]/80 hover:bg-white/6 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-5 text-center text-[10px] tabular-nums opacity-50">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs">{t.title}</p>
                        <p className="truncate text-[10px] opacity-60">
                          {t.singer || t.artist}
                        </p>
                      </div>
                    </div>

                    {isSelected && playback.playing && (
                      <div className="flex items-end gap-0.5 h-3">
                        <span className="w-0.5 bg-[#dfbd73] rounded-full animate-soundwave-1" />
                        <span className="w-0.5 bg-[#dfbd73] rounded-full animate-soundwave-2" />
                        <span className="w-0.5 bg-[#dfbd73] rounded-full animate-soundwave-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Player Bar */}
        <div className="pointer-events-auto flex w-full max-w-2xl flex-col gap-2.5 rounded-3xl border border-white/15 bg-[#140b09]/80 p-3 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition-all hover:border-white/25 sm:flex-row sm:items-center sm:gap-4 sm:rounded-full sm:py-2.5 sm:pl-3.5 sm:pr-5">
          
          {/* Track Info & Vinyl Icon */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Spinning Vinyl Disc Badge */}
            <div
              onClick={() => setDrawerOpen((prev) => !prev)}
              className="group relative size-11 shrink-0 cursor-pointer grid place-items-center rounded-full bg-[#1c0e0a] ring-1 ring-white/20 shadow-md transition hover:scale-105"
              title="Click to view playlist"
            >
              <div
                className={`size-full rounded-full border-2 border-dashed border-[#dfbd73]/40 bg-gradient-to-tr from-[#2d1610] to-[#140b09] grid place-items-center ${
                  playback.playing ? "animate-spin-slow" : ""
                }`}
              >
                <div className="size-3.5 rounded-full bg-[#dfbd73] ring-2 ring-[#120907] shadow-[0_0_8px_#dfbd73]" />
              </div>
            </div>

            {/* Title & Singer */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#f7ead7] leading-tight">
                {playback.track?.title ?? "Waiting for soundtrack..."}
              </p>
              <p className="truncate text-[11px] text-[#f7ead7]/60 leading-tight mt-0.5">
                {playback.track?.singer || playback.track?.artist || "Agomoni Playlist"}
              </p>
            </div>
          </div>

          {/* Progress Bar & Time */}
          <div className="flex flex-1 items-center gap-2 px-1 sm:px-0">
            <span className="w-8 text-right text-[10px] tabular-nums text-[#f7ead7]/50">
              {formatTime(playback.currentTime)}
            </span>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min={0}
                max={playback.duration || 100}
                value={playback.currentTime}
                onChange={(e) => playback.seek(Number(e.target.value))}
                className="scrubber-input"
                style={{
                  background: `linear-gradient(to right, #dfbd73 ${progressPercent}%, rgba(255,255,255,0.15) ${progressPercent}%)`,
                }}
                aria-label="Seek track"
              />
            </div>
            <span className="w-8 text-left text-[10px] tabular-nums text-[#f7ead7]/50">
              {formatTime(playback.duration)}
            </span>
          </div>

          {/* Main Controls (Prev / Play-Pause / Next) */}
          <div className="flex items-center justify-between sm:justify-end gap-1">
            
            {/* Previous */}
            <button
              type="button"
              onClick={playback.previous}
              className="grid size-8 place-items-center rounded-full text-[#f7ead7]/75 transition hover:bg-white/10 hover:text-white active:scale-90"
              aria-label="Previous track"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
                <rect x="5" y="6" width="2" height="12" rx="1" />
                <path d="M18 7.06a.8.8 0 0 0-1.23-.68l-8 4.94a.8.8 0 0 0 0 1.36l8 4.94a.8.8 0 0 0 1.23-.68V7.06Z" />
              </svg>
            </button>

            {/* Play/Pause Main Button */}
            <button
              type="button"
              onClick={playback.toggle}
              className="grid size-11 place-items-center rounded-full bg-[#f7ead7] text-[#140b09] shadow-[0_4px_20px_rgba(223,189,115,0.3)] transition hover:scale-105 active:scale-95"
              aria-label={playback.playing ? "Pause" : "Play"}
            >
              {playback.pending ? (
                <span className="size-4 rounded-full border-2 border-[#140b09] border-t-transparent animate-spin" />
              ) : playback.playing ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
                  <rect x="7" y="5" width="3.5" height="14" rx="1.5" />
                  <rect x="13.5" y="5" width="3.5" height="14" rx="1.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-5 ml-0.5">
                  <path d="M8 5.14v13.72a.8.8 0 0 0 1.23.67l10.5-6.86a.8.8 0 0 0 0-1.36L9.23 4.47A.8.8 0 0 0 8 5.14Z" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={playback.next}
              className="grid size-8 place-items-center rounded-full text-[#f7ead7]/75 transition hover:bg-white/10 hover:text-white active:scale-90"
              aria-label="Next track"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
                <path d="M6 7.06a.8.8 0 0 1 1.23-.68l8 4.94a.8.8 0 0 1 0 1.36l-8 4.94A.8.8 0 0 1 6 16.94V7.06Z" />
                <rect x="17" y="6" width="2" height="12" rx="1" />
              </svg>
            </button>

            {/* Mode & Drawer Controls */}
            <div className="flex items-center gap-1 border-l border-white/10 pl-1.5 ml-1">
              {/* Shuffle */}
              <button
                type="button"
                onClick={playback.toggleShuffle}
                className={`grid size-7 place-items-center rounded-full transition text-[11px] ${
                  playback.shuffled
                    ? "bg-[#dfbd73]/20 text-[#dfbd73] font-bold"
                    : "text-[#f7ead7]/50 hover:text-[#f7ead7]"
                }`}
                title={playback.shuffled ? "Shuffle On" : "Shuffle Off"}
                aria-label="Toggle shuffle"
              >
                🔀
              </button>

              {/* Repeat */}
              <button
                type="button"
                onClick={cycleRepeat}
                className={`grid size-7 place-items-center rounded-full transition text-[11px] ${
                  playback.repeat !== "off"
                    ? "bg-[#dfbd73]/20 text-[#dfbd73] font-bold"
                    : "text-[#f7ead7]/50 hover:text-[#f7ead7]"
                }`}
                title={`Repeat: ${playback.repeat}`}
                aria-label="Toggle repeat"
              >
                {playback.repeat === "one" ? "🔂" : "🔁"}
              </button>

              {/* Volume Slider / Toggle */}
              <div
                className="relative flex items-center"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  type="button"
                  onClick={playback.toggleMute}
                  className="grid size-7 place-items-center rounded-full text-[#f7ead7]/60 transition hover:text-white"
                  title={playback.muted ? "Unmute" : "Mute"}
                  aria-label="Toggle mute"
                >
                  {playback.muted || playback.volume === 0 ? "🔇" : "🔊"}
                </button>

                {showVolumeSlider && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-xl border border-white/15 bg-[#140b09]/90 shadow-lg backdrop-blur-md">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={playback.muted ? 0 : playback.volume}
                      onChange={(e) => playback.changeVolume(Number(e.target.value))}
                      className="h-16 w-3 accent-[#dfbd73] cursor-pointer"
                      style={{ writingMode: "vertical-lr", direction: "rtl" }}
                      aria-label="Volume slider"
                    />
                  </div>
                )}
              </div>

              {/* Playlist Drawer Toggle */}
              <button
                type="button"
                onClick={() => setDrawerOpen((prev) => !prev)}
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold transition ${
                  drawerOpen
                    ? "bg-[#dfbd73] text-[#140b09]"
                    : "bg-white/10 text-[#f7ead7]/80 hover:bg-white/15 hover:text-white"
                }`}
                title="Playlist Tracks"
                aria-label="Toggle playlist drawer"
              >
                <span>☰</span>
                <span className="hidden sm:inline">{playback.tracks.length}</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}
