"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { range } from "@/lib/hooks";

const INK = "rgb(var(--ink-rgb) / ";
const ACC = "var(--accent)";

type Seg = [number, number, number, number];

/* Wall segments with door gaps left open. */
const WALLS: Seg[] = [
  [60, 40, 740, 40],
  [740, 40, 740, 480],
  [740, 480, 60, 480],
  [60, 480, 60, 190],
  [60, 150, 60, 40],
  [380, 40, 380, 120],
  [380, 160, 380, 300],
  [60, 300, 315, 300],
  [355, 300, 380, 300],
  [380, 220, 740, 220],
  [600, 40, 600, 150],
  [600, 190, 600, 220],
  [300, 300, 300, 380],
  [300, 420, 300, 480],
  [380, 300, 380, 380],
  [380, 420, 380, 480],
];

const DOORS = [
  { d: "M380 120 A40 40 0 0 1 420 160", c: [380, 140] },
  { d: "M60 150 A40 40 0 0 1 100 190", c: [60, 170] },
  { d: "M315 300 A40 40 0 0 0 355 340", c: [335, 300] },
  { d: "M300 380 A40 40 0 0 0 260 420", c: [300, 400] },
  { d: "M380 380 A40 40 0 0 1 420 420", c: [380, 400] },
  { d: "M600 150 A40 40 0 0 1 640 190", c: [600, 170] },
];

const WINDOWS: Seg[] = [
  [150, 40, 250, 40],
  [430, 40, 530, 40],
  [640, 40, 700, 40],
  [120, 480, 220, 480],
  [480, 480, 600, 480],
  [740, 300, 740, 380],
  [60, 360, 60, 440],
];

const ROOMS = [
  { label: "LIVING", x: 60, y: 40, w: 320, h: 260 },
  { label: "KITCHEN", x: 380, y: 40, w: 220, h: 180 },
  { label: "BATH", x: 600, y: 40, w: 140, h: 180 },
  { label: "BED 01", x: 60, y: 300, w: 240, h: 180 },
  { label: "HALL", x: 300, y: 300, w: 80, h: 180 },
  { label: "BED 02", x: 380, y: 220, w: 360, h: 260 },
];

/**
 * A floorplan being read: walls are detected under a scan line, rooms are
 * identified, then doors and windows are tagged. Scrubbed by scroll.
 */
