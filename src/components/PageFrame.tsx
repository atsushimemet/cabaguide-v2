'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

import { DEFAULT_STORE_RANKING_PREFECTURE } from "@/constants/storeRanking";

const footerLinks = [
  { label: "ホーム", href: "/" },
  { label: "これはなに？", href: "/about" },
  { label: "広告プラン", href: "/ads" },
  {
    label: "店舗ランキング",
    href: `/stores/prefectures/${encodeURIComponent(DEFAULT_STORE_RANKING_PREFECTURE)}`,
  },
  { label: "更新情報", href: "/updates" },
  { label: "FAQ", href: "/faq" },
  { label: "お問い合わせ", href: "/inquery" },
  { label: "利用規約", href: "/policy" },
  { label: "障害情報", href: "#" },
];

const TAGLINE_TEXT = "「この子でよかった」と思える夜へ";

type PageFrameProps = {
  children: React.ReactNode;
  mainClassName?: string;
};

export const PageFrame = ({ children, mainClassName }: PageFrameProps) => {
  const mainClasses = ["flex flex-col", mainClassName].filter(Boolean).join(" ");
  const [displayedTagline, setDisplayedTagline] = useState("");
  const [canAnimateTagline, setCanAnimateTagline] = useState(false);

  useEffect(() => {
    const handleReady = () => setCanAnimateTagline(true);
    const loadingScreenEl = document.querySelector(".loading-screen");
    let readyTimer: number | undefined;

    if (!loadingScreenEl) {
      readyTimer = window.setTimeout(() => setCanAnimateTagline(true), 0);
    } else {
      window.addEventListener("loading-screen:completed", handleReady, { once: true });
    }

    return () => {
      window.removeEventListener("loading-screen:completed", handleReady);
      if (readyTimer) {
        window.clearTimeout(readyTimer);
      }
    };
  }, []);

  useEffect(() => {
    if (!canAnimateTagline) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) {
      const motionTimer = window.setTimeout(() => setDisplayedTagline(TAGLINE_TEXT), 0);
      return () => window.clearTimeout(motionTimer);
    }

    let currentIndex = 0;
    let typingTimer: number | undefined;

    const typeNext = () => {
      setDisplayedTagline(TAGLINE_TEXT.slice(0, currentIndex + 1));
      currentIndex += 1;
      if (currentIndex < TAGLINE_TEXT.length) {
        typingTimer = window.setTimeout(typeNext, 110);
      }
    };

    const delayTimer = window.setTimeout(() => {
      setDisplayedTagline("");
      typeNext();
    }, 200);

    return () => {
      if (typingTimer) {
        window.clearTimeout(typingTimer);
      }
      window.clearTimeout(delayTimer);
    };
  }, [canAnimateTagline]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050312] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-80">
        <div className="absolute -top-32 left-10 h-80 w-80 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-500 blur-[140px]" />
        <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 blur-[180px]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-8 lg:py-14">
        <header className="neon-laser-frame flex flex-col gap-3 border-y border-cyan-100/40 px-4 py-8 text-center sm:text-left">
          <span className="neon-laser-gap" aria-hidden="true" />
          <span className="neon-laser-inner" aria-hidden="true" />
          <div className="relative z-10 flex flex-col gap-1">
            <Link
              href="/"
              className="neon-outline-text text-3xl font-semibold tracking-[0.3em] text-transparent sm:text-4xl"
            >
              cabaguide
            </Link>
            <p className="text-sm text-cyan-200 sm:text-base" aria-live="polite" aria-label={TAGLINE_TEXT}>
              {displayedTagline}
            </p>
          </div>
        </header>

        <main className={mainClasses}>{children}</main>

        <footer className="mt-4 border-t border-white/15 pt-6">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
              FOOTER
            </p>
          </div>
          <div className="mt-6 grid gap-4 text-center text-sm text-white/80 sm:grid-cols-2 lg:grid-cols-4 lg:text-left">
            {footerLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="border-b border-transparent pb-1 font-medium transition hover:border-fuchsia-400/60 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
};
