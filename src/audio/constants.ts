export const PROGRESS_POLL_MS = 250;
export const RESUME_MIN_SECONDS = 5;
export const REWIND_THRESHOLD = 3;
export const AWAY_GRACE_MS = 1_800_000;
export const DEFAULT_VOLUME = 80;
export const FADE_OUT_S = 2.5;
export const FADE_IN_S = 1.2;
export const LONG_FORM_FADE_CUTOFF_S = 900;
export const SLEEP_FADE_MS = 8_000;
export const STALL_GRACE_MS = 15_000;
export const STALL_ESCAPE_MS = 8_000;

export const YOUTUBE_IFRAME_API_SRC = "https://www.youtube.com/iframe_api";

export const FATAL_PLAYER_ERRORS = new Set([2, 5, 100, 101, 150]);

export const STORAGE_EVENT_PREFIX = "pujoprem:storage";
export const PLAYBACK_CHANNEL_NAME = "pujoprem:playback";

export const STORAGE_KEYS = {
  muted: "pujoprem:muted:v1",
  playback: (slug: string) => `pujoprem:playback:v1:${slug}`,
  repeat: "pujoprem:repeat:v1",
  shuffle: (slug: string) => `pujoprem:shuffle:v1:${slug}`,
  volume: "pujoprem:volume:v1",
};
