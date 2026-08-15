import type { Playlist, Track } from "./types";

const TRACK_LIBRARY: Record<string, Track> = {
  E2zfQEo7Q_M: {
    id: "E2zfQEo7Q_M",
    title: "Track 01",
    rawTitle: "Track 01",
    artist: "Puja Prem",
  },
  xlElO06nQy8: {
    id: "xlElO06nQy8",
    title: "Track 02",
    rawTitle: "Track 02",
    artist: "Puja Prem",
  },
  sPuZ0Q3KDWo: {
    id: "sPuZ0Q3KDWo",
    title: "Track 03",
    rawTitle: "Track 03",
    artist: "Puja Prem",
  },
  NAUA2LM9hZc: {
    id: "NAUA2LM9hZc",
    title: "Track 04",
    rawTitle: "Track 04",
    artist: "Puja Prem",
  },
  "3Gg0GP8DxhU": {
    id: "3Gg0GP8DxhU",
    title: "Track 05",
    rawTitle: "Track 05",
    artist: "Puja Prem",
  },
};

export const AGOMONI_PLAYLIST: Playlist = {
  slug: "agomoni",
  label: "Agomoni",
  shuffleByDefault: false,
  trackIds: [
    "E2zfQEo7Q_M",
    "xlElO06nQy8",
    "sPuZ0Q3KDWo",
    "NAUA2LM9hZc",
    "3Gg0GP8DxhU",
  ],
};

export const AGOMONI_TRACKS = AGOMONI_PLAYLIST.trackIds.map((id) => TRACK_LIBRARY[id]);
