"use client";

import { useEffect } from "react";
import Image from "next/image";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Pujo Prem runtime error:", error);
  }, [error]);

  const handleTuneAgain = () => {
    try {
      reset();
    } catch {
      window.location.reload();
    }
    window.location.reload();
  };

  return (
    <main className="pujo-scene relative min-h-screen flex flex-col justify-between p-6 sm:p-10 text-[#f7ead7] overflow-hidden">
      {/* Background Image & Vignette */}
      <div aria-hidden="true" className="pujo-scene__backdrop">
        <Image
          src="/durga_ma.png"
          alt="Durga Maa Pandal Background"
          fill
          priority
          sizes="100vw"
          className="pujo-scene__bg-image opacity-40"
        />
        <div className="pujo-scene__vignette" />
        <div className="pujo-scene__beam" />
        <div className="pujo-scene__halo" />
        <div className="pujo-scene__mist pujo-scene__mist--left" />
        <div className="pujo-scene__mist pujo-scene__mist--right" />
        <div className="pujo-scene__noise" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <span className="flex size-3.5 items-center justify-center rounded-full bg-[#dfbd73]/30 p-0.5">
            <span className="size-2 rounded-full bg-[#dfbd73] shadow-[0_0_8px_#dfbd73]" />
          </span>
          <span className="font-serif text-base font-bold text-[#f7ead7] group-hover:text-white transition">
            পূজা প্রেম · Pujo Prem
          </span>
        </a>

        <a
          href="https://x.com/0xsushanta"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs uppercase tracking-widest text-[#dfbd73]/80 hover:text-white transition"
        >
          by @0xsushanta
        </a>
      </header>

      {/* Center Error Card */}
      <div className="relative z-10 my-auto text-center max-w-xl mx-auto py-12 px-6 rounded-3xl border border-white/12 bg-[#140b09]/80 backdrop-blur-2xl shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]">
        <span className="inline-block rounded-full border border-[#cf3a30]/40 bg-[#cf3a30]/15 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#cf3a30] mb-4">
          A Song Skipped In The Night
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#f7ead7] text-balance">
          The Speakers Need A Moment.
        </h1>

        <p className="font-serif italic text-sm sm:text-base text-[#f7ead7]/80 mt-3 leading-relaxed text-balance">
          &ldquo;Even on the loudest Ashtami evening, a cassette stumbles. Tap below to tune the player back.&rdquo;
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleTuneAgain}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-[#dfbd73]/40 bg-[#dfbd73]/20 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#dfbd73] shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[#dfbd73]/30 active:translate-y-0 cursor-pointer"
          >
            <span>🔄</span>
            <span>Tune Speakers Again</span>
          </button>

          <a
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#f7ead7]/80 transition hover:bg-white/10 hover:text-white cursor-pointer"
          >
            Return Home
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-[#f7ead7]/50 tracking-wider">
        Durga Puja · Love · Music · Nostalgia · <a href="https://x.com/0xsushanta" target="_blank" rel="noopener noreferrer" className="hover:underline text-[#dfbd73]">@0xsushanta</a>
      </footer>
    </main>
  );
}
