"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

type Tag = keyof React.JSX.IntrinsicElements;
import { gsap, useGSAP } from "@/lib/gsap";

type Trigger = "mount" | "scroll";

interface BaseProps {
  as?: Tag;
  className?: string;
  style?: CSSProperties;
  trigger?: Trigger;
  start?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
}

/* ------------------------------------------------------------------ */
/* Lines: each line clips and slides up. Optionally animates the        */
/* Archivo width axis from compressed to natural ("becoming real").     */
/* ------------------------------------------------------------------ */
export function LineReveal({
  lines,
  as = "div",
  className = "",
  style,
  trigger = "scroll",
  start = "top 85%",
  delay = 0,
  stagger = 0.1,
  duration = 1.2,
  widthAxis = false,
  lineClassName = "",
  ariaLabel,
}: BaseProps & {
  lines: ReactNode[];
  widthAxis?: boolean;
  lineClassName?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const Tag = as as "div";

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const inners = el.querySelectorAll<HTMLElement>(".split-inner");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(inners, { yPercent: 0, "--wdth": 100 });
        return;
      }
      const from: gsap.TweenVars = { yPercent: 110 };
      const to: gsap.TweenVars = {
        yPercent: 0,
        duration,
        stagger,
        delay,
        ease: "expo.out",
      };
      if (widthAxis) {
        from["--wdth"] = 70;
        to["--wdth"] = 100;
      }
      gsap.fromTo(
        inners,
        from,
        trigger === "scroll"
          ? { ...to, scrollTrigger: { trigger: el, start, once: true } }
          : to,
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} style={style} aria-label={ariaLabel}>
      {lines.map((line, i) => (
        <span key={i} className="split-line" aria-hidden={ariaLabel ? true : undefined}>
          <span className={`split-inner ${lineClassName}`}>{line}</span>
        </span>
      ))}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Chars: character-by-character reveal of a single string.            */
/* ------------------------------------------------------------------ */
export function CharReveal({
  text,
  as = "span",
  className = "",
  style,
  trigger = "scroll",
  start = "top 85%",
  delay = 0,
  stagger = 0.018,
  duration = 0.9,
}: BaseProps & { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const Tag = as as "div";
  const words = text.split(" ");

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const chars = el.querySelectorAll<HTMLElement>(".char");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      const to: gsap.TweenVars = {
        yPercent: 0,
        opacity: 1,
        duration,
        stagger,
        delay,
        ease: "expo.out",
      };
      gsap.fromTo(
        chars,
        { yPercent: 100, opacity: 0 },
        trigger === "scroll" ? { ...to, scrollTrigger: { trigger: el, start, once: true } } : to,
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} style={style} aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block overflow-hidden whitespace-nowrap align-bottom" aria-hidden="true">
          {Array.from(word).map((ch, ci) => (
            <span key={ci} className="char inline-block will-change-transform">
              {ch}
            </span>
          ))}
          {wi < words.length - 1 ? <span className="char inline-block">&nbsp;</span> : null}
        </span>
      ))}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Fade: generic opacity + translate reveal for blocks.                 */
/* ------------------------------------------------------------------ */
export function Fade({
  children,
  as = "div",
  className = "",
  style,
  start = "top 88%",
  delay = 0,
  y = 28,
  duration = 1.1,
}: BaseProps & { children: ReactNode; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const Tag = as as "div";
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      gsap.fromTo(
        el,
        { opacity: 0, y },
        { opacity: 1, y: 0, duration, delay, ease: "expo.out", scrollTrigger: { trigger: el, start, once: true } },
      );
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Words: scroll-scrubbed word-by-word brightening (manifesto).         */
/* ------------------------------------------------------------------ */
export function ScrubWords({
  text,
  className = "",
  as = "p",
}: {
  text: string;
  className?: string;
  as?: Tag;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const Tag = as as "div";
  const words = text.split(" ");
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const spans = el.querySelectorAll<HTMLElement>(".w");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(spans, { opacity: 1 });
        return;
      }
      gsap.fromTo(
        spans,
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.04,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.6 },
        },
      );
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={i} className="w inline-block" style={{ opacity: 0.14 }}>
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
