import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujoprem.com";

export const metadata: Metadata = {
  title: {
    default: "Durga Puja Songs & Playlist — Non-stop Durga Puja Music | Pujo Prem",
    template: "%s | Pujo Prem — Durga Puja Songs & Playlist",
  },
  description:
    "Listen to non-stop Durga Puja songs & playlists online. Stream authentic Bengali Agomoni music, Arijit Singh Durga Puja hits, Monali Thakur songs & Kolkata Pujo autumn nostalgia. Free, continuous audio.",
  keywords: [
    "durga puja",
    "durga puja song",
    "durga puja playlist",
    "durga puja songs",
    "durga puja music",
    "durga puja special song",
    "bengali durga puja songs",
    "pujo songs",
    "pujo playlist",
    "agomoni songs",
    "kolkata durga puja",
    "best durga puja playlist",
    "durga puja 2026",
    "arijit singh durga puja songs",
    "monali thakur durga puja songs",
    "pujo prem",
    "0xsushanta",
    "sushanta",
  ],
  authors: [{ name: "Sushanta", url: "https://x.com/0xsushanta" }],
  creator: "Sushanta (@0xsushanta)",
  publisher: "Pujo Prem",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
    languages: {
      "en-IN": "/",
      "bn-IN": "/",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Durga Puja Songs & Playlist — Non-stop Durga Puja Music",
    description:
      "Press play on the ultimate Durga Puja soundtrack. Listen to authentic Bengali Agomoni music, Pujo love stories, and autumn nostalgia.",
    url: siteUrl,
    siteName: "Pujo Prem · Durga Puja Playlist",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/durga_ma.png",
        width: 1536,
        height: 1024,
        alt: "A couple standing before Durga Maa in a glowing Kolkata Durga Puja pandal.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Durga Puja Songs & Playlist — Non-stop Durga Puja Music",
    description:
      "Every Pujo has a love story. Press play for non-stop Durga Puja songs, Agomoni music, and autumn nostalgia.",
    creator: "@0xsushanta",
    images: ["/durga_ma.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#140b09",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
      </head>
      <body className="min-h-full bg-[#120907] text-[#f7ead7] selection:bg-[#dfbd73]/40 selection:text-[#f7ead7]">
        {children}
      </body>
    </html>
  );
}
