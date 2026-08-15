import { fetchPlaylistTracks } from "@/src/audio/fetchPlaylist";
import { AGOMONI_PLAYLIST } from "@/src/audio/playlists";
import { PujoHero } from "./_components/pujo-hero";

export const revalidate = 3600;

export default async function Home() {
  const tracks = await fetchPlaylistTracks(AGOMONI_PLAYLIST.playlistId ?? "PLPB-o9PZQHGs");

  return <PujoHero tracks={tracks} />;
}
