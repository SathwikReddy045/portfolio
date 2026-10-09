"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

if (typeof window !== "undefined") gsap.registerPlugin(MotionPathPlugin);

const INK = "rgb(var(--ink-rgb) / ";
const ACC = "var(--accent)";

const STEPS = [
  { lane: "builder", label: "Builder", x: 110, y: 120 },
  { lane: "builder", label: "Uploads floorplan", x: 280, y: 120 },
  { lane: "system", label: "System generates 3D home", x: 450, y: 225 },
  { lane: "builder", label: "Builder shares link", x: 620, y: 120 },
  { lane: "buyer", label: "Homebuyer enters experience", x: 790, y: 330 },
  { lane: "buyer", label: "Customizes home", x: 960, y: 330 },
  { lane: "buyer", label: "Experiences future home", x: 1110, y: 330 },
];

const PATH = "M110 120 H280 L450 225 L620 120 L790 330 H960 H1110";

/**
 * Builder → buyer workflow. The platform is built for builders; the buyer
 * experience is what it enables. Two lanes, one handoff.
 */
export default function BuyerWorkflow() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const nodes = el.querySelectorAll<SVGGElement>("[data-step]");
      const path = el.querySelector<SVGPathElement>("[data-path]");
      const handoff = el.querySelector<SVGPathElement>("[data-handoff]");
      const dot = el.querySelector<SVGCircleElement>("[data-dot]");
      const rows = el.querySelectorAll<HTMLElement>("[data-row]");

      const build = gsap.timeline({ paused: true });
      if (path) {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        build.to(path, { strokeDashoffset: 0, duration: 7, ease: "none" }, 0);
      }
      nodes.forEach((n, i) => {
        build.fromTo(n, { opacity: 0, scale: 0.7, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.6)" }, i * 1.05);
      });
      if (handoff) build.fromTo(handoff, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 3.4);
      rows.forEach((r, i) => build.fromTo(r, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.6 }, i * 0.9));

      let travel: gsap.core.Tween | undefined;
      if (dot && path) {
        travel = gsap.to(dot, {
          motionPath: { path, align: path, alignOrigin: [0.5, 0.5] },
          duration: 7,
          repeat: -1,
          ease: "none",
          paused: true,
        });
      }

      if (reduced) {
        build.progress(1);
        return () => {
          build.kill();
          travel?.kill();
        };
      }

      let built = false;
      let visible = false;
      const sync = () => {
        if (!travel) return;
        const on = built && visible;
        if (dot) gsap.to(dot, { opacity: on ? 1 : 0, duration: 0.3, overwrite: true });
        if (on) travel.play();
        else travel.pause();
      };
      const st1 = ScrollTrigger.create({
        trigger: el,
        start: "top 80%",
        end: "center 45%",
        scrub: 0.4,
        animation: build,
        onUpdate: (s) => {
          built = s.progress > 0.9;
          sync();
        },
      });
      const st2 = ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onToggle: (s) => {
          visible = s.isActive;
          sync();
        },
      });
      return () => {
        st1.kill();
        st2.kill();
        build.kill();
        travel?.kill();
      };
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="border border-line bg-bg-2/50">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="t-eyebrow !text-ink">Workflow</span>
        <span className="t-eyebrow hidden md:block">Builder lane / system / homebuyer lane</span>
      </div>

      {/* Desktop diagram */}
      <svg viewBox="0 0 1200 420" className="hidden w-full md:block" role="img" aria-label="Workflow: builder uploads a floorplan, the system generates a 3D home, the builder shares a link, the homebuyer enters, customizes and experiences the home">
        {[
          ["BUILDER", 120],
          ["SYSTEM", 225],
          ["HOMEBUYER", 330],
        ].map(([label, y]) => (
          <g key={label as string}>
            <line x1="20" y1={y} x2="1180" y2={y} stroke={`${INK}0.07)`} strokeDasharray="2 6" />
            <text x="20" y={Number(y) - 48} fontSize="9" letterSpacing="2" className="font-mono" fill={`${INK}0.4)`}>
              {label}
            </text>
          </g>
        ))}
        <path data-path d={PATH} fill="none" stroke={`${INK}0.35)`} strokeWidth="1.2" />
        <path data-handoff d="M620 120 L790 330" fill="none" stroke={ACC} strokeWidth="1.2" strokeDasharray="4 6" opacity="0" />
        <text x="735" y="215" fontSize="9" letterSpacing="2" className="font-mono" fill={ACC} transform="rotate(51 735 215)">
          HANDOFF
        </text>
        <circle data-dot r="4" fill={ACC} opacity="0" />

        {STEPS.map((s, i) => (
          <g key={s.label} transform={`translate(${s.x} ${s.y})`}>
            <g data-step>
            <circle r="28" fill="var(--bg)" stroke={s.lane === "system" ? ACC : `${INK}0.5)`} />
            <Icon index={i} />
            <text y="52" textAnchor="middle" fontSize="9.5" letterSpacing="1.4" className="font-mono" fill={`${INK}0.85)`}>
              {s.label.toUpperCase().length > 18 ? (
                <>
                  <tspan x="0">{s.label.toUpperCase().split(" ").slice(0, 2).join(" ")}</tspan>
                  <tspan x="0" dy="13">
                    {s.label.toUpperCase().split(" ").slice(2).join(" ")}
                  </tspan>
                </>
              ) : (
                s.label.toUpperCase()
              )}
            </text>
            <text y="-40" textAnchor="middle" fontSize="8" letterSpacing="1.5" className="font-mono" fill={ACC}>
              0{i + 1}
            </text>
            </g>
          </g>
        ))}
      </svg>

      {/* Mobile list */}
      <ol className="divide-y divide-line md:hidden">
        {STEPS.map((s, i) => (
          <li key={s.label} data-row className="flex items-center gap-4 px-5 py-4">
            <span className="t-mono w-6 text-accent">0{i + 1}</span>
            <svg viewBox="-30 -30 60 60" className="h-10 w-10 shrink-0" aria-hidden="true">
              <circle r="28" fill="var(--bg)" stroke={s.lane === "system" ? ACC : `${INK}0.5)`} />
              <Icon index={i} />
            </svg>
            <div>
              <p className="t-display t-sm">{s.label}</p>
              <p className="t-eyebrow mt-1">{s.lane === "builder" ? "Builder" : s.lane === "system" ? "System" : "Homebuyer"}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Icon({ index }: { index: number }) {
  const s = `${INK}0.9)`;
  switch (index) {
    case 0:
      return (
        <g fill="none" stroke={s}>
          <circle cy="-5" r="6" />
          <path d="M-11 13 a11 11 0 0 1 22 0" />
          <path d="M-9 -9 h18" stroke={ACC} />
        </g>
      );
    case 1:
      return (
        <g fill="none" stroke={s}>
          <path d="M-9 -12 h12 l6 6 v18 h-18 z" />
          <path d="M-5 0 h10 M-5 5 h10 M-5 -5 h5" />
          <path d="M0 -20 v8 M-3 -17 l3 -3 l3 3" stroke={ACC} />
        </g>
      );
    case 2:
      return (
        <g fill="none" stroke={ACC}>
          <path d="M-12 2 l12 -7 l12 7 v10 l-12 7 l-12 -7 z" />
          <path d="M0 -5 v17 M-12 2 l12 7 l12 -7" />
          <path d="M-12 2 l12 -13 l12 13" />
        </g>
      );
    case 3:
      return (
        <g fill="none" stroke={s}>
          <rect x="-13" y="-5" width="14" height="10" rx="5" />
          <rect x="-1" y="-5" width="14" height="10" rx="5" />
          <path d="M-4 0 h8" stroke={ACC} />
        </g>
      );
    case 4:
      return (
        <g fill="none" stroke={s}>
          <circle cx="-5" cy="-6" r="5" />
          <path d="M-14 12 a9 9 0 0 1 18 0" />
          <rect x="6" y="-8" width="9" height="16" rx="1.5" stroke={ACC} />
        </g>
      );
    case 5:
      return (
        <g fill="none" stroke={s}>
          <rect x="-13" y="-12" width="11" height="11" />
          <rect x="2" y="-12" width="11" height="11" fill={ACC} stroke={ACC} />
          <rect x="-13" y="2" width="11" height="11" />
          <rect x="2" y="2" width="11" height="11" />
        </g>
      );
    default:
      return (
        <g fill="none" stroke={s}>
          <rect x="-14" y="-7" width="28" height="14" rx="5" />
          <circle cx="-6" cy="0" r="3" stroke={ACC} />
          <circle cx="6" cy="0" r="3" stroke={ACC} />
        </g>
      );
  }
}
