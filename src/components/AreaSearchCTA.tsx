'use client';

import Link from "next/link";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";

type AreaSearchCTAProps = {
  sectionId?: string;
  hideBorder?: boolean;
};

export const AreaSearchCTA = ({ sectionId, hideBorder = false }: AreaSearchCTAProps) => {
  const [titleVisible, setTitleVisible] = useState(false);
  const [descriptionVisible, setDescriptionVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const [canAnimate, setCanAnimate] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const hasTriggeredRef = useRef(false);
  const hasAnnouncedDescriptionRef = useRef(false);

  useEffect(() => {
    let readyTimer: number | undefined;
    const handleReady = () => setCanAnimate(true);

    const loadingScreenEl = document.querySelector(".loading-screen");
    if (!loadingScreenEl) {
      readyTimer = window.setTimeout(() => setCanAnimate(true), 0);
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
    if (!canAnimate) return;

    const target = sectionRef.current;
    if (!target) return;

    let descriptionTimer: number | undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || hasTriggeredRef.current) return;
          hasTriggeredRef.current = true;
          setTitleVisible(true);
          descriptionTimer = window.setTimeout(() => {
            setDescriptionVisible(true);
            setButtonVisible(true);
          }, 650);
        });
      },
      {
        threshold: 0.4,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
      if (descriptionTimer) {
        window.clearTimeout(descriptionTimer);
      }
    };
  }, [canAnimate]);

  useEffect(() => {
    if (!descriptionVisible || hasAnnouncedDescriptionRef.current) return;
    hasAnnouncedDescriptionRef.current = true;

    if (document.body) {
      document.body.dataset.areaSearchDescriptionVisible = "true";
    }

    window.dispatchEvent(new CustomEvent("area-search:description-visible"));
  }, [descriptionVisible]);

  const titleStyle = useMemo<CSSProperties>(
    () => ({
      transform: titleVisible ? "translate3d(0, 0, 0)" : "translate3d(80px, 0, 0)",
      opacity: titleVisible ? 1 : 0,
      transition: "transform 800ms cubic-bezier(0.4, 0, 0.2, 1), opacity 800ms ease",
    }),
    [titleVisible],
  );

  const descriptionStyle = useMemo<CSSProperties>(
    () => ({
      transform: descriptionVisible ? "translate3d(0, 0, 0)" : "translate3d(0, 12px, 0)",
      opacity: descriptionVisible ? 1 : 0,
      transition: "transform 700ms ease, opacity 700ms ease",
    }),
    [descriptionVisible],
  );

  const buttonClassName = [
    "glitch-button inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 px-8 py-3 text-base font-semibold shadow-[0_0_25px_rgba(236,72,153,0.45)] lg:self-start",
    buttonVisible ? "glitch-button--visible" : "glitch-button--hidden",
  ]
    .filter(Boolean)
    .join(" ");

  const baseSectionClass =
    "flex flex-col gap-6 rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 text-center backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between lg:text-left";
  const sectionClassName = hideBorder ? baseSectionClass : `${baseSectionClass} border border-white/10`;

  return (
    <section id={sectionId} className={sectionClassName} ref={sectionRef}>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden">
        <h2 className="text-2xl font-semibold text-white" style={titleStyle}>
          エリアから探す
        </h2>

        <p aria-hidden={!descriptionVisible} className="text-sm text-white/70" style={descriptionStyle}>
          あなたのエリアからキャストを探せます。
        </p>
      </div>
      <Link
        href="/todofuken-choice"
        className={buttonClassName}
        data-label="エリアから探す"
      >
        エリアから探す
      </Link>
    </section>
  );
};
