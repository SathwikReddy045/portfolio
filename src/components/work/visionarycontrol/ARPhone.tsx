"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useInView, useReducedMotion, range } from "@/lib/hooks";
import { useARStore, type ACMode } from "@/lib/store";
import type { ARAnchors } from "./ARScene";

const ARScene = dynamic(() => import("./ARScene"), { ssr: false });

const STEPS = [
  { label: "Real-world appliance", hint: "A phone camera. An ordinary air conditioner on an ordinary wall." },
  { label: "Camera recognition", hint: "Computer vision finds the object in the frame and starts tracking it." },
  { label: "AR identification", hint: "The appliance is identified. The digital layer locks to the physical object." },
  { label: "Digital control interface", hint: "Its controls appear, anchored to the device itself." },
  { label: "Physical device response", hint: "A tap on screen. The louver opens in the room." },
];

/**
 * Cinematic phone-camera sequence for Visionary Control. Pinned; scroll walks
 * through recognition → identification → anchored controls → device response.
 * The AR panel is a working control surface once it appears.
 */
export default function ARPhone() {
  const ref = useRef<HTMLDivElement>(null);
  const anchorsRef = useRef<ARAnchors>({ box: null, label: null, panel: null, leader: null, points: [] });
  const ui = useRef<Record<string, HTMLElement | SVGElement | null>>({});
  const tappedRef = useRef(false);
  const [stage, setStage] = useState(0);
  const [tapped, setTapped] = useState(false);
  const inView = useInView(ref, "25% 0px");
  const reduced = useReducedMotion();
  const ar = useARStore();

  const apply = (s: number) => {
    const u = ui.current;
    const set = (key: string, v: number) => {
      const el = u[key];
      if (el) (el as HTMLElement).style.opacity = String(Math.max(0, Math.min(1, v)));
    };
    set("hint", 1 - range(s, 0.6, 1.0));
    set("reticle", 1 - range(s, 1.9, 2.2));
    set("scan", range(s, 1.0, 1.2) * (1 - range(s, 1.9, 2.1)));
    set("points", range(s, 1.05, 1.5) * (1 - range(s, 2.5, 2.9)));
    set("box", range(s, 2.0, 2.4));
    set("label", range(s, 2.25, 2.6));
    const panel = range(s, 3.0, 3.4);
    set("panel", panel);
    set("leader", panel);
    set("status", range(s, 1.0, 1.2));
    set("chrome", 1 - range(s, 2.9, 3.2));
    const box = u.box as HTMLElement | null;
    if (box) box.style.setProperty("--conv", String(1 + (1 - range(s, 2.0, 2.6)) * 0.35));
    const panelEl = u.panel as HTMLElement | null;
    if (panelEl) panelEl.style.pointerEvents = s >= 3.3 ? "auto" : "none";
    const statusEl = u.status as HTMLElement | null;
    if (statusEl) statusEl.textContent = s < 2 ? "SCANNING" : s < 3 ? "TRACKING" : "ANCHORED";
  };

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (isReduced) {
        apply(4.5);
        setStage(4);
        useARStore.getState().setPower(true);
        return;
      }
      apply(0);
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "+=300%",
        pin: true,
        onUpdate: (self) => {
          const s = self.progress * 4.6;
          apply(s);
          const idx = Math.min(4, Math.floor(s));
          setStage((prev) => (prev === idx ? prev : idx));
          if (s >= 4 && !tappedRef.current) {
            tappedRef.current = true;
            useARStore.getState().setPower(true);
            setTapped(true);
            window.setTimeout(() => setTapped(false), 900);
          } else if (s < 3.6 && tappedRef.current) {
            tappedRef.current = false;
            useARStore.getState().setPower(false);
          }
        },
      });
      return () => st.kill();
    },
    { scope: ref },
  );

  const reg = (key: string) => (el: HTMLElement | SVGElement | null) => {
    ui.current[key] = el;
  };

  return (
    <div ref={ref} className="relative h-[100svh] overflow-hidden bg-bg" aria-label="Visionary Control sequence">
      <div className="px-gutter absolute inset-0 grid grid-cols-1 items-center pb-6 pt-[calc(var(--nav-h)+0.5rem)] lg:grid-cols-[1fr_auto_1fr]">
        {/* steps */}
        <ol className="hidden flex-col gap-3 lg:flex">
          {STEPS.map((s, i) => (
            <li key={s.label} className={`t-eyebrow flex items-center gap-3 transition-colors duration-500 ${i === stage ? "!text-ink" : "!text-ink-3"}`}>
              <span className={`h-px w-6 transition-colors duration-500 ${i <= stage ? "bg-accent" : "bg-line"}`} />
              <span className={i === stage ? "!text-accent" : ""}>0{i + 1}</span>
              <span>{s.label}</span>
            </li>
          ))}
        </ol>

        {/* phone */}
        <div className="justify-self-center">
          <div
            className="relative rounded-[46px] bg-[#141416] p-[9px] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            style={{ height: "min(74svh, 760px)", aspectRatio: "9 / 19" }}
          >
            <span className="absolute -left-[3px] top-[18%] h-[8%] w-[3px] rounded-l bg-[#2a2a2e]" aria-hidden="true" />
            <span className="absolute -left-[3px] top-[29%] h-[8%] w-[3px] rounded-l bg-[#2a2a2e]" aria-hidden="true" />
            <span className="absolute -right-[3px] top-[22%] h-[12%] w-[3px] rounded-r bg-[#2a2a2e]" aria-hidden="true" />

            <div className="stage-dark relative h-full w-full overflow-hidden rounded-[38px] bg-black" data-cursor="hidden">
              {/* camera feed */}
              <div className="absolute inset-0" aria-hidden="true">
                <ARScene anchorsRef={anchorsRef} active={inView} reduced={reduced} />
              </div>
              {/* lens vignette + grain */}
              <div className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_90%_at_50%_45%,transparent_55%,rgba(0,0,0,0.55))]" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E')]" />

              {/* dynamic island */}
              <div className="absolute left-1/2 top-3 z-30 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />

              {/* camera chrome */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-[46px]">
                <span className="t-eyebrow flex items-center gap-2 !text-[0.6rem] !text-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent blink" /> AR
                </span>
                <span ref={reg("status")} className="t-eyebrow !text-[0.6rem] !text-ink/80" style={{ opacity: 0 }}>
                  SCANNING
                </span>
              </div>
              <div ref={reg("chrome")} className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 pb-6">
                <div className="flex gap-4">
                  {["Photo", "Video", "AR"].map((m) => (
                    <span key={m} className={`t-eyebrow !text-[0.58rem] ${m === "AR" ? "!text-accent" : "!text-ink/50"}`}>
                      {m}
                    </span>
                  ))}
                </div>
                <span className="h-12 w-12 rounded-full border-2 border-ink/80 p-1">
                  <span className="block h-full w-full rounded-full bg-ink/90" />
                </span>
              </div>

              {/* stage 0: reticle + hint */}
              <div ref={reg("reticle")} className="pointer-events-none absolute left-1/2 top-[44%] h-24 w-24 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
                {["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "left-0 bottom-0 border-l border-b", "right-0 bottom-0 border-r border-b"].map((c) => (
                  <span key={c} className={`absolute h-4 w-4 border-ink/70 ${c}`} />
                ))}
              </div>
              <p ref={reg("hint")} className="t-eyebrow pointer-events-none absolute inset-x-0 top-[58%] text-center !text-[0.6rem] !text-ink/80">
                Point at a device
              </p>

              {/* stage 1: scan line + feature points */}
              <div ref={reg("scan")} className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: 0 }} aria-hidden="true">
                <span className="scanline absolute inset-x-0 h-px bg-accent/80 shadow-[0_0_16px_rgb(var(--accent-rgb)/0.8)]" />
              </div>
              <div ref={reg("points")} className="pointer-events-none absolute inset-0" style={{ opacity: 0 }} aria-hidden="true">
                {Array.from({ length: 14 }).map((_, i) => (
                  <span
                    key={i}
                    ref={(el) => {
                      anchorsRef.current.points[i] = el;
                    }}
                    className="absolute left-0 top-0 block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 will-change-transform"
                  >
                    <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-accent" />
                    <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-accent" />
                  </span>
                ))}
              </div>

              {/* stage 2: bounding box + label */}
              <div
                ref={(el) => {
                  anchorsRef.current.box = el;
                  ui.current.box = el;
                }}
                className="pointer-events-none absolute left-0 top-0 will-change-transform"
                style={{ opacity: 0, scale: "var(--conv, 1)" } as React.CSSProperties}
                aria-hidden="true"
              >
                {["-left-px -top-px border-l border-t", "-right-px -top-px border-r border-t", "-left-px -bottom-px border-l border-b", "-right-px -bottom-px border-r border-b"].map((c) => (
                  <span key={c} className={`absolute h-3.5 w-3.5 border-accent ${c}`} />
                ))}
                <span className="absolute inset-0 border border-accent/25" />
              </div>
              <div
                ref={(el) => {
                  anchorsRef.current.label = el;
                  ui.current.label = el;
                }}
                className="pointer-events-none absolute left-0 top-0 will-change-transform"
                style={{ opacity: 0 }}
              >
                <p className="t-eyebrow !text-[0.6rem] !text-accent">Air conditioner</p>
                <p className="t-eyebrow mt-0.5 flex items-center gap-1.5 !text-[0.55rem] !text-ink/70">
                  <span className="h-1 w-1 rounded-full bg-accent" /> Identified
                </p>
              </div>

              {/* stage 3: anchored control panel */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                <line
                  ref={(el) => {
                    anchorsRef.current.leader = el;
                    ui.current.leader = el;
                  }}
                  stroke="var(--accent)"
                  strokeOpacity="0.7"
                  strokeDasharray="3 4"
                  style={{ opacity: 0 }}
                />
              </svg>
              <div
                ref={(el) => {
                  anchorsRef.current.panel = el;
                  ui.current.panel = el;
                }}
                className="absolute left-0 top-0 w-[168px] rounded-md border border-ink/15 bg-black/60 p-3 backdrop-blur-md will-change-transform"
                style={{ opacity: 0, pointerEvents: "none" }}
              >
                <div className="flex items-center justify-between">
                  <p className="t-eyebrow !text-[0.58rem] !text-ink">Controls</p>
                  <span className={`t-eyebrow !text-[0.55rem] ${ar.power ? "!text-accent" : "!text-ink/50"}`}>{ar.power ? "On" : "Standby"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => ar.togglePower()}
                  data-cursor="tap"
                  className={`relative mt-2 flex w-full items-center justify-between overflow-hidden rounded border px-2.5 py-2 transition-colors ${ar.power ? "border-accent bg-accent/15" : "border-ink/25"}`}
                >
                  {tapped && <span className="ripple pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent" />}
                  <span className="t-eyebrow !text-[0.6rem] !text-ink">Power</span>
                  <span className={`h-2 w-2 rounded-full ${ar.power ? "bg-accent shadow-[0_0_10px_rgb(var(--accent-rgb)/0.9)]" : "bg-ink/30"}`} />
                </button>
                <div className="mt-2 flex items-center justify-between rounded border border-ink/15 px-2 py-1.5">
                  <button type="button" onClick={() => ar.setTemp(ar.temp - 1)} className="t-mono px-1 text-ink" aria-label="Lower temperature" data-cursor="tap">
                    −
                  </button>
                  <span className="t-mono text-[0.9rem] text-ink">
                    {ar.temp}
                    <span className="text-ink/50">°</span>
                  </span>
                  <button type="button" onClick={() => ar.setTemp(ar.temp + 1)} className="t-mono px-1 text-ink" aria-label="Raise temperature" data-cursor="tap">
                    +
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {(["cool", "heat", "fan"] as ACMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => ar.setMode(m)}
                      data-cursor="tap"
                      className={`t-eyebrow rounded border py-1 !text-[0.55rem] transition-colors ${ar.mode === m ? "border-accent !text-accent" : "border-ink/15 !text-ink/70"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="t-eyebrow !text-[0.55rem]">Fan</span>
                  <div className="flex gap-1">
                    {([1, 2, 3] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => ar.setFan(f)}
                        aria-label={`Fan speed ${f}`}
                        data-cursor="tap"
                        className={`h-3 w-4 rounded-sm transition-colors ${ar.fan >= f ? "bg-accent" : "bg-ink/20"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* current step copy */}
        <div className="hidden pl-14 lg:block">
          <p className="t-eyebrow !text-accent">0{stage + 1} / 05</p>
          <p key={stage} className="t-display t-md rise mt-3 max-w-[14ch]">
            {STEPS[stage].label}
          </p>
          <p key={`h${stage}`} className="t-body rise mt-4 max-w-[30ch]">
            {STEPS[stage].hint}
          </p>
        </div>
      </div>

      {/* mobile step strip */}
      <div className="px-gutter absolute inset-x-0 bottom-4 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <p className="t-eyebrow !text-ink">
            <span className="!text-accent">0{stage + 1}</span> / 05 — {STEPS[stage].label}
          </p>
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <span key={s.label} className={`h-1 w-4 ${i <= stage ? "bg-accent" : "bg-line"}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
