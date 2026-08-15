import type { Track } from "./types";
import { FALLBACK_TRACKS } from "./playlists";

function cleanTitle(rawTitle: string): { title: string; singer?: string } {
  // Strip common YouTube title noise like | SVF, | Official Video, etc.
  let cleaned = rawTitle
    .replace(/\s*\|.*$/, "") // Strip everything after first pipe if present
    .replace(/\s*\([^)]*official[^)]*\)/gi, "")
    .replace(/\s*\[[^\]]*official[^\]]*\]/gi, "")
    .replace(/\s*-\s*Official Video.*$/gi, "")
    .trim();

  // If title has (Bengali text), clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, " ");

  return { title: cleaned || rawTitle };
}

async function fetchOEmbed(videoId: string): Promise<Track | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { next: { revalidate: 86400 } } // Cache individual video metadata for 24h
    );

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as {
      title?: string;
      author_name?: string;
    };

    if (!data.title) {
      return null;
    }

    const rawTitle = data.title;
    const { title } = cleanTitle(rawTitle);

    return {
      id: videoId,
      title,
      rawTitle,
      artist: data.author_name || "Puja Prem",
    };
  } catch {
    return null;
  }
}

export async function fetchPlaylistTracks(playlistId: string): Promise<Track[]> {
  try {
    const res = await fetch(
      `https://www.youtube.com/playlist?list=${playlistId}`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, CCSS/1.0)",
        },
        next: { revalidate: 3600 }, // Revalidate playlist page hourly
      }
    );

    if (!res.ok) {
      return FALLBACK_TRACKS;
    }

    const html = await res.text();
    const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    const videoIds: string[] = [];
    const seen = new Set<string>();

    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      const id = match[1];
      if (id && !seen.has(id)) {
        seen.add(id);
        videoIds.push(id);
      }
    }

    if (videoIds.length === 0) {
      return FALLBACK_TRACKS;
    }

    // Fetch oEmbed metadata in parallel with concurrency limit or Promise.all
    const tracksOrNull = await Promise.all(videoIds.map(fetchOEmbed));
    const validTracks = tracksOrNull.filter(
      (t): t is Track => t !== null
    );

    if (validTracks.length === 0) {
      return FALLBACK_TRACKS;
    }

    return validTracks;
  } catch {
    return FALLBACK_TRACKS;
  }
}
