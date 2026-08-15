import { fetchPlaylistTracks } from "@/src/audio/fetchPlaylist";
import { AGOMONI_PLAYLIST } from "@/src/audio/playlists";
import { PujoHero } from "./_components/pujo-hero";

export const revalidate = 3600;

export default async function Home() {
  const tracks = await fetchPlaylistTracks(AGOMONI_PLAYLIST.playlistId ?? "PLPB-o9PZQHGs");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://pujoprem.com/#website",
        "url": "https://pujoprem.com",
        "name": "Pujo Prem · Durga Puja Songs & Playlist",
        "alternateName": [
          "Durga Puja Playlist",
          "Durga Puja Songs",
          "Durga Puja Music",
          "Pujo Prem Playlist",
          "পূজা প্রেম"
        ],
        "description": "Listen to the ultimate non-stop Durga Puja songs playlist online.",
        "inLanguage": ["en-IN", "bn-IN"],
        "author": {
          "@type": "Person",
          "name": "Sushanta",
          "url": "https://x.com/0xsushanta"
        }
      },
      {
        "@type": "WebPage",
        "@id": "https://pujoprem.com/#webpage",
        "url": "https://pujoprem.com",
        "name": "Durga Puja Songs & Playlist — Non-stop Durga Puja Music",
        "description": "Press play on the ultimate Durga Puja playlist. Stream authentic Agomoni songs, Arijit Singh hits, and nostalgic Kolkata autumn music.",
        "isPartOf": { "@id": "https://pujoprem.com/#website" },
        "inLanguage": "en-IN",
        "mainEntity": { "@id": "https://pujoprem.com/#playlist" }
      },
      {
        "@type": "MusicPlaylist",
        "@id": "https://pujoprem.com/#playlist",
        "name": "Durga Puja Songs & Playlist — Non-stop Durga Puja Music",
        "description": "Non-stop Bengali Durga Puja songs, Agomoni music, Sharadiya songs, and nostalgic Kolkata autumn melodies.",
        "url": "https://pujoprem.com",
        "genre": ["Durga Puja", "Bengali Music", "Agomoni", "Festive", "Sharadiya"],
        "inLanguage": ["bn-IN", "en-IN"],
        "numTracks": tracks.length,
        "creator": {
          "@type": "Person",
          "name": "Sushanta",
          "url": "https://x.com/0xsushanta"
        },
        "track": tracks.map((t, idx) => ({
          "@type": "MusicRecording",
          "position": idx + 1,
          "name": t.title,
          "url": `https://www.youtube.com/watch?v=${t.id}`,
          "byArtist": t.singer ? [{ "@type": "Person", "name": t.singer }] : undefined,
          "publisher": { "@type": "Organization", "name": t.artist }
        }))
      },
      {
        "@type": "FAQPage",
        "@id": "https://pujoprem.com/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Where can I listen to non-stop Durga Puja songs and playlists?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Pujo Prem (https://pujoprem.com) offers a free, non-stop Durga Puja songs playlist featuring classic and popular Bengali Durga Puja music, Agomoni songs, and festive hits."
            }
          },
          {
            "@type": "Question",
            "name": "What are the most popular Durga Puja songs in the playlist?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The Pujo Prem playlist features famous Durga Puja songs including Dugga Ma by Arijit Singh, Ebar Jeno Onno Rokom Pujo, Dugga Elo by Monali Thakur, and Elo Je Maa by Abhijeet & Shreya Ghoshal."
            }
          },
          {
            "@type": "Question",
            "name": "Is Pujo Prem free to listen to Durga Puja music?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, Pujo Prem is 100% free with no login required. Press play and enjoy continuous Durga Puja music throughout autumn."
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Visually hidden semantic HTML section for maximum SEO keyword indexing */}
      <section className="sr-only">
        <h1>Durga Puja Songs &amp; Playlist — Non-stop Durga Puja Music</h1>
        <p>
          Welcome to Pujo Prem, the non-stop online Durga Puja playlist and music experience.
          Stream authentic Bengali Durga Puja songs, Agomoni music, Sharadiya tracks, and Kolkata autumn nostalgic hits.
        </p>

        <h2>Featured Durga Puja Songs &amp; Artists</h2>
        <ul>
          {tracks.map((track) => (
            <li key={track.id}>
              {track.title} — {track.singer || track.artist} (Durga Puja Special Song)
            </li>
          ))}
        </ul>

        <h2>About Durga Puja Music &amp; Nostalgia</h2>
        <p>
          Durga Puja in Kolkata is a celebration of love, culture, and music. From pushpanjali morning dhak beats to bijoya evening songs,
          Pujo Prem brings together the best Durga Puja songs by Arijit Singh, Monali Thakur, Abhijeet Bhattacharya, and Shreya Ghoshal.
          Curated with autumn nostalgia by Sushanta (@0xsushanta).
        </p>
      </section>

      <PujoHero tracks={tracks} />
    </>
  );
}
