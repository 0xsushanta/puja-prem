"use client";

import Image from "next/image";
import { startTransition, useEffect, useEffectEvent, useRef, useState } from "react";
import type { CSSProperties } from "react";

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

const shareCopy: Record<ShareState, { button: string; note: string }> = {
  idle: {
    button: "Send this to your Pujo person",
    note: "For the one who still lives inside your autumn soundtrack.",
  },
  copied: {
    button: "Link copied into the night",
    note: "Let nostalgia do the rest.",
  },
  shared: {
    button: "Sent with a little dhak in the air",
    note: "Shared. Let the pandal lights carry it.",
  },
};

export function PujoHero() {
  const sceneRef = useRef<HTMLElement>(null);
  const pointerTargetRef = useRef({ x: 0, y: 0 });
  const pointerCurrentRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);
  const [shareState, setShareState] = useState<ShareState>("idle");

  const applyMotion = useEffectEvent(() => {
    const scene = sceneRef.current;

    if (!scene) {
      return;
    }

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

    if (!scene) {
      return;
    }

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
    if (shareState === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      startTransition(() => setShareState("idle"));
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [shareState]);

  return (
    <section
      ref={sceneRef}
      className="pujo-scene"
      onPointerMove={(event) => updatePointer(event.clientX, event.clientY)}
      onPointerLeave={resetPointer}
    >
      <div aria-hidden="true" className="pujo-scene__backdrop">
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

      <div className="pujo-scene__poster">
        <Image
          src="/durga_ma.png"
          alt="A couple standing together before Durga Maa in a glowing Kolkata pandal."
          fill
          priority
          sizes="100vw"
          className="pujo-scene__image"
        />
        <div aria-hidden="true" className="pujo-scene__vignette" />
      </div>

      <div className="pujo-scene__shell">
        <header className="pujo-scene__header">
          <p className="pujo-scene__eyebrow">Durga Puja. Love. Music. Nostalgia.</p>
        </header>

        <div className="pujo-scene__headline">
          <h1 className="pujo-scene__title">
            <span>Every Pujo</span>
            <span>Has A</span>
            <span className="pujo-scene__title-accent">Love Story.</span>
          </h1>
          <p className="pujo-scene__subtitle">Some songs smell like autumn.</p>
        </div>

        <footer className="pujo-scene__footer">
          <p className="pujo-scene__memory">
            We fell in love between pushpanjali and bijoya.
          </p>

          <div className="pujo-share">
            <button className="pujo-share__button" type="button" onClick={sharePage}>
              {shareCopy[shareState].button}
            </button>
            <p aria-live="polite" className="pujo-share__note">
              {shareCopy[shareState].note}
            </p>
          </div>
        </footer>
      </div>
    </section>
  );
}
