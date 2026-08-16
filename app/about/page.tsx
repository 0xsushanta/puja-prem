import Image from "next/image";
import type { Metadata } from "next";
import { GitHubStarButton } from "../_components/github-star-button";

export const metadata: Metadata = {
  title: "About Pujo Prem — Sushanta Ruidas (@0xsushanta)",
  description:
    "The story behind Pujo Prem — a non-stop Durga Puja soundtrack crafted with autumn nostalgia and Kolkata memories by Sushanta Ruidas (@0xsushanta).",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <main className="pujo-scene relative min-h-screen flex flex-col justify-between p-6 sm:p-12 text-[#f7ead7] overflow-hidden">
      {/* Background Image & Vignette Backdrop */}
      <div aria-hidden="true" className="pujo-scene__backdrop">
        <Image
          src="/durga_ma.png"
          alt="Durga Maa Pandal Background"
          fill
          priority
          sizes="100vw"
          className="pujo-scene__bg-image opacity-50"
        />
        <div className="pujo-scene__vignette" />
        <div className="pujo-scene__beam" />
        <div className="pujo-scene__halo" />
        <div className="pujo-scene__mist pujo-scene__mist--left" />
        <div className="pujo-scene__mist pujo-scene__mist--right" />
        <div className="pujo-scene__noise" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between w-full max-w-4xl mx-auto">
        <a href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <span className="flex size-3.5 items-center justify-center rounded-full bg-[#dfbd73]/30 p-0.5">
            <span className="size-2 rounded-full bg-[#dfbd73] shadow-[0_0_8px_#dfbd73]" />
          </span>
          <span className="font-serif text-base sm:text-lg font-bold text-[#f7ead7] group-hover:text-white transition">
            পূজা প্রেম · Pujo Prem
          </span>
        </a>

        <nav className="flex items-center gap-3">
          <GitHubStarButton repo="0xsushanta/puja-prem" variant="header" />
          <a
            href="/"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#f7ead7]/80 backdrop-blur-md hover:bg-white/15 hover:text-white transition cursor-pointer"
          >
            ← Back to Soundtrack
          </a>
        </nav>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 my-auto py-12 w-full max-w-3xl mx-auto flex flex-col gap-8">
        
        {/* About Hero Card */}
        <section className="rounded-3xl border border-white/15 bg-[#140b09]/80 p-6 sm:p-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dfbd73]/30 bg-[#dfbd73]/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#dfbd73]">
            <span>🪔</span>
            <span>The Story · গল্পের নাম পূজা প্রেম</span>
          </span>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#f7ead7] mt-4 text-balance">
            Every Pujo Has A Love Story.
          </h1>

          <p className="font-serif italic text-base sm:text-xl text-[#dfbd73]/90 mt-2 text-balance">
            &ldquo;শরতের কাশের বন, শিউলি ফুল, আর মাইকের সুরের ব্যাকগ্রাউন্ড স্কোর।&rdquo;
          </p>

          <div className="mt-6 space-y-4 text-xs sm:text-sm leading-relaxed text-[#f7ead7]/80 font-sans">
            <p>
              Pujo Prem was born out of an eternal Kolkata autumn feeling — standing before a glowing pandal late at night, the echo of dhak rhythms in the distant air, and a song playing on hidden speakers that makes time stand still.
            </p>
            <p>
              It is a non-stop, continuous audio machine designed to stream authentic Durga Puja songs, Agomoni melodies, and nostalgic Sharadiya hits without interruption. One tap, and the evening begins to breathe.
            </p>
          </div>
        </section>

        {/* Creator Credits Section */}
        <section className="rounded-3xl border border-white/15 bg-[#140b09]/85 p-6 sm:p-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Creator Avatar Badge */}
          <div className="size-20 shrink-0 rounded-full border-2 border-[#dfbd73]/50 bg-gradient-to-br from-[#dfbd73]/20 via-[#2d1610] to-[#140b09] p-1 grid place-items-center shadow-[0_0_20px_rgba(223,189,115,0.3)]">
            <span className="font-serif text-2xl font-bold text-[#dfbd73]">SR</span>
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 justify-between">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#f7ead7]">
                  Sushanta Ruidas
                </h2>
                <p className="text-xs uppercase tracking-widest text-[#dfbd73] font-semibold mt-0.5">
                  Creator &amp; Developer · @0xsushanta
                </p>
              </div>

              <span className="text-[11px] text-[#f7ead7]/50 italic">
                Kolkata, West Bengal
              </span>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-[#f7ead7]/80 italic font-serif leading-relaxed">
              &ldquo;Crafted under autumn skies with love, code, and non-stop Durga Puja music.&rdquo;
            </p>

            {/* Social Credit Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              {/* X / Twitter */}
              <a
                href="https://x.com/0xsushanta"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold text-[#f7ead7] shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-[#dfbd73]/60 hover:bg-white/15 hover:text-white active:translate-y-0"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>X / @0xsushanta</span>
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/in/sushanta-ruidas/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold text-[#f7ead7] shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-[#dfbd73]/60 hover:bg-white/15 hover:text-white active:translate-y-0"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span>LinkedIn</span>
              </a>

              {/* GitHub Star Button */}
              <GitHubStarButton repo="0xsushanta/puja-prem" variant="card" />
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-xs text-[#f7ead7]/50">
        <p>Durga Puja · Love · Music · Nostalgia</p>
        <p>
          Crafted with 🪔 by{" "}
          <a
            href="https://x.com/0xsushanta"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-[#dfbd73]"
          >
            Sushanta (@0xsushanta)
          </a>
        </p>
      </footer>
    </main>
  );
}
