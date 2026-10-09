"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { range, useInView, useIsTouch, useReducedMotion } from "@/lib/hooks";
import type { ShapeKind } from "./transitionShapes";

const TransitionCanvas = dynamic(() => import("./TransitionCanvas"), { ssr: false });

interface Label {
  number: string;
  title: string;
  caption: string;
}

interface Props {
  from: ShapeKind;
  to: ShapeKind;
  fromLabel: Label;
  toLabel: Label;
}

/**
 * Cinematic bridge between projects. The previous project's structure
 * (a real 3D line model) is transformed into the next one's under a scan
 * plane that sweeps through it. Pinned and scrubbed by scroll.
 */
export default function ProjectTransition({ from, to, fromLabel, toLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const inView = useInView(ref, "20% 0px");
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const apply = (p: number) => {
        progressRef.current = p;
        if (fromRef.current) fromRef.current.style.opacity = String(1 - range(p, 0.1, 0.4));
        if (toRef.current) toRef.current.style.opacity = String(range(p, 0.6, 0.9));
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      };
      if (isReduced) {
        apply(1);
        return;
      }
      apply(0);
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "+=120%",
        pin: true,
        onUpdate: (self) => apply(self.progress),
      });
      return () => st.kill();
    },
    { scope: ref, dependencies: [from, to] },
  );

  return (
    <div ref={ref} className="stage-dark relative h-[100svh] overflow-hidden bg-bg" aria-hidden="true">
      <div className="absolute inset-0">
        <TransitionCanvas from={from} to={to} progressRef={progressRef} active={inView} isTouch={isTouch} reduced={reduced} />
      </div>

      <div className="px-gutter pointer-events-none absolute inset-0 flex flex-col justify-between pb-10 pt-[calc(var(--nav-h)+1rem)]">
        <div className="flex items-center justify-between">
          <span className="t-eyebrow flex items-center gap-3">
            <span className="h-px w-6 bg-accent" />
            Transformation
          </span>
          <span className="t-eyebrow hidden sm:block">
            {fromLabel.caption} <span className="text-ink-3">→</span> {toLabel.caption}
          </span>
        </div>

        <div className="flex items-end justify-between gap-6">
          <div ref={fromRef}>
            <p className="t-eyebrow">
              {fromLabel.number} — {fromLabel.title}
            </p>
            <p className="t-mono mt-1 text-ink-3">{fromLabel.caption}</p>
          </div>
          <div className="hidden w-40 shrink-0 md:block">
            <div className="h-px w-full bg-line">
              <div ref={barRef} className="h-full origin-left bg-accent" style={{ transform: "scaleX(0)" }} />
            </div>
          </div>
          <div ref={toRef} className="text-right" style={{ opacity: 0 }}>
            <p className="t-eyebrow !text-accent">Next — {toLabel.number}</p>
            <p className="t-display t-md mt-1">{toLabel.title}</p>
            <p className="t-mono mt-1 text-ink-3">{toLabel.caption}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