export default function PlanRecognition() {
  const ref = useRef<HTMLDivElement>(null);
  const counts = useRef<Record<string, HTMLElement | null>>({});

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const walls = el.querySelectorAll<SVGLineElement>("[data-wall]");
      const scan = el.querySelector<SVGLineElement>("[data-scan]");
      const rooms = el.querySelectorAll<SVGGElement>("[data-room]");
      const tags = el.querySelectorAll<SVGGElement>("[data-tag]");
      const status = el.querySelector<HTMLElement>("[data-status]");

      const tl = gsap.timeline({ paused: true });
      // walls detected left → right
      const sorted = [...walls].sort((a, b) => Number(a.dataset.mx) - Number(b.dataset.mx));
      sorted.forEach((w, i) => {
        const len = Number(w.dataset.len);
        tl.fromTo(w, { strokeDashoffset: len, opacity: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: "none" }, 0.3 + (i / sorted.length) * 3.6);
      });
      if (scan) tl.fromTo(scan, { attr: { x1: 60, x2: 60 }, opacity: 1 }, { attr: { x1: 740, x2: 740 }, duration: 3.9, ease: "none" }, 0.3);
      if (scan) tl.to(scan, { opacity: 0, duration: 0.3 }, 4.2);
      rooms.forEach((r, i) => {
        tl.fromTo(r, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 4.4 + i * 0.35);
      });
      tags.forEach((t, i) => {
        tl.fromTo(t, { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, 6.8 + i * 0.16);
      });
      tl.to({}, { duration: 0.6 });

      const update = (p: number) => {
        const w = Math.round(range(p, 0.03, 0.42) * WALLS.length);
        const r = Math.round(range(p, 0.44, 0.65) * ROOMS.length);
        const d = Math.round(range(p, 0.68, 0.8) * DOORS.length);
        const wi = Math.round(range(p, 0.8, 0.92) * WINDOWS.length);
        const set = (k: string, v: number, total: number) => {
          const n = counts.current[k];
          if (n) n.textContent = `${String(v).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
        };
        set("walls", w, WALLS.length);
        set("rooms", r, ROOMS.length);
        set("doors", d, DOORS.length);
        set("windows", wi, WINDOWS.length);
        if (status) status.textContent = p < 0.03 ? "WAITING FOR INPUT" : p < 0.44 ? "DETECTING WALLS" : p < 0.68 ? "IDENTIFYING ROOMS" : p < 0.95 ? "TAGGING OPENINGS" : "SPATIAL MODEL READY";
      };

      if (reduced) {
        tl.progress(1);
        update(1);
        return () => tl.kill();
      }

      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 78%",
        end: "bottom 55%",
        scrub: 0.4,
        animation: tl,
        onUpdate: (self) => update(self.progress),
      });
      update(0);
      return () => {
        st.kill();
        tl.kill();
      };
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-[1fr_200px]">
      <div className="relative bg-bg-2/60 p-3 md:p-5">
        <svg viewBox="0 0 800 520" className="block w-full" role="img" aria-label="Floorplan being interpreted into walls, rooms, doors and windows">
          {/* raw drawing */}
          <g stroke={`${INK}0.28)`} fill="none">
            {WALLS.map((s, i) => (
              <line key={i} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} />
            ))}
            {DOORS.map((d, i) => (
              <path key={i} d={d.d} strokeDasharray="3 4" />
            ))}
            {WINDOWS.map((s, i) => {
              const vertical = s[0] === s[2];
              const o = 4;
              return (
                <g key={i}>
                  <line x1={s[0] + (vertical ? -o : 0)} y1={s[1] + (vertical ? 0 : -o)} x2={s[2] + (vertical ? -o : 0)} y2={s[3] + (vertical ? 0 : -o)} />
                  <line x1={s[0] + (vertical ? o : 0)} y1={s[1] + (vertical ? 0 : o)} x2={s[2] + (vertical ? o : 0)} y2={s[3] + (vertical ? 0 : o)} />
                </g>
              );
            })}
          </g>

          {/* rooms */}
          {ROOMS.map((r) => (
            <g key={r.label} data-room opacity="0">
              <rect x={r.x + 4} y={r.y + 4} width={r.w - 8} height={r.h - 8} fill="rgb(var(--accent-rgb) / 0.05)" stroke={ACC} strokeOpacity="0.25" strokeDasharray="3 5" />
              <text x={r.x + 14} y={r.y + 24} fontSize="10" letterSpacing="1.5" className="font-mono" fill={ACC}>
                {r.label}
              </text>
            </g>
          ))}

          {/* detected walls */}
          <g stroke={ACC} strokeWidth="2.5" strokeLinecap="square" fill="none">
            {WALLS.map((s, i) => {
              const len = Math.hypot(s[2] - s[0], s[3] - s[1]);
              return (
                <line
                  key={i}
                  data-wall
                  data-len={len}
                  data-mx={(s[0] + s[2]) / 2}
                  x1={s[0]}
                  y1={s[1]}
                  x2={s[2]}
                  y2={s[3]}
                  strokeDasharray={len}
                  strokeDashoffset={len}
                />
              );
            })}
          </g>

          {/* opening tags */}
          {DOORS.map((d, i) => (
            <g key={`d${i}`} data-tag opacity="0">
              <circle cx={d.c[0]} cy={d.c[1]} r="10" fill="var(--bg)" stroke={ACC} />
              <text x={d.c[0]} y={d.c[1] + 3.5} textAnchor="middle" fontSize="9" className="font-mono" fill={ACC}>
                D
              </text>
            </g>
          ))}
          {WINDOWS.map((s, i) => (
            <g key={`w${i}`} data-tag opacity="0">
              <circle cx={(s[0] + s[2]) / 2} cy={(s[1] + s[3]) / 2} r="10" fill="var(--bg)" stroke={`${INK}0.8)`} />
              <text x={(s[0] + s[2]) / 2} y={(s[1] + s[3]) / 2 + 3.5} textAnchor="middle" fontSize="9" className="font-mono" fill="var(--ink)">
                W
              </text>
            </g>
          ))}

          {/* scan line */}
          <line data-scan x1="60" y1="20" x2="60" y2="500" stroke={ACC} strokeWidth="1" opacity="0" />
        </svg>
      </div>

      <div className="flex flex-col bg-bg p-5">
        <p className="t-eyebrow !text-ink">Spatial understanding</p>
        <dl className="mt-5 space-y-4">
          {[
            ["walls", "Walls"],
            ["rooms", "Rooms"],
            ["doors", "Doors"],
            ["windows", "Windows"],
          ].map(([k, label]) => (
            <div key={k} className="flex items-baseline justify-between border-b border-line pb-2">
              <dt className="t-eyebrow">{label}</dt>
              <dd
                ref={(n) => {
                  counts.current[k] = n;
                }}
                className="t-mono text-ink"
              >
                00 / 00
              </dd>
            </div>
          ))}
        </dl>
        <p data-status className="t-eyebrow mt-auto pt-8 !text-accent">
          WAITING FOR INPUT
        </p>
      </div>
    </div>
  );
}
