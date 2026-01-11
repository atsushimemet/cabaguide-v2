'use client';

import { motion } from "motion/react";
import type { ReactNode } from "react";

type EditorialSectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  index: number;
  variant?: "default" | "kabukicho";
  spacing?: "default" | "compact";
};

export function EditorialSection({
  title,
  subtitle,
  children,
  index,
  variant = "default",
  spacing = "default",
}: EditorialSectionProps) {
  const sectionMarginClass = spacing === "compact" ? "mb-16" : "mb-40";
  if (variant === "kabukicho") {
    const ringPaddingClass = spacing === "compact" ? "py-6 md:py-10" : "py-12 md:py-16";
    return (
      <section className={sectionMarginClass}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: index * 0.1 }}
          className="relative mb-16"
        >
          <div className="relative w-full">
            <motion.div
              className="absolute left-0 right-0 top-0 h-0.5"
              style={{
                background: "linear-gradient(90deg, transparent, #f472b6, #67e8f9, #f472b6, transparent)",
                boxShadow: "0 0 20px #f472b6",
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{
                background: "linear-gradient(90deg, transparent, #67e8f9, #f472b6, #67e8f9, transparent)",
                boxShadow: "0 0 20px #67e8f9",
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              aria-hidden="true"
            />

            <div className={`flex items-center px-4 ${ringPaddingClass}`}>
              <div className="flex w-full flex-col items-center gap-8 md:flex-row md:gap-12">
                <motion.div
                  className="flex flex-col items-center"
                  animate={{
                    textShadow: ["0 0 10px #67e8f9", "0 0 30px #67e8f9", "0 0 10px #67e8f9"],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span
                    className="text-6xl tracking-widest text-cyan-400 md:text-8xl"
                    style={{
                      fontFamily: "Geist Sans, sans-serif",
                      fontWeight: 700,
                      writingMode: "vertical-rl",
                      textOrientation: "upright",
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </motion.div>

                <motion.div
                  className="hidden h-40 w-0.5 md:block"
                  style={{
                    background: "linear-gradient(180deg, transparent, #f472b6, #67e8f9, #f472b6, transparent)",
                    boxShadow: "0 0 20px #f472b6",
                  }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />

                <motion.div
                  className="h-0.5 w-full md:hidden"
                  style={{
                    background: "linear-gradient(90deg, transparent, #f472b6, #67e8f9, #f472b6, transparent)",
                    boxShadow: "0 0 20px #f472b6",
                  }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />

                <div className="flex-1 text-center md:text-left">
                  <motion.h2
                    className="mb-3 text-4xl text-white whitespace-nowrap sm:text-5xl md:text-7xl lg:text-8xl"
                    style={{ fontFamily: "Geist Sans, sans-serif", fontWeight: 700, letterSpacing: "0.05em" }}
                    animate={{
                      textShadow: [
                        "0 0 20px #f472b6",
                        "0 0 40px #f472b6, 0 0 60px #c084fc",
                        "0 0 20px #f472b6",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {title}
                  </motion.h2>
                  {subtitle && (
                    <p
                      className="text-lg text-cyan-200 md:text-xl"
                      style={{
                        fontFamily: "Geist Sans, sans-serif",
                        letterSpacing: "0.1em",
                        textShadow: "0 0 15px rgba(103, 232, 249, 0.6)",
                      }}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        {children}
      </section>
    );
  }

  return (
    <section className={sectionMarginClass}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className="mb-12"
      >
        <div className="mb-4 flex items-baseline gap-6">
          <span
            className="text-sm opacity-40"
            style={{ fontFamily: "Geist Sans, sans-serif", letterSpacing: "0.2em" }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <h2
            className="text-5xl leading-[1.1] md:text-6xl"
            style={{ fontFamily: "Geist Sans, sans-serif", fontWeight: 600, letterSpacing: "-0.01em" }}
          >
            {title}
          </h2>
        </div>
        {subtitle && (
          <p
            className="ml-16 text-lg"
            style={{ fontFamily: "Geist Sans, sans-serif", color: "#b8b4d3", letterSpacing: "0.05em" }}
          >
            {subtitle}
          </p>
        )}
      </motion.div>
      {children}
    </section>
  );
}
