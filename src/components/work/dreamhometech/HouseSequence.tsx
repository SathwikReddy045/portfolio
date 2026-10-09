"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useInView, useIsTouch, useReducedMotion } from "@/lib/hooks";
import Configurator from "./Configurator";
import { rooms } from "./houseModel";

const HouseScene = dynamic(() => import("./HouseScene"), { ssr: false });

export const HOUSE_STAGES = [
  { label: "2D floorplan", hint: "A conventional builder floorplan is uploaded. Lines on a page." },
  { label: "Walls", hint: "Wall lines are read and become measured, solid walls." },
  { label: "Rooms", hint: "Enclosed areas are identified and named." },
  { label: "Doors / windows", hint: "Openings are cut and framed." },
  { label: "Furniture", hint: "Spaces are furnished so they read as rooms, not boxes." },
  { label: "Materials", hint: "Walls and floors receive finishes." },
  { label: "Lighting", hint: "Daylight and fixtures make it feel like a home." },
  { label: "Complete 3D house", hint: "A whole house, generated from one drawing." },
  { label: "Interactive home", hint: "Now it can be changed. Orbit the house, click a room, choose finishes." },
];

/**
 * Sticky scrollytelling for DreamHomeTech: the 3D house builds itself while
 * the stage copy scrolls past, ending in a working configurator.
 */
export default function HouseSequence() {
  const ref = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [stage, setStage] = useState(0);
  const inView = useInView(stickyRef, "20% 0px");
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const col = columnRef.current;
      if (!col) return;
      const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (isReduced) {
        progressRef.current = 8;
        setStage(8);
        return;
      }
      const st = ScrollTrigger.create({
        trigger: col,
        start: "top 55%",
        end: "bottom 55%",
        onUpdate: (self) => {
          const s = self.progress * 8;
          progressRef.current = s;
          const idx = Math.min(8, Math.round(s));
          setStage((prev) => (prev === idx ? prev : idx));
        },
      });
      return () => st.kill();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="relative border-t border-line">
      <div className="lg:grid lg:grid-cols-[1fr_minmax(340px,40%)]">
        {/* sticky scene */}
        <div ref={stickyRef} className="sticky top-0 z-10 h-[56svh] overflow-hidden bg-bg lg:h-[100svh]">
          <div className="absolute inset-0" aria-hidden="true">
            <HouseScene progressRef={progressRef} labelRefs={labelRefs} active={inView} isTouch={isTouch} reduced={reduced} />
          </div>
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {rooms.map((r, i) => (
              <div
                key={r.id}
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                className="t-eyebrow absolute left-0 top-0 whitespace-nowrap !text-accent will-change-transform"
                style={{ opacity: 0 }}
              >
                {r.label}
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 pt-[calc(var(--nav-h)+0.25rem)] lg:p-8 lg:pt-[calc(var(--nav-h)+0.5rem)]">
            <div className="lg:hidden">
              <p className="t-eyebrow !text-accent">
                {String(stage + 1).padStart(2, "0")} / 09
              </p>
              <p key={stage} className="t-display t-md rise mt-2">
                {HOUSE_STAGES[stage].label}
              </p>
            </div>
            <p className="t-eyebrow hidden lg:block">
              <span className="!text-accent">{String(stage + 1).padStart(2, "0")}</span> / 09
            </p>
            <p className="t-eyebrow hidden lg:block">Generated from one floorplan</p>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-5 lg:p-8">
            <div className="flex gap-1.5">
              {HOUSE_STAGES.map((s, i) => (
                <span key={s.label} className={`h-1 w-5 transition-colors duration-500 ${i <= stage ? "bg-accent" : "bg-line"}`} />
              ))}
            </div>
            <p className="t-eyebrow !text-ink-3">{stage >= 8 ? "Drag to orbit · click a room" : "Scroll"}</p>
          </div>
        </div>

        {/* scrolling stages */}
        <div ref={columnRef} className="relative lg:border-l lg:border-line">
          {HOUSE_STAGES.map((s, i) => (
            <div
              key={s.label}
              className={`flex min-h-[52svh] flex-col justify-center px-[var(--gutter)] py-10 transition-opacity duration-500 lg:min-h-[70svh] lg:px-10 ${
                i === stage ? "opacity-100" : "opacity-40"
              }`}
            >
              <p className="t-eyebrow">
                <span className="!text-accent">{String(i + 1).padStart(2, "0")}</span> / 09
              </p>
              <h4 className="t-display t-lg mt-4">{s.label}</h4>
              <p className="t-body mt-5 max-w-[38ch]">{s.hint}</p>
              {i === 8 && (
                <div className="mt-8">
                  <Configurator />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
