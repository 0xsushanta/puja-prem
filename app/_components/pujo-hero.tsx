"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useEffect, useEffectEvent, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Track } from "@/src/audio/types";
import { PujoSoundtrack } from "./pujo-soundtrack";

const petals = [
  { top: "13%", left: "17%", delay: "-7s", duration: "18s", rotate: "-16deg" },
  { top: "19%", left: "70%", delay: "-11s", duration: "22s", rotate: "20deg" },
  { top: "30%", left: "10%", delay: "-3s", duration: "20s", rotate: "-32deg" },
  { top: "35%", left: "80%", delay: "-9s", duration: "24s", rotate: "28deg" },
  { top: "47%", left: "14%", delay: "-14s", duration: "21s", rotate: "10deg" },
  { top: "53%", left: "90%", delay: "-1s", duration: "19s", rotate: "-22deg" },
  { top: "64%", left: "6%", delay: "-5s", duration: "23s", rotate: "18deg" },
  { top: "69%", left: "77%", delay: "-17s", duration: "25s", rotate: "-28deg" },
  { top: "78%", left: "88%", delay: "-8s", duration: "20s", rotate: "14deg" },
];

const particles = [
  { top: "14%", left: "21%", delay: "-4s", duration: "16s", size: "0.55rem" },
  { top: "18%", left: "43%", delay: "-10s", duration: "19s", size: "0.42rem" },
  { top: "22%", left: "64%", delay: "-6s", duration: "14s", size: "0.48rem" },
  { top: "31%", left: "83%", delay: "-12s", duration: "18s", size: "0.38rem" },
  { top: "46%", left: "8%", delay: "-15s", duration: "15s", size: "0.58rem" },
  { top: "49%", left: "69%", delay: "-2s", duration: "17s", size: "0.36rem" },
  { top: "58%", left: "87%", delay: "-9s", duration: "20s", size: "0.44rem" },
  { top: "73%", left: "18%", delay: "-13s", duration: "16s", size: "0.34rem" },
  { top: "81%", left: "61%", delay: "-7s", duration: "21s", size: "0.52rem" },
];

type ShareState = "idle" | "copied" | "shared";

const shareCopy: Record<ShareState, { button: string; note: string; icon: string }> = {
  idle: {
    button: "Send this to your Pujo person",
    note: "For the one who still lives inside your autumn soundtrack.",
    icon: "🪔",
  },
  copied: {
    button: "Link copied into the night",
    note: "Let nostalgia do the rest.",
    icon: "✨",
  },
  shared: {
    button: "Sent with a little dhak in the air",
    note: "Shared. Let the pandal lights carry it.",
    icon: "🏮",
  },
};

type PujoHeroProps = {
  tracks?: Track[];
};

