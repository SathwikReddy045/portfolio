"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { projects } from "@/content/projects";
import { scrollTo } from "@/lib/scroll";
import { Eyebrow } from "@/components/ui/Section";
import { Fade } from "@/components/ui/TextReveal";
import { Placeholder } from "@/components/ui/Media";
import { getMedia } from "@/content/media";

/**
 * Introduces the three projects. The oversized title travels horizontally
 * with scroll; the index rows widen on hover and spawn a floating preview.
 */
export default function SelectedWork() {
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      const track = trackRef.current;
      if (!el || !track) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      gsap.fromTo(
        track,
        { xPercent: 4 },
        { xPercent: -28, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
      );
      const rows = el.querySelectorAll<HTMLElement>("[data-row]");
      gsap.fromTo(
        rows,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: rows[0], start: "top 85%", once: true } },
      );
    },
    { scope: ref },
  );

  // Floating preview follows the cursor on fine pointers.
  useEffect(() => {
    const pv = previewRef.current;
    if (!pv) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const xTo = gsap.quickTo(pv, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(pv, "y", { duration: 0.5, ease: "power3" });
    const move = (e: MouseEvent) => {
      xTo(e.clientX + 24);
      yTo(e.clientY - pv.offsetHeight / 2);
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);

  useEffect(() => {
    const pv = previewRef.current;
    if (!pv) return;
    gsap.to(pv, { opacity: hover === null ? 0 : 1, scale: hover === null ? 0.92 : 1, duration: 0.4, ease: "power3.out", overwrite: true });
  }, [hover]);

  return (
    <section id="work" ref={ref} className="relative overflow-hidden pb-[10vh] pt-[12vh]">
      <div className="px-gutter">
        <Eyebrow>Selected work</Eyebrow>
      </div>

      <div ref={trackRef} className="mt-6 flex whitespace-nowrap will-change-transform" aria-hidden="true">
        <span className="t-display px-[var(--gutter)] text-[clamp(4.5rem,17vw,19rem)] leading-[0.9]">Selected work</span>
        <span className="t-display t-outline px-[var(--gutter)] text-[clamp(4.5rem,17vw,19rem)] leading-[0.9]">Selected work</span>
      </div>

      <div className="px-gutter mt-[6vh]">
        <Fade>
          <p className="t-body-lg max-w-[46ch] text-ink">
            Three systems where digital information moves into physical space, or physical space becomes an interface.
          </p>
        </Fade>

        <ol className="mt-10 border-t border-line">
          {projects.map((p, i) => (
            <li key={p.id} data-row className="opacity-0">
              <a
                href={`#${p.anchor}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(`#${p.anchor}`);
                }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                data-cursor="case"
                className="group grid-12 relative items-baseline gap-y-2 border-b border-line py-7 transition-colors md:py-9"
              >
                <span className="t-mono col-span-2 text-ink-3 transition-colors group-hover:text-accent md:col-span-1">{p.number}</span>
                <span
                  className="t-display t-lg col-span-10 transition-[font-variation-settings,transform] duration-700 ease-[var(--ease-expo)] group-hover:translate-x-3 md:col-span-7 md:group-hover:[font-variation-settings:'wdth'_112,'wght'_600]"
                >
                  {p.title}
                </span>
                <span className="t-eyebrow col-span-12 md:col-span-4 md:text-right">{p.language}</span>
                <span className="t-body col-span-12 mt-1 md:col-span-7 md:col-start-2">{p.subtitle}</span>
                <span className="t-eyebrow col-span-12 mt-2 flex items-center justify-end gap-2 !text-ink-3 transition-colors group-hover:!text-ink md:col-span-4 md:mt-0">
                  View case study <span aria-hidden="true">→</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>

      {/* floating preview */}
      <div
        ref={previewRef}
        className="pointer-events-none fixed left-0 top-0 z-[80] hidden w-[22vw] max-w-[360px] opacity-0 [@media(hover:hover)_and_(pointer:fine)]:block"
        aria-hidden="true"
      >
        <div className="aspect-[4/3] w-full overflow-hidden border border-line bg-bg-2">
          {hover !== null && <Placeholder slot={getMedia(projects[hover].heroMedia)} label={projects[hover].title.toUpperCase()} />}
        </div>
      </div>
    </section>
  );
}
