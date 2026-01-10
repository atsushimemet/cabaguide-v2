"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

type ParticleConfig = {
  width: number;
  height: number;
  left: string;
  top: string;
  deltaX: number;
  deltaY: number;
  duration: number;
  delay: number;
  color: string;
  glow: string;
};

const PARTICLE_COUNT = 20;

const createSeededRandom = () => {
  let seed = 42;
  return () => {
    const value = Math.sin(seed++) * 10000;
    return value - Math.floor(value);
  };
};

const useParticleConfigs = (): ParticleConfig[] => {
  return useMemo(() => {
    const random = createSeededRandom();
    return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
      const size = 2 + random() * 4;
      return {
        width: size,
        height: size,
        left: `${random() * 100}%`,
        top: `${random() * 100}%`,
        deltaX: random() * 20 - 10,
        deltaY: random() * 30,
        duration: 3 + random() * 2,
        delay: random() * 2,
        color: index % 2 === 0 ? "#f472b6" : "#67e8f9",
        glow: index % 2 === 0 ? "0 0 10px #f472b6" : "0 0 10px #67e8f9",
      };
    });
  }, []);
};

export function EditorialHero() {
  const [glitchActive, setGlitchActive] = useState(false);
  const particleConfigs = useParticleConfigs();

  useEffect(() => {
    let timeoutId: number | undefined;
    const intervalId = window.setInterval(() => {
      setGlitchActive(true);
      timeoutId = window.setTimeout(() => setGlitchActive(false), 200);
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <section className="relative -mt-10 mb-32 flex min-h-[85vh] items-end overflow-hidden pb-20 sm:-mt-12">
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, index) => (
          <motion.div
            key={`bar-${index}`}
            className="absolute w-1"
            style={{
              left: `${(index + 1) * 8}%`,
              height: "100%",
              background:
                index % 3 === 0
                  ? "linear-gradient(180deg, transparent, #f472b6, transparent)"
                  : index % 3 === 1
                    ? "linear-gradient(180deg, transparent, #67e8f9, transparent)"
                    : "linear-gradient(180deg, transparent, #c084fc, transparent)",
              filter: "blur(2px)",
            }}
            animate={{
              y: ["-100%", "100%"],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 4 + index * 0.3,
              repeat: Infinity,
              delay: index * 0.5,
              ease: "linear",
            }}
          />
        ))}

        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(103, 232, 249, 0.03) 2px, rgba(103, 232, 249, 0.03) 4px)",
          }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {particleConfigs.map((config, index) => (
          <motion.div
            key={`particle-${index}`}
            className="absolute rounded-full"
            style={{
              width: config.width,
              height: config.height,
              left: config.left,
              top: config.top,
              background: config.color,
              boxShadow: config.glow,
            }}
            animate={{
              y: [0, -config.deltaY, 0],
              x: [0, config.deltaX, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: config.duration,
              repeat: Infinity,
              delay: config.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        {Array.from({ length: 3 }).map((_, index) => (
          <motion.div
            key={`ring-${index}`}
            className="absolute rounded-full"
            style={{
              width: 400 + index * 200,
              height: 400 + index * 200,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              border:
                index % 2 === 0
                  ? "1px solid rgba(244, 114, 182, 0.1)"
                  : "1px solid rgba(103, 232, 249, 0.1)",
              filter: "blur(2px)",
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 4 + index,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: glitchActive ? [0.35, 0.45, 0.35] : 0.35,
            scale: glitchActive ? [1, 1.02, 1] : 1,
            x: glitchActive ? [0, -5, 5, 0] : 0,
          }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none select-none text-[20vw] leading-none"
          style={{
            fontFamily: "Geist Sans, sans-serif",
            fontWeight: 700,
            textShadow: glitchActive
              ? "3px 0 0 #f472b6, -3px 0 0 #67e8f9, 0 0 60px rgba(244, 114, 182, 0.8)"
              : "0 0 60px rgba(244, 114, 182, 0.6), 0 0 90px rgba(192, 132, 252, 0.4)",
          }}
        >
          CABA
          <span
            className="absolute inset-0"
            style={{
              WebkitTextStroke: "3px rgba(244, 114, 182, 0.8)",
              color: "transparent",
              filter: "drop-shadow(0 0 10px rgba(244, 114, 182, 0.6))",
            }}
          >
            CABA
          </span>
          <span
            className="absolute inset-0"
            style={{
              WebkitTextStroke: "1px rgba(103, 232, 249, 0.6)",
              color: "transparent",
              filter: "blur(2px)",
            }}
          >
            CABA
          </span>
        </motion.h1>
      </div>

      <div className="relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.h2
            className="relative mb-8 text-7xl leading-[0.9] md:text-9xl"
            style={{
              fontFamily: "Geist Sans, sans-serif",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            <motion.span
              animate={{
                textShadow: [
                  "0 0 20px #f472b6, 0 0 40px #c084fc",
                  "0 0 30px #f472b6, 0 0 60px #c084fc",
                  "0 0 20px #f472b6, 0 0 40px #c084fc",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              GUIDE
            </motion.span>

            <motion.div
              className="absolute -bottom-4 left-0 h-1 bg-gradient-to-r from-fuchsia-500 via-purple-400 to-cyan-400"
              style={{
                filter: "blur(4px)",
                boxShadow: "0 0 20px #f472b6",
              }}
              animate={{
                width: ["0%", "100%"],
                opacity: [0, 1],
              }}
              transition={{
                duration: 1.5,
                delay: 1,
              }}
            />
          </motion.h2>

          <motion.p
            className="mb-4 max-w-2xl text-xl md:text-2xl"
            style={{
              fontFamily: "Geist Sans, sans-serif",
              color: "#b8b4d3",
              lineHeight: 1.6,
            }}
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            「この子でよかった」と思える夜へ
          </motion.p>

          <motion.div
            className="relative mt-12 h-px w-32 bg-gradient-to-r from-fuchsia-500 via-purple-400 to-cyan-400"
            animate={{
              width: ["32px", "128px", "32px"],
              boxShadow: [
                "0 0 10px #f472b6",
                "0 0 20px #f472b6, 0 0 30px #67e8f9",
                "0 0 10px #f472b6",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-purple-400 to-cyan-400"
              style={{
                filter: "blur(8px)",
              }}
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="absolute top-0 right-0 h-32 w-32"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(244, 114, 182, 0.2), transparent)",
          filter: "blur(30px)",
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-0 left-0 h-40 w-40"
        style={{
          background:
            "radial-gradient(circle at bottom left, rgba(103, 232, 249, 0.2), transparent)",
          filter: "blur(30px)",
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      />
    </section>
  );
}
