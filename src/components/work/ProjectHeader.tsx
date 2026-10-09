"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Project } from "@/content/projects";
import { CharReveal, LineReveal, Fade } from "@/components/ui/TextReveal";
import Media from "@/components/ui/Media";

export type Treatment = "beam" | "blueprint" | "reticle";

/**
 * Editorial opening for each case study. Each project gets its own backdrop
 * treatment (projector light, blueprint grid, AR reticle) while sharing the
 * same typographic system.
 */
export default function ProjectHeader({ project, treatment }: { project: Project; treatment: Treatment }) {
  const ref = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      const num = numRef.current;
      if (!el || !num) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      gsap.fromTo(
        num,
        { yPercent: 12, scale: 1.06, opacity: 0 },
        { yPercent: -18, scale: 0.94, opacity: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 90%", end: "bottom top", scrub: true } },
      );
      const brackets = el.querySelectorAll<HTMLElement>("[data-bracket]");
      if (brackets.length) {
        gsap.fromTo(
          brackets,
          { scale: 0.6, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.2, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 60%", once: true } },
        );
      }
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="relative">
      <header className="px-gutter relative flex min-h-[100svh] flex-col overflow-hidden pb-12 pt-[calc(var(--nav-h)+4vh)]">
        {/* Backdrop treatments */}
        {treatment === "beam" && (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div
              className="absolute -left-[10%] -top-[20%] h-[120%] w-[90%]"
              style={{ background: "conic-gradient(from 118deg at 0% 0%, rgb(var(--accent-rgb) / 0.13), rgb(var(--accent-rgb) / 0.03) 18%, transparent 30%)" }}
            />
            <div className="absolute inset-x-0 bottom-0 h-px bg-line" />
          </div>
        )}
        {treatment === "blueprint" && (
          <div
            className="blueprint pointer-events-none absolute inset-0 opacity-80"
            style={{ maskImage: "radial-gradient(70% 70% at 75% 35%, #000 20%, transparent 100%)", WebkitMaskImage: "radial-gradient(70% 70% at 75% 35%, #000 20%, transparent 100%)" }}
            aria-hidden="true"
          />
        )}
        {treatment === "reticle" && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div
              className="absolute inset-x-[-30%] bottom-[-10%] h-[60%] opacity-70"
              style={{
                backgroundImage:
                  "linear-gradient(rgb(var(--ink-rgb) / 0.07) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--ink-rgb) / 0.07) 1px, transparent 1px)",
                backgroundSize: "80px 80px",
                transform: "perspective(700px) rotateX(62deg)",
                transformOrigin: "50% 100%",
                maskImage: "linear-gradient(to top, #000 10%, transparent 90%)",
                WebkitMaskImage: "linear-gradient(to top, #000 10%, transparent 90%)",
              }}
            />
          </div>
        )}

        {/* Giant number */}
        <span
          ref={numRef}
          className="t-display t-num t-outline pointer-events-none absolute right-[var(--gutter)] top-[calc(var(--nav-h)+6vh)] select-none leading-none text-[clamp(8rem,25vw,25rem)] opacity-0"
          aria-hidden="true"
        >
          {project.number}
        </span>

        <div className="relative flex items-center gap-4">
          <span className="t-eyebrow !text-accent">{project.number}</span>
          <span className="h-px w-10 bg-line" aria-hidden="true" />
          <span className="t-eyebrow">{project.language}</span>
        </div>

        <div className="relative mt-auto pt-[12vh]">
          <div className="relative inline-block">
            {treatment === "reticle" &&
              ["-left-4 -top-4 border-l border-t", "-right-4 -top-4 border-r border-t", "-left-4 -bottom-3 border-l border-b", "-right-4 -bottom-3 border-r border-b"].map((c) => (
                <span key={c} data-bracket className={`absolute h-5 w-5 border-accent ${c}`} aria-hidden="true" />
              ))}
            <h2 className="t-display t-xl">
              <CharReveal text={project.title.toUpperCase()} start="top 90%" />
            </h2>
          </div>
          <LineReveal
            as="p"
            className="t-display t-md mt-5 max-w-[26ch] !text-ink-2"
            lines={[project.subtitle.toUpperCase()]}
            start="top 92%"
          />

          <div className="grid-12 mt-[7vh] gap-y-8 border-t border-line pt-7">
            <div className="col-span-12 lg:col-span-6">
              {project.description.map((p, i) => (
                <Fade key={i} delay={i * 0.1}>
                  <p className={`t-body-lg max-w-[52ch] ${i > 0 ? "mt-5 text-ink-2" : "text-ink"}`}>{p}</p>
                </Fade>
              ))}
            </div>
            <dl className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-6 lg:col-span-5 lg:col-start-8">
              {project.meta.map((m, i) => (
                <Fade key={m.label} delay={0.1 + i * 0.07} y={14}>
                  <dt className="t-eyebrow">{m.label}</dt>
                  <dd className="t-mono mt-2 text-ink">{m.value}</dd>
                </Fade>
              ))}
            </dl>
          </div>
        </div>
      </header>

      <div className="px-gutter">
        <Media id={project.heroMedia} className="w-full" parallax={5} />
      </div>
    </div>
  );
}
