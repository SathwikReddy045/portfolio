"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { getMedia, type MediaKind, type MediaSlot } from "@/content/media";

interface MediaProps {
  id: string;
  className?: string;
  style?: CSSProperties;
  /** Overrides manifest ratio, e.g. "16 / 9". */
  ratio?: string;
  cursor?: "explore" | "case" | "play" | "none";
  /** Clip-path reveal on scroll (default true). */
  reveal?: boolean;
  /** Subtle vertical parallax of the inner content. */
  parallax?: number;
  label?: string;
}

/**
 * Media slot. Renders a real image/video when the manifest has a `src`,
 * otherwise a clearly labelled placeholder that can be swapped later.
 */
export default function Media({
  id,
  className = "",
  style,
  ratio,
  cursor,
  reveal = true,
  parallax = 0,
  label,
}: MediaProps) {
  const slot = getMedia(id);
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const frame = frameRef.current;
      const inner = innerRef.current;
      if (!frame || !inner) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(frame, { clipPath: "inset(0% 0% 0% 0%)" });
        return;
      }
      if (reveal) {
        gsap.fromTo(
          frame,
          { clipPath: "inset(0% 0% 100% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.4,
            ease: "expo.inOut",
            scrollTrigger: { trigger: frame, start: "top 85%", once: true },
          },
        );
        gsap.fromTo(
          inner,
          { scale: 1.12 },
          { scale: 1, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: frame, start: "top 85%", once: true } },
        );
      }
      if (parallax) {
        gsap.fromTo(
          inner,
          { yPercent: -parallax },
          {
            yPercent: parallax,
            ease: "none",
            scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      }
    },
    { scope: frameRef },
  );

  const cursorKey = cursor ?? (slot.kind === "video" ? "play" : "explore");

  return (
    <div
      ref={frameRef}
      className={`relative overflow-hidden bg-bg-2 ${className}`}
      style={{ aspectRatio: ratio ?? slot.ratio, ...style }}
      data-cursor={cursorKey === "none" ? undefined : cursorKey}
    >
      <div ref={innerRef} className="absolute inset-0 will-change-transform" style={parallax ? { inset: `-${parallax}% 0` } : undefined}>
        {slot.src ? (
          slot.kind === "video" ? (
            <LazyVideo slot={slot} />
          ) : (
            <Image
              src={slot.src}
              alt={slot.alt ?? slot.label}
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover"
            />
          )
        ) : (
          <Placeholder slot={slot} label={label} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function LazyVideo({ slot }: { slot: MediaSlot }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: "100px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      src={slot.src}
      poster={slot.poster}
      muted
      loop
      playsInline
      preload="none"
      className="h-full w-full object-cover"
      aria-label={slot.alt ?? slot.label}
    />
  );
}

/* ------------------------------------------------------------------ */

const PATTERNS: Record<MediaKind, CSSProperties> = {
  image: {
    backgroundImage:
      "repeating-linear-gradient(135deg, rgb(var(--ink-rgb) / 0.05) 0 1px, transparent 1px 14px), radial-gradient(60% 50% at 50% 100%, rgb(var(--accent-rgb) / 0.08), transparent 70%)",
  },
  video: {
    backgroundImage:
      "radial-gradient(70% 60% at 50% 50%, rgb(var(--ink-rgb) / 0.05), transparent 70%)",
  },
  diagram: {
    backgroundImage: "radial-gradient(rgb(var(--ink-rgb) / 0.14) 0.6px, transparent 0.8px)",
    backgroundSize: "18px 18px",
  },
  model: {
    backgroundImage:
      "linear-gradient(rgb(var(--ink-rgb) / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--ink-rgb) / 0.05) 1px, transparent 1px)",
    backgroundSize: "36px 36px",
  },
};

export function Placeholder({ slot, label }: { slot: MediaSlot; label?: string }) {
  return (
    <div
      className="group/ph relative h-full w-full select-none overflow-hidden bg-bg-2"
      style={PATTERNS[slot.kind]}
      role="img"
      aria-label={`Placeholder for ${slot.label.toLowerCase()}`}
    >
      {/* corner brackets */}
      {["top-3 left-3 border-t border-l", "top-3 right-3 border-t border-r", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map(
        (c) => (
          <span
            key={c}
            className={`absolute h-3 w-3 border-ink/40 transition-all duration-500 ease-[var(--ease-expo)] group-hover/ph:h-4 group-hover/ph:w-4 ${c}`}
          />
        ),
      )}

      {/* kind-specific glyph */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        {slot.kind === "video" && (
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/30 transition-colors duration-500 group-hover/ph:border-accent">
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
              <path d="M1 1l10 6-10 6V1z" stroke="currentColor" strokeWidth="1" className="text-ink/70" />
            </svg>
          </span>
        )}
        {slot.kind === "model" && (
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true" className="text-ink/50 [animation:spin_18s_linear_infinite]">
            <path d="M28 4l20 11v26L28 52 8 41V15L28 4z" stroke="currentColor" />
            <path d="M28 4v22M8 15l20 11 20-11M28 26v26" stroke="currentColor" />
          </svg>
        )}
        {slot.kind === "diagram" && (
          <svg width="90" height="36" viewBox="0 0 90 36" fill="none" aria-hidden="true" className="text-ink/50">
            <circle cx="6" cy="18" r="4" stroke="currentColor" />
            <circle cx="45" cy="6" r="4" stroke="currentColor" />
            <circle cx="45" cy="30" r="4" stroke="currentColor" />
            <circle cx="84" cy="18" r="4" stroke="currentColor" />
            <path d="M10 18l31-11M10 18l31 11M49 6l31 11M49 30l31-11" stroke="currentColor" strokeDasharray="2 3" />
          </svg>
        )}
        <span className="t-eyebrow !text-ink/70 transition-[letter-spacing] duration-500 group-hover/ph:tracking-[0.22em]">
          [{label ?? slot.label}]
        </span>
      </div>

      {/* video timeline */}
      {slot.kind === "video" && (
        <div className="absolute inset-x-6 bottom-6 h-px bg-ink/15">
          <div className="h-full w-1/3 bg-ink/40" />
        </div>
      )}

      <span className="t-mono absolute bottom-2 left-3 !text-[0.56rem] !tracking-[0.08em] text-ink/25">
        SLOT {slot.id} · {slot.ratio.replace(/\s/g, "")}
      </span>
    </div>
  );
}
