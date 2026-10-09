"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { techNodes, projectNodes, techEdges } from "@/content/technologies";
import { useInView } from "@/lib/hooks";
import { Eyebrow } from "@/components/ui/Section";
import { Fade } from "@/components/ui/TextReveal";

const VW = 1000;
const VH = 600;
const ACC = "var(--accent)";

/**
 * Interactive technology constellation. Hovering a technology reveals the
 * projects where it was used; hovering a project reveals its technologies.
 */
export default function TechnologyConstellation() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, "0px");
  const [active, setActive] = useState<string | null>(null);
  const nodeEls = useRef(new Map<string, SVGGElement>());
  const edgeEls = useRef<{ a: string; b: string; el: SVGLineElement }[]>([]);

  const base = useMemo(() => {
    const m = new Map<string, { x: number; y: number; phase: number }>();
    techNodes.forEach((n, i) => m.set(n.id, { x: n.x * VW, y: n.y * VH, phase: i * 1.37 }));
    projectNodes.forEach((n, i) => m.set(n.id, { x: n.x * VW, y: n.y * VH, phase: i * 2.11 + 0.5 }));
    return m;
  }, []);

  const usage = useMemo(() => techNodes.flatMap((n) => n.usedIn.map((p) => ({ a: n.id, b: p }))), []);

  // Gentle drift so the constellation feels alive (only while visible).
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const pos = new Map<string, { x: number; y: number }>();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      base.forEach((b, id) => {
        pos.set(id, { x: b.x + Math.sin(t * 0.33 + b.phase) * 7, y: b.y + Math.cos(t * 0.27 + b.phase * 1.7) * 6 });
      });
      nodeEls.current.forEach((el, id) => {
        const p = pos.get(id);
        if (p) el.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
      });
      for (const e of edgeEls.current) {
        const a = pos.get(e.a);
        const b = pos.get(e.b);
        if (!a || !b) continue;
        e.el.setAttribute("x1", a.x.toFixed(2));
        e.el.setAttribute("y1", a.y.toFixed(2));
        e.el.setAttribute("x2", b.x.toFixed(2));
        e.el.setAttribute("y2", b.y.toFixed(2));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, base]);

  const hl = useMemo(() => {
    if (!active) return null;
    const tech = techNodes.find((n) => n.id === active);
    if (tech) {
      const related = techEdges.filter((e) => e.includes(active)).flat();
      return { nodes: new Set([active, ...tech.usedIn, ...related]), projects: new Set(tech.usedIn), kind: "tech" as const };
    }
    const techs = techNodes.filter((n) => n.usedIn.includes(active)).map((n) => n.id);
    return { nodes: new Set([active, ...techs]), projects: new Set([active]), kind: "project" as const };
  }, [active]);

  const activeTech = techNodes.find((n) => n.id === active);
  const activeProject = projectNodes.find((n) => n.id === active);
  const projectLabel = (id: string) => projectNodes.find((p) => p.id === id);

  return (
    <section ref={ref} className="px-gutter relative border-t border-line py-[10vh]">
      <div className="grid-12 gap-y-8">
        <div className="col-span-12 lg:col-span-4">
          <Eyebrow>Technology</Eyebrow>
          <h2 className="t-display t-lg mt-6">A constellation, not a list.</h2>
          <p className="t-body mt-5 max-w-[36ch]">Technologies relate to each other and to the work. Hover a node to see where it was used.</p>

          {/* readout */}
          <div className="mt-10 min-h-[9rem] border-t border-line pt-5" aria-live="polite">
            {activeTech ? (
              <>
                <p className="t-eyebrow !text-accent">{activeTech.label}</p>
                <p className="t-eyebrow mt-4">Used in</p>
                <ul className="mt-2 space-y-1">
                  {activeTech.usedIn.map((p) => {
                    const pr = projectLabel(p);
                    return (
                      <li key={p} className="t-display t-sm flex items-baseline gap-3">
                        <span className="t-mono text-ink-3">{pr?.number}</span>
                        {pr?.label}
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : activeProject ? (
              <>
                <p className="t-eyebrow !text-accent">
                  {activeProject.number} / {activeProject.label}
                </p>
                <p className="t-eyebrow mt-4">Built with</p>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {techNodes
                    .filter((n) => n.usedIn.includes(activeProject.id))
                    .map((n) => (
                      <li key={n.id} className="t-display t-sm">
                        {n.label}
                      </li>
                    ))}
                </ul>
              </>
            ) : (
              <p className="t-eyebrow !text-ink-3">Hover a technology or a project.</p>
            )}
          </div>
        </div>

        <Fade className="col-span-12 lg:col-span-8">
          <svg viewBox={`0 0 ${VW} ${VH}`} className="hidden w-full md:block" role="img" aria-label="Constellation of technologies connected to the projects that used them">
            {/* usage edges */}
            {usage.map((u) => {
              const on = hl?.kind === "tech" ? u.a === active : hl?.kind === "project" ? u.b === active : false;
              return (
                <line
                  key={`${u.a}-${u.b}`}
                  ref={(el) => {
                    if (el) edgeEls.current.push({ a: u.a, b: u.b, el });
                  }}
                  x1={base.get(u.a)!.x}
                  y1={base.get(u.a)!.y}
                  x2={base.get(u.b)!.x}
                  y2={base.get(u.b)!.y}
                  stroke={ACC}
                  strokeDasharray="2 6"
                  style={{ opacity: on ? 0.75 : hl ? 0.03 : 0.08, transition: "opacity .4s" }}
                />
              );
            })}
            {/* constellation edges */}
            {techEdges.map(([a, b]) => {
              const on = hl ? hl.nodes.has(a) && hl.nodes.has(b) && (a === active || b === active) : false;
              return (
                <line
                  key={`${a}-${b}`}
                  ref={(el) => {
                    if (el) edgeEls.current.push({ a, b, el });
                  }}
                  x1={base.get(a)!.x}
                  y1={base.get(a)!.y}
                  x2={base.get(b)!.x}
                  y2={base.get(b)!.y}
                  stroke={on ? ACC : "var(--ink)"}
                  style={{ opacity: on ? 0.8 : hl ? 0.06 : 0.18, transition: "opacity .4s, stroke .4s" }}
                />
              );
            })}

            {/* tech nodes */}
            {techNodes.map((n) => {
              const on = hl ? hl.nodes.has(n.id) : true;
              const isActive = n.id === active;
              const r = 4 * (n.size ?? 1);
              return (
                <g
                  key={n.id}
                  ref={(el) => {
                    if (el) nodeEls.current.set(n.id, el);
                  }}
                  transform={`translate(${base.get(n.id)!.x} ${base.get(n.id)!.y})`}
                  onMouseEnter={() => setActive(n.id)}
                  onMouseLeave={() => setActive(null)}
                  style={{ opacity: on ? 1 : 0.28, transition: "opacity .4s" }}
                  data-cursor="none"
                >
                  <circle r="26" fill="transparent" />
                  <circle r={r * 2.6} fill="none" stroke={ACC} style={{ opacity: isActive ? 0.7 : 0, transition: "opacity .3s" }} />
                  <circle r={r} fill={isActive || (hl && hl.nodes.has(n.id) && hl.kind === "project") ? ACC : "var(--ink)"} style={{ transition: "fill .3s" }} />
                  <text x={r + 10} y="4" fontSize="11" letterSpacing="1.6" className="font-mono" fill={isActive ? ACC : "rgb(var(--ink-rgb) / 0.8)"}>
                    {n.label.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* project nodes */}
            {projectNodes.map((p) => {
              const on = hl ? hl.projects.has(p.id) : true;
              return (
                <g
                  key={p.id}
                  ref={(el) => {
                    if (el) nodeEls.current.set(p.id, el);
                  }}
                  transform={`translate(${base.get(p.id)!.x} ${base.get(p.id)!.y})`}
                  onMouseEnter={() => setActive(p.id)}
                  onMouseLeave={() => setActive(null)}
                  style={{ opacity: on ? 1 : 0.3, transition: "opacity .4s" }}
                  data-cursor="none"
                >
                  <circle r="30" fill="transparent" />
                  <circle r="17" fill="var(--bg)" stroke={on && hl ? ACC : "rgb(var(--ink-rgb) / 0.55)"} style={{ transition: "stroke .3s" }} />
                  <text y="3.5" textAnchor="middle" fontSize="9" letterSpacing="1" className="font-mono" fill={on && hl ? ACC : "var(--ink)"}>
                    {p.number}
                  </text>
                  <text y="34" textAnchor="middle" fontSize="10" letterSpacing="1.4" className="font-mono" fill="rgb(var(--ink-rgb) / 0.75)">
                    {p.label.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* small screens: tappable chips */}
          <ul className="flex flex-wrap gap-2 md:hidden">
            {techNodes.map((n) => {
              const isActive = n.id === active;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => setActive(isActive ? null : n.id)}
                    className={`t-eyebrow border px-3 py-2 transition-colors ${isActive ? "border-accent !text-accent" : "border-line !text-ink"}`}
                    aria-pressed={isActive}
                  >
                    {n.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </Fade>
      </div>
    </section>
  );
}
