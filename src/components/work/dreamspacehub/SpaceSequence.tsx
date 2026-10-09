"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useInView, useIsTouch, useReducedMotion } from "@/lib/hooks";

const SpaceCanvas = dynamic(() => import("./SpaceCanvas"), { ssr: false });

const STAGES = [
  { label: "2D plan", hint: "The architect’s drawing, as it exists today." },
  { label: "3D space", hint: "Walls rise from the plan into a room." },
  { label: "Projected space", hint: "Design data lands on real walls and floor." },
  { label: "1:1 experience", hint: "Stand inside it. True scale, before construction." },
];

/**
 * Signature sequence for DreamSpaceHub. Pinned for four stages of scroll:
 * 2D plan → 3D space → projected space → 1:1 experience.
 */
export default function SpaceSequence() {
  const ref = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [stage, setStage] = useState(0);
  const inView = useInView(ref, "25% 0px");
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (isReduced) {
        progressRef.current = 1;
        setStage(3);
        return;
      }
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "+=260%",
        pin: true,
        onUpdate: (self) => {
          progressRef.current = self.progress;
          if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
          const s = Math.min(3, Math.floor(self.progress * 4 + 0.08));
          setStage((prev) => (prev === s ? prev : s));
        },
      });
      return () => st.kill();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="stage-dark relative h-[100svh] overflow-hidden bg-bg" aria-label="DreamSpaceHub sequence: plan to projected 1:1 space">
      <div className="absolute inset-0" aria-hidden="true">
        <SpaceCanvas progressRef={progressRef} active={inView} isTouch={isTouch} reduced={reduced} />
      </div>

      <div className="px-gutter pointer-events-none absolute inset-0 flex flex-col justify-between pb-8 pt-[calc(var(--nav-h)+1rem)]">
        <div className="flex items-start justify-between">
          <span className="t-eyebrow flex items-center gap-3">
            <span className="h-px w-6 bg-accent" />
            Signature sequence
          </span>
          <ol className="hidden flex-col items-end gap-2 sm:flex">
            {STAGES.map((s, i) => (
              <li key={s.label} className={`t-eyebrow flex items-center gap-3 transition-colors duration-500 ${i === stage ? "!text-ink" : "!text-ink-3"}`}>
                <span>{s.label}</span>
                <span className={`h-px w-6 transition-colors duration-500 ${i <= stage ? "bg-accent" : "bg-line"}`} />
              </li>
            ))}
          </ol>
        </div>

        <div className="flex items-end justify-between gap-6">
          <div className="max-w-[34rem]">
            <p className="t-eyebrow !text-accent">0{stage + 1} / 04</p>
            <p key={stage} className="t-display t-lg rise mt-2">
              {STAGES[stage].label}
            </p>
            <p key={`h${stage}`} className="t-body rise mt-3 max-w-[40ch]">
              {STAGES[stage].hint}
            </p>
          </div>
          <div className="hidden w-44 shrink-0 md:block">
            <p className="t-eyebrow mb-2 text-right">Scroll</p>
            <div className="h-px w-full bg-line">
              <div ref={barRef} className="h-full origin-left bg-accent" style={{ transform: "scaleX(0)" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
