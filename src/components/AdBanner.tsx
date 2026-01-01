'use client';

import Link from "next/link";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";

type AdBannerProps = {
  label: string;
  title: string;
  description: string;
  href: string;
  ctaLabel?: string;
  className?: string;
  animationVariant?: "none" | "top" | "bottom";
};

const baseClasses =
  "rounded-3xl border border-white/10 bg-gradient-to-r from-purple-800/80 via-fuchsia-700/60 to-blue-700/70 p-6 text-center shadow-[0_0_45px_rgba(147,51,234,0.45)] backdrop-blur-xl lg:flex lg:items-center lg:justify-between lg:text-left";

export const AdBanner = ({
  label,
  title,
  description,
  href,
  ctaLabel = "広告掲載について",
  className,
  animationVariant = "none",
}: AdBannerProps) => {
  const [canAnimate, setCanAnimate] = useState(animationVariant === "none");
  const [isVisible, setIsVisible] = useState(animationVariant === "none");
  const [tenthCardVisible, setTenthCardVisible] = useState(animationVariant !== "bottom");
  const [bannerInView, setBannerInView] = useState(animationVariant !== "bottom");
  const sectionRef = useRef<HTMLElement | null>(null);
  const hasRevealedRef = useRef(animationVariant === "none");

  useEffect(() => {
    if (animationVariant === "none" || canAnimate) return;

    const handleReady = () => setCanAnimate(true);
    const loadingScreenEl = document.querySelector(".loading-screen");

    if (!loadingScreenEl) {
      setCanAnimate(true);
      return;
    }

    window.addEventListener("loading-screen:completed", handleReady, { once: true });

    return () => {
      window.removeEventListener("loading-screen:completed", handleReady);
    };
  }, [animationVariant, canAnimate]);

  useEffect(() => {
    if (!canAnimate || animationVariant !== "top" || hasRevealedRef.current) return;

    if (document.body?.dataset.areaSearchDescriptionVisible === "true") {
      hasRevealedRef.current = true;
      setIsVisible(true);
      return;
    }

    const handleReveal = () => {
      hasRevealedRef.current = true;
      setIsVisible(true);
    };

    window.addEventListener("area-search:description-visible", handleReveal, { once: true });

    return () => {
      window.removeEventListener("area-search:description-visible", handleReveal);
    };
  }, [animationVariant, canAnimate]);

  useEffect(() => {
    if (animationVariant !== "bottom" || hasRevealedRef.current) return;

    const target = document.querySelector('[data-rank="10"]');

    if (!target) {
      setTenthCardVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setTenthCardVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [animationVariant]);

  useEffect(() => {
    if (!canAnimate || animationVariant !== "bottom" || hasRevealedRef.current) return;

    const target = sectionRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setBannerInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [animationVariant, canAnimate]);

  useEffect(() => {
    if (
      animationVariant !== "bottom" ||
      hasRevealedRef.current ||
      !canAnimate ||
      !tenthCardVisible ||
      !bannerInView
    ) {
      return;
    }

    hasRevealedRef.current = true;
    setIsVisible(true);
  }, [animationVariant, bannerInView, canAnimate, tenthCardVisible]);

  const sectionClass = [baseClasses, className].filter(Boolean).join(" ");

  const sectionStyle = useMemo<CSSProperties>(() => {
    if (animationVariant === "none") {
      return {};
    }

    return {
      transform: isVisible ? "translate3d(0, 0, 0)" : "translate3d(120px, 0, 0)",
      opacity: isVisible ? 1 : 0,
      transition: "transform 750ms cubic-bezier(0.4, 0, 0.2, 1), opacity 700ms ease",
    };
  }, [animationVariant, isVisible]);

  return (
    <section className={sectionClass} style={sectionStyle} ref={sectionRef}>
      <div className="flex-1 space-y-3">
        <p className="text-xs font-semibold tracking-[0.3em] text-white/70">{label}</p>
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
        <p className="text-sm text-white/80">{description}</p>
      </div>
      <Link
        href={href}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-white/20 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:bg-white/30 lg:mt-0"
      >
        {ctaLabel}
      </Link>
    </section>
  );
};