export function PujoHero({ tracks }: PujoHeroProps) {
  const sceneRef = useRef<HTMLElement>(null);
  const pointerTargetRef = useRef({ x: 0, y: 0 });
  const pointerCurrentRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);
  const [shareState, setShareState] = useState<ShareState>("idle");
  const [timeStr, setTimeStr] = useState<string>("--:--");

  // Live Kolkata Time Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };
      setTimeStr(new Intl.DateTimeFormat("en-US", options).format(now));
    };

    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  const applyMotion = useEffectEvent(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    pointerCurrentRef.current.x +=
      (pointerTargetRef.current.x - pointerCurrentRef.current.x) * 0.055;
    pointerCurrentRef.current.y +=
      (pointerTargetRef.current.y - pointerCurrentRef.current.y) * 0.055;

    scene.style.setProperty("--pointer-x", pointerCurrentRef.current.x.toFixed(4));
    scene.style.setProperty("--pointer-y", pointerCurrentRef.current.y.toFixed(4));
  });

  useEffect(() => {
    const animate = () => {
      applyMotion();
      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const updatePointer = (clientX: number, clientY: number) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const bounds = scene.getBoundingClientRect();
    const x = (clientX - bounds.left) / bounds.width - 0.5;
    const y = (clientY - bounds.top) / bounds.height - 0.5;

    pointerTargetRef.current = {
      x: Number.isFinite(x) ? x : 0,
      y: Number.isFinite(y) ? y : 0,
    };
  };

  const resetPointer = () => {
    pointerTargetRef.current = { x: 0, y: 0 };
  };

  const sharePage = async () => {
    const payload = {
      title: "Pujo Prem",
      text: "Every Pujo has a love story.",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        startTransition(() => setShareState("shared"));
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload.url);
        startTransition(() => setShareState("copied"));
      }
    } catch {
      startTransition(() => setShareState("idle"));
    }
  };

  useEffect(() => {
    if (shareState === "idle") return;

    const timeoutId = window.setTimeout(() => {
      startTransition(() => setShareState("idle"));
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [shareState]);

  return (
    <section
      ref={sceneRef}
      className="pujo-scene"
      onPointerMove={(event) => updatePointer(event.clientX, event.clientY)}
      onPointerLeave={resetPointer}
    >
      {/* Full-Page Background Image (durga_ma.png) & Vignette Layer */}
      <div aria-hidden="true" className="pujo-scene__backdrop">
        <Image
          src="/durga_ma.png"
          alt="Durga Maa Pandal Background"
          fill
          priority
          sizes="100vw"
          className="pujo-scene__bg-image"
        />
        <div className="pujo-scene__vignette" />
        <div className="pujo-scene__beam" />
        <div className="pujo-scene__halo" />
        <div className="pujo-scene__mist pujo-scene__mist--left" />
        <div className="pujo-scene__mist pujo-scene__mist--right" />
        <div className="pujo-scene__noise" />

        {particles.map((particle, index) => (
          <span
            key={`particle-${index}`}
            className="pujo-scene__particle"
            style={
              {
                top: particle.top,
                left: particle.left,
                "--delay": particle.delay,
                "--duration": particle.duration,
                "--size": particle.size,
              } as CSSProperties
            }
          />
        ))}

        {petals.map((petal, index) => (
          <span
            key={`petal-${index}`}
            className="pujo-scene__petal"
            style={
              {
                top: petal.top,
                left: petal.left,
                "--delay": petal.delay,
                "--duration": petal.duration,
                "--rotate": petal.rotate,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="pujo-scene__shell">
        {/* Top Header / Brand Nav */}
        <header className="pujo-scene__header">
          <div className="pujo-scene__brand">
            <span className="flex size-3.5 items-center justify-center rounded-full bg-[#dfbd73]/30 p-0.5">
              <span className="size-2 rounded-full bg-[#dfbd73] shadow-[0_0_8px_#dfbd73]" />
            </span>
            <div>
              <p className="font-serif text-base sm:text-lg font-bold text-[#f7ead7] leading-none">
                পূজা প্রেম · Pujo Prem
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#dfbd73]/80 mt-1 flex items-center gap-1.5 flex-wrap">
                <span>Kolkata · Autumn Nights</span>
                <span className="opacity-40">·</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-right">
            <div className="hidden sm:block mr-1">
              <p className="text-xs font-medium tabular-nums text-[#f7ead7]/90 leading-none">
                {timeStr}
              </p>
              <p className="text-[9px] uppercase tracking-widest text-[#dfbd73]/70 mt-1">
                Kolkata Time
              </p>
            </div>
            <Link
              href="/about"
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider text-[#f7ead7]/80 backdrop-blur-md hover:bg-white/15 hover:text-white transition"
            >
              About
            </Link>
          </div>
        </header>

        {/* Central Hero Typography */}
        <div className="pujo-scene__headline">
          <p className="pujo-scene__eyebrow mb-3">Durga Puja · Love · Music · Nostalgia</p>
          <h1 className="pujo-scene__title">
            <span>Every Pujo</span>
            <span>Has A</span>
            <span className="pujo-scene__title-accent">Love Story.</span>
          </h1>
          <p className="pujo-scene__subtitle">
            Some songs smell like autumn &amp; pandal light.
          </p>

          {/* Elevated Aesthetic Share Card */}
          <div className="mt-8 flex flex-col items-center gap-2.5">
            <button
              type="button"
              onClick={sharePage}
              className="group relative inline-flex items-center gap-3 rounded-full border border-[#dfbd73]/40 bg-gradient-to-r from-[#dfbd73]/18 via-white/8 to-[#cf3a30]/15 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#f7ead7] shadow-[0_12px_32px_-8px_rgba(223,189,115,0.25)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] hover:border-[#dfbd73]/70 hover:shadow-[0_16px_40px_-6px_rgba(223,189,115,0.4)] active:scale-95 cursor-pointer"
            >
              <span className="text-sm transition-transform duration-300 group-hover:rotate-12">
                {shareCopy[shareState].icon}
              </span>
              <span>{shareCopy[shareState].button}</span>
            </button>

            <p aria-live="polite" className="text-xs font-serif italic text-[#f7ead7]/70 text-center max-w-sm">
              {shareCopy[shareState].note}
            </p>
          </div>
        </div>

        {/* Bottom Floating Soundtrack Dock */}
        <PujoSoundtrack tracks={tracks} />
      </div>
    </section>
  );
}
