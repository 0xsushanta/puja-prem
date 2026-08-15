import type { Playlist, Track } from "./types";

const TRACK_LIBRARY: Record<string, Track> = {
  E2zfQEo7Q_M: {
    id: "E2zfQEo7Q_M",
    title: "Ebar Jeno Onno Rokom Pujo",
    rawTitle: "Ebar Jeno Onno Rokom Pujo | Yoddha | Dev | Mimi | Raj Chakraborty | SVF",
    artist: "SVF",
    singer: "Arijit Singh",
  },
  xlElO06nQy8: {
    id: "xlElO06nQy8",
    title: "Dugga Elo",
    rawTitle: "Dugga Elo - Official Video | Monali Thakur | Guddu | Indranil Das",
    artist: "Zee Music Bangla",
    singer: "Monali Thakur",
  },
  sPuZ0Q3KDWo: {
    id: "sPuZ0Q3KDWo",
    title: "Dugga Ma",
    rawTitle: "Dugga Ma (দুগ্গা মা) | Arijit Singh | Bolo Dugga Maiki | Ankush | Nusrat | Arindom | Raj Chakraborty",
    artist: "SVF",
    singer: "Arijit Singh",
  },
  NAUA2LM9hZc: {
    id: "NAUA2LM9hZc",
    title: "Elo Je Maa",
    rawTitle: "Elo Je Maa (এলো যে মা) | Challenge 2 | Dev | Puja | Abhijeet | Shreya | Jeet Gannguli | SVF Music",
    artist: "SVF Music",
    singer: "Abhijeet & Shreya Ghoshal",
  },
  "3Gg0GP8DxhU": {
    id: "3Gg0GP8DxhU",
    title: "Dugga Ma (Full Video)",
    rawTitle: "Dugga Ma | Bolo Dugga Maiki | Full Video Song | Arijit Singh | Ankush H | Nusrat J | SVF Music",
    artist: "SVF Music",
    singer: "Arijit Singh",
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
