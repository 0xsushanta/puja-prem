import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Lost In The Pandal Night | Pujo Prem",
  description: "The lane you are looking for has quieted down. Return to the Pujo Prem soundtrack.",
};

export default function NotFound() {
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
          className="pujo-scene__bg-image opacity-45"
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
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex size-3.5 items-center justify-center rounded-full bg-[#dfbd73]/30 p-0.5">
            <span className="size-2 rounded-full bg-[#dfbd73] shadow-[0_0_8px_#dfbd73]" />
          </span>
          <span className="font-serif text-base font-bold text-[#f7ead7] group-hover:text-white transition">
            পূজা প্রেম · Pujo Prem
          </span>
        </Link>

        <a
          href="https://x.com/0xsushanta"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs uppercase tracking-widest text-[#dfbd73]/80 hover:text-white transition"
        >
          by @0xsushanta
        </a>
      </header>

      {/* Center 404 Hero Content */}
      <div className="relative z-10 my-auto text-center max-w-xl mx-auto py-12 px-6 rounded-3xl border border-white/12 bg-[#140b09]/75 backdrop-blur-2xl shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]">
        <span className="inline-block rounded-full border border-[#dfbd73]/30 bg-[#dfbd73]/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#dfbd73] mb-4">
          404 · 4th Day of Pujo
        </span>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#f7ead7] text-balance">
          Lost in the Pandal Night.
        </h1>

        <p className="font-serif italic text-sm sm:text-base text-[#f7ead7]/80 mt-3 leading-relaxed text-balance">
          &ldquo;The lane you are looking for has quieted down. The dhak echoes from another street.&rdquo;
        </p>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-gradient-to-b from-white/18 to-white/6 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#f7ead7] shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/35 hover:shadow-xl active:translate-y-0"
          >
            <span>🪔</span>
            <span>Return to the Soundtrack</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-[#f7ead7]/50 tracking-wider">
        Durga Puja · Love · Music · Nostalgia · <a href="https://x.com/0xsushanta" target="_blank" rel="noopener noreferrer" className="hover:underline text-[#dfbd73]">@0xsushanta</a>
      </footer>
    </main>
  );
}
