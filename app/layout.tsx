import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Pujo Prem",
  description:
    "A cinematic Durga Puja love story told through one image, warm light, and autumn nostalgia.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Pujo Prem",
    description:
      "Durga Puja, love, music, and nostalgia in a single immersive internet page.",
    images: [
      {
        url: "/durga_ma.png",
        width: 1536,
        height: 1024,
        alt: "A couple standing together before Durga Maa in a glowing pandal.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pujo Prem",
    description:
      "Durga Puja, love, music, and nostalgia in a single immersive internet page.",
    images: ["/durga_ma.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#140b09",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
