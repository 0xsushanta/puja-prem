export type Repeat = "all" | "one" | "off";
export type SleepTimerValue = number | "track-end" | null;

export type Track = {
  id: string;
  title: string;
  rawTitle: string;
  artist: string;
  singer?: string;
  chapters?: { at: number; label: string }[];
};

export type Playlist = {
  slug: string;
  label: string;
  trackIds: string[];
  shuffleByDefault?: boolean;
};

export type AdvanceReason = "ended" | "manual" | "error" | "stalled";

export type YouTubePlayer = {
  destroy(): void;
  getCurrentTime(): number;
  getDuration(): number;
  loadVideoById(videoId: string): void;
  pauseVideo(): void;
  playVideo(): void;
  setVolume(volume: number): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
};

export type YouTubePlayerConstructor = new (
  element: HTMLElement,
  config: {
    videoId?: string;
    playerVars?: Record<string, number | string>;
    events?: {
      onError?: (event: { data: number }) => void;
      onReady?: (event: { target: YouTubePlayer }) => void;
      onStateChange?: (event: { data: number }) => void;
    };
  }
) => YouTubePlayer;

declare global {
  interface Window {
    YT?: {
      Player: YouTubePlayerConstructor;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
