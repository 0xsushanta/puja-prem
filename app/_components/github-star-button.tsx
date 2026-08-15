"use client";

import { useEffect, useState } from "react";

interface GitHubStarButtonProps {
  repo?: string; // e.g. "0xsushanta/puja-prem"
  className?: string;
  variant?: "header" | "card" | "hero";
}

export function GitHubStarButton({
  repo = "0xsushanta/puja-prem",
  className = "",
  variant = "header",
}: GitHubStarButtonProps) {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStars = async () => {
      try {
        const res = await fetch(`https://api.github.com/repos/${repo}`, {
          headers: {
            Accept: "application/vnd.github.v3+json",
          },
          next: { revalidate: 3600 },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && typeof data.stargazers_count === "number") {
            setStars(data.stargazers_count);
          }
        }
      } catch {
        // Silently fall back to no star count badge if network fails/offline
      }
    };

    fetchStars();
    return () => {
      isMounted = false;
    };
  }, [repo]);

  const repoUrl = `https://github.com/${repo}`;

  if (variant === "card") {
    return (
      <a
        href={repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`group relative inline-flex items-center gap-2.5 rounded-full border border-[#dfbd73]/30 bg-[#dfbd73]/10 px-4 py-2 text-xs font-semibold text-[#f7ead7] shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#dfbd73]/70 hover:bg-[#dfbd73]/20 hover:text-white active:translate-y-0 ${className}`}
        title="Star puja-prem on GitHub"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-4 transition-transform duration-300 group-hover:scale-110"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>

        <span className="flex items-center gap-1.5">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-3.5 text-[#dfbd73] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125"
            aria-hidden="true"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>Star on GitHub</span>
        </span>

        {stars !== null && (
          <span className="rounded-full bg-[#dfbd73]/20 px-2 py-0.5 text-[10px] font-mono font-bold text-[#dfbd73] border border-[#dfbd73]/30">
            {stars.toLocaleString()}
          </span>
        )}
      </a>
    );
  }

  // Header variant
  return (
    <a
      href={repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider text-[#f7ead7]/80 backdrop-blur-md transition-all duration-300 hover:border-[#dfbd73]/50 hover:bg-white/15 hover:text-white hover:shadow-[0_0_12px_rgba(223,189,115,0.25)] ${className}`}
      title="Star puja-prem on GitHub"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-3.5 text-[#f7ead7]/80 transition-transform duration-300 group-hover:scale-110 group-hover:text-white"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>

      <span className="flex items-center gap-1">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-3 text-[#dfbd73] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <span>Star</span>
      </span>

      {stars !== null && (
        <span className="rounded-full bg-[#dfbd73]/20 px-1.5 py-0.2 text-[9px] font-mono font-semibold text-[#dfbd73] border border-[#dfbd73]/30">
          {stars}
        </span>
      )}
    </a>
  );
}
