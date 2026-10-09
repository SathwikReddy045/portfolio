"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useIsMobile } from "@/lib/hooks";

const INK = "rgb(var(--ink-rgb) / ";
const ACC = "var(--accent)";
const W = 200;
const H = 250;

const STEPS = [
  { n: "01", label: "CAD" },
  { n: "02", label: "Real-time data / geometry" },
  { n: "03", label: "Resolume" },
  { n: "04", label: "Projectors" },
  { n: "05", label: "Physical environment" },
];

/**
 * Animated technical diagram of the live-editing loop:
 * CAD → real-time geometry → Resolume → projectors → the physical room.
 * Scrolling builds the system node by node; once built, a live edit loops
 * through the whole pipeline.
 */
export default function LiveEditingDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const mobile = useIsMobile();

  const pos = (i: number) => (mobile ? { x: 110, y: 70 + i * 306 } : { x: 20 + i * 245, y: 100 });
  const viewBox = mobile ? "0 0 420 1590" : "0 0 1200 380";
  const connLen = mobile ? 56 : 45;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const q = (s: string) => el.querySelectorAll<SVGElement>(s);
      const one = (s: string) => el.querySelector<SVGElement>(s);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const nodes = q("[data-node]");
      const conns = q("[data-conn]");
      const titles = q("[data-title]");

      // Build-in, scrubbed by scroll
      const build = gsap.timeline({ paused: true });
      nodes.forEach((n, i) => {
        build.fromTo(n, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, i);
        build.fromTo(titles[i], { opacity: 0 }, { opacity: 1, duration: 0.6 }, i);
        if (conns[i]) build.fromTo(conns[i], { strokeDashoffset: connLen }, { strokeDashoffset: 0, duration: 0.6, ease: "none" }, i + 0.7);
      });

      // Live edit loop
      const loop = gsap.timeline({ repeat: -1, repeatDelay: 1.6, paused: true });
      const moveAxis = mobile ? "y" : "x";
      const pulseTo = () => ({ [moveAxis]: connLen }) as gsap.TweenVars;
      const cadWall = q("[data-cad-wall]");
      const cadHandle = one("[data-cad-handle]");
      const cadDimLine = one("[data-cad-dim-line]");
      const cadDimA = one("[data-cad-dim-a]");
      const cadDimB = one("[data-cad-dim-b]");
      const cadStatus = one("[data-cad-status]");
      const dataWall = one("[data-data-wall]");
      const dataBar = one("[data-data-bar]");
      const dataStatus = one("[data-data-status]");
      const resThumb = one("[data-res-thumb]");
      const resOut = one("[data-res-out]");
      const beams = q("[data-beam]");
      const envWall = one("[data-env-wall]");
      const envProj = one("[data-env-proj]");
      const pulses = q("[data-pulse]");
      const setText = (node: SVGElement | null, t: string) => () => {
        if (node) node.textContent = t;
      };

      if (cadHandle) loop.fromTo(cadHandle, { scale: 1, transformOrigin: "50% 50%" }, { scale: 1.6, duration: 0.3, yoyo: true, repeat: 1 }, 0);
      loop.add(setText(cadStatus, "EDITING WALL 07"), 0);
      loop.to(cadWall, { x: 30, duration: 0.9, ease: "power2.inOut" }, "edit");
      if (cadDimLine) loop.to(cadDimLine, { attr: { x2: 140 }, duration: 0.9, ease: "power2.inOut" }, "edit");
      if (cadDimA && cadDimB) {
        loop.to(cadDimA, { opacity: 0, duration: 0.25 }, "edit+=0.3");
        loop.to(cadDimB, { opacity: 1, duration: 0.25 }, "edit+=0.55");
      }
      const pulse = (i: number, at: string) => {
        if (!pulses[i]) return;
        loop.fromTo(pulses[i], { opacity: 1, x: 0, y: 0 }, { ...pulseTo(), duration: 0.45, ease: "none" }, at);
        loop.to(pulses[i], { opacity: 0, duration: 0.1 }, `${at}+=0.45`);
      };
      pulse(0, "edit+=0.55");
      loop.add("data", "edit+=1.05");
      if (dataWall) loop.to(dataWall, { scaleX: 1.3, transformOrigin: "0% 50%", duration: 0.6, ease: "power2.out" }, "data");
      if (dataBar) loop.to(dataBar, { attr: { width: 108 }, fill: "var(--accent)", duration: 0.5 }, "data");
      loop.add(setText(dataStatus, "UPDATE RECEIVED"), "data");
      pulse(1, "data+=0.3");
      loop.add("res", "data+=0.8");
      if (resThumb && resOut) loop.to([resThumb, resOut], { scaleX: 1.3, transformOrigin: "0% 50%", duration: 0.6, ease: "power2.out" }, "res");
      pulse(2, "res+=0.3");
      loop.add("proj", "res+=0.8");
      loop.to(beams, { opacity: 0.95, duration: 0.12, stagger: 0.06, yoyo: true, repeat: 3 }, "proj");
      pulse(3, "proj+=0.2");
      loop.add("env", "proj+=0.75");
      if (envWall) loop.to(envWall, { x: 18, y: -9, duration: 0.6, ease: "power2.inOut" }, "env");
      if (envProj) loop.fromTo(envProj, { opacity: 0.55 }, { opacity: 1, duration: 0.25, yoyo: true, repeat: 1 }, "env");
      // hold, then revert the edit
      loop.add("revert", "env+=2.2");
      loop.add(setText(cadStatus, "REVERTING"), "revert");
      loop.to(cadWall, { x: 0, duration: 0.9, ease: "power2.inOut" }, "revert");
      if (cadDimLine) loop.to(cadDimLine, { attr: { x2: 110 }, duration: 0.9, ease: "power2.inOut" }, "revert");
      if (cadDimA && cadDimB) {
        loop.to(cadDimB, { opacity: 0, duration: 0.25 }, "revert+=0.3");
        loop.to(cadDimA, { opacity: 1, duration: 0.25 }, "revert+=0.55");
      }
      pulse(0, "revert+=0.55");
      if (dataWall) loop.to(dataWall, { scaleX: 1, duration: 0.6 }, "revert+=1.05");
      if (dataBar) loop.to(dataBar, { attr: { width: 80 }, fill: "rgb(var(--ink-rgb) / 0.3)", duration: 0.5 }, "revert+=1.05");
      loop.add(setText(dataStatus, "SYNCED"), "revert+=1.05");
      pulse(1, "revert+=1.35");
      if (resThumb && resOut) loop.to([resThumb, resOut], { scaleX: 1, duration: 0.6 }, "revert+=1.85");
      pulse(2, "revert+=2.15");
      loop.to(beams, { opacity: 0.95, duration: 0.12, stagger: 0.06, yoyo: true, repeat: 3 }, "revert+=2.65");
      pulse(3, "revert+=2.85");
      if (envWall) loop.to(envWall, { x: 0, y: 0, duration: 0.6, ease: "power2.inOut" }, "revert+=3.4");
      loop.add(setText(cadStatus, "SYNCED"), "revert+=3.4");

      if (reduced) {
        build.progress(1);
        return () => {
          loop.kill();
          build.kill();
        };
      }

      let built = false;
      let visible = false;
      const sync = () => {
        if (built && visible) loop.play();
        else loop.pause();
      };
      const st1 = ScrollTrigger.create({
        trigger: el,
        start: "top 78%",
        end: mobile ? "bottom 70%" : "center 40%",
        scrub: 0.4,
        animation: build,
        onUpdate: (self) => {
          built = self.progress > 0.92;
          sync();
        },
      });
      const st2 = ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          visible = self.isActive;
          sync();
        },
      });
      return () => {
        st1.kill();
        st2.kill();
        loop.kill();
        build.kill();
      };
    },
    { scope: ref, dependencies: [mobile] },
  );

  return (
    <div ref={ref} className="relative border border-line bg-bg-2/50">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="t-eyebrow !text-ink">Live editing loop</span>
        <span className="t-eyebrow flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent blink" /> data pulse
        </span>
      </div>
      <svg viewBox={viewBox} className="block w-full" role="img" aria-label="Diagram: a CAD edit flows through real-time geometry and Resolume to projectors and the physical room">
        <defs>
          <linearGradient id="le-beam" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={ACC} stopOpacity="0.6" />
            <stop offset="1" stopColor={ACC} stopOpacity="0" />
          </linearGradient>
        </defs>

        {STEPS.map((s, i) => {
          const p = pos(i);
          return (
            <g key={s.n}>
              <text data-title x={p.x} y={p.y - 14} className="font-mono" fontSize="10" letterSpacing="1.5" fill={`${INK}0.7)`}>
                <tspan fill={ACC}>{s.n}</tspan>
                <tspan dx="10">{s.label.toUpperCase()}</tspan>
              </text>
              {i < STEPS.length - 1 && (
                <g>
                  <line
                    data-conn
                    x1={mobile ? p.x + W / 2 : p.x + W}
                    y1={mobile ? p.y + H : p.y + H / 2}
                    x2={mobile ? p.x + W / 2 : p.x + W + connLen}
                    y2={mobile ? p.y + H + connLen : p.y + H / 2}
                    stroke={`${INK}0.35)`}
                    strokeDasharray={connLen}
                  />
                  <circle
                    data-pulse
                    cx={mobile ? p.x + W / 2 : p.x + W}
                    cy={mobile ? p.y + H : p.y + H / 2}
                    r="3"
                    fill={ACC}
                    opacity="0"
                  />
                </g>
              )}
              <g transform={`translate(${p.x} ${p.y})`}>
                <g data-node>
                  {i === 0 && <CadNode />}
                  {i === 1 && <DataNode />}
                  {i === 2 && <ResolumeNode />}
                  {i === 3 && <ProjectorNode />}
                  {i === 4 && <EnvironmentNode />}
                </g>
              </g>
            </g>
          );
        })}
      </svg>
      <div className="grid grid-cols-1 gap-px border-t border-line bg-line md:grid-cols-3">
        {[
          ["Edit", "The architect moves a wall in CAD."],
          ["Propagate", "The change becomes real-time geometry and a Resolume composition update."],
          ["Project", "Projectors repaint the physical environment. No export, no rebuild."],
        ].map(([t, d]) => (
          <div key={t} className="bg-bg px-5 py-4">
            <p className="t-eyebrow !text-ink">{t}</p>
            <p className="t-body mt-1 !text-[0.9rem]">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Node drawings (local origin top-left, 200 x 250)                     */
/* ------------------------------------------------------------------ */

const Frame = ({ title }: { title: string }) => (
  <>
    <rect width={W} height={H} fill={`${INK}0.02)`} stroke={`${INK}0.18)`} />
    <text x="12" y="20" fontSize="8" letterSpacing="1.2" className="font-mono" fill={`${INK}0.6)`}>
      {title}
    </text>
  </>
);

function CadNode() {
  return (
    <>
      <rect width={W} height={H} fill={`${INK}0.02)`} stroke={`${INK}0.18)`} />
      <rect width={W} height="22" fill={`${INK}0.06)`} />
      {[10, 20, 30].map((x) => (
        <circle key={x} cx={x} cy="11" r="2.5" fill={`${INK}0.35)`} />
      ))}
      <text x="190" y="15" textAnchor="end" fontSize="8" letterSpacing="1" className="font-mono" fill={`${INK}0.6)`}>
        PLAN_A.DWG
      </text>
      <rect y="22" width="22" height={H - 22} fill={`${INK}0.03)`} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x="8" y={34 + i * 16} width="6" height="6" fill={`${INK}0.25)`} />
      ))}
      {/* plan */}
      <rect x="42" y="48" width="140" height="170" fill="none" stroke={`${INK}0.4)`} />
      <path d="M42 120 H110 M110 48 V120 M142 120 V218" stroke={`${INK}0.4)`} fill="none" />
      <path d="M110 150 A28 28 0 0 1 138 178" stroke={`${INK}0.3)`} strokeDasharray="2 3" fill="none" />
      <path d="M60 48 h30 M60 218 h40" stroke={`${INK}0.7)`} strokeWidth="3" />
      {/* editable wall */}
      <g data-cad-wall>
        <line x1="110" y1="120" x2="110" y2="218" stroke={ACC} strokeWidth="2.5" />
        <circle data-cad-handle cx="110" cy="169" r="4" fill="var(--bg)" stroke={ACC} />
        <path d="M0 0 L0 11 L3 8 L5.5 12.5 L7.5 11.5 L5 7 L9 7 Z" fill="var(--ink)" transform="translate(114 174)" />
      </g>
      {/* dimension */}
      <line data-cad-dim-line x1="42" y1="36" x2="110" y2="36" stroke={`${INK}0.45)`} />
      <line x1="42" y1="32" x2="42" y2="40" stroke={`${INK}0.45)`} />
      <text data-cad-dim-a x="76" y="32" textAnchor="middle" fontSize="7" className="font-mono" fill={`${INK}0.8)`}>
        4.20
      </text>
      <text data-cad-dim-b x="91" y="32" textAnchor="middle" fontSize="7" className="font-mono" fill={ACC} opacity="0">
        4.80
      </text>
      <text data-cad-status x="42" y="240" fontSize="7" letterSpacing="1" className="font-mono" fill={ACC}>
        SYNCED
      </text>
    </>
  );
}

function DataNode() {
  return (
    <>
      <Frame title="GEOMETRY STREAM" />
      <g transform="translate(40 40)">
        <path d="M0 60 L60 30 L120 60 L60 90 Z" fill={`${INK}0.03)`} stroke={`${INK}0.2)`} />
        <g data-data-wall>
          <path d="M10 55 L10 20 L70 -10 L70 25 Z" fill={`${INK}0.08)`} stroke={ACC} strokeWidth="1" />
          <path d="M70 25 L70 -10 L78 -6 L78 29 Z" fill={`${INK}0.14)`} stroke={ACC} strokeWidth="1" />
          <path d="M10 20 L70 -10 L78 -6 L18 24 Z" fill={`${INK}0.2)`} stroke={ACC} strokeWidth="1" />
        </g>
      </g>
      {[
        ["TRANSFORM", 70],
        ["GEOMETRY", 80],
        ["MATERIAL", 50],
      ].map(([label, w], i) => (
        <g key={label} transform={`translate(12 ${150 + i * 22})`}>
          <text y="7" fontSize="7" letterSpacing="1" className="font-mono" fill={`${INK}0.55)`}>
            {label}
          </text>
          <rect data-data-bar={label === "GEOMETRY" ? "" : undefined} x="72" y="2" width={w} height="4" fill={`${INK}0.3)`} />
        </g>
      ))}
      <text data-data-status x="12" y="238" fontSize="7" letterSpacing="1" className="font-mono" fill={`${INK}0.6)`}>
        SYNCED
      </text>
    </>
  );
}

function ResolumeNode() {
  return (
    <>
      <Frame title="COMPOSITION" />
      <circle data-res-live cx="178" cy="17" r="3" fill={ACC} className="blink" />
      <text x="170" y="20" textAnchor="end" fontSize="7" letterSpacing="1" className="font-mono" fill={`${INK}0.6)`}>
        LIVE
      </text>
      {[3, 2, 1].map((layer, k) => (
        <g key={layer} transform={`translate(12 ${40 + k * 42})`}>
          <text y="16" fontSize="7" letterSpacing="1" className="font-mono" fill={`${INK}0.55)`}>
            LAYER {layer}
          </text>
          {[0, 1, 2].map((j) => {
            const active = k === 1 && j === 0;
            return (
              <g key={j} transform={`translate(${60 + j * 40} 0)`}>
                <rect width="34" height="26" fill={active ? "rgb(var(--accent-rgb) / 0.12)" : `${INK}0.04)`} stroke={active ? ACC : `${INK}0.22)`} />
                {active && <rect data-res-thumb x="6" y="7" width="12" height="12" fill={ACC} opacity="0.8" />}
                {!active && <rect x="6" y="8" width="10" height="10" fill={`${INK}0.15)`} />}
              </g>
            );
          })}
        </g>
      ))}
      <rect x="12" y="172" width="176" height="58" fill={`${INK}0.03)`} stroke={`${INK}0.22)`} />
      <text x="18" y="184" fontSize="6.5" letterSpacing="1" className="font-mono" fill={`${INK}0.45)`}>
        OUTPUT
      </text>
      <rect data-res-out x="40" y="190" width="56" height="34" fill="rgb(var(--accent-rgb) / 0.25)" stroke={ACC} />
      <rect x="110" y="190" width="40" height="34" fill={`${INK}0.06)`} stroke={`${INK}0.2)`} />
    </>
  );
}

function ProjectorNode() {
  return (
    <>
      <Frame title="PROJECTOR ARRAY" />
      {[0, 1, 2].map((k) => {
        const y = 58 + k * 58;
        return (
          <g key={k}>
            <polygon data-beam points={`58,${y + 8} 186,${y - 24} 186,${y + 40}`} fill="url(#le-beam)" opacity="0.45" />
            <rect x="16" y={y} width="34" height="16" rx="2" fill={`${INK}0.06)`} stroke={`${INK}0.55)`} />
            <circle cx="53" cy={y + 8} r="5" fill="var(--bg)" stroke={`${INK}0.6)`} />
            <circle cx="53" cy={y + 8} r="2" fill={ACC} />
          </g>
        );
      })}
      <rect x="186" y="30" width="3" height="200" fill={`${INK}0.25)`} />
      <text data-proj-status x="12" y="238" fontSize="7" letterSpacing="1" className="font-mono" fill={`${INK}0.6)`}>
        CALIBRATED
      </text>
    </>
  );
}

function EnvironmentNode() {
  return (
    <>
      <Frame title="1:1 ENVIRONMENT" />
      <g transform="translate(0 10)">
        <polygon points="100,220 190,175 100,130 10,175" fill={`${INK}0.03)`} stroke={`${INK}0.35)`} />
        <polygon points="10,175 100,130 100,40 10,85" fill={`${INK}0.04)`} stroke={`${INK}0.35)`} />
        <polygon points="100,130 190,175 190,85 100,40" fill={`${INK}0.05)`} stroke={`${INK}0.35)`} />
        <polygon data-env-proj points="108,126 182,163 182,96 108,59" fill="rgb(var(--accent-rgb) / 0.16)" stroke={ACC} strokeOpacity="0.7" />
        <polygon points="126,106 160,124 160,98 126,80" fill="none" stroke={ACC} strokeOpacity="0.8" />
        <line data-env-wall x1="58" y1="152" x2="58" y2="66" stroke={ACC} strokeWidth="2" />
        <circle cx="100" cy="160" r="5" fill={`${INK}0.85)`} />
        <rect x="95" y="166" width="10" height="26" rx="5" fill={`${INK}0.85)`} />
        <rect x="96" y="18" width="8" height="6" fill={`${INK}0.5)`} />
        <path d="M100 24 L108 59 M100 24 L182 96" stroke={`${INK}0.2)`} strokeDasharray="2 3" />
      </g>
      <text data-env-status x="12" y="238" fontSize="7" letterSpacing="1" className="font-mono" fill={ACC}>
        LIVE 1:1
      </text>
    </>
  );
}
