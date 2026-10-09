"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { capabilities } from "@/content/capabilities";
import { useMediaQuery } from "@/lib/hooks";
import { Eyebrow } from "@/components/ui/Section";
import { Fade } from "@/components/ui/TextReveal";

const PROJECT_NAMES: Record<string, string> = {
  "01": "DreamSpaceHub",
  "02": "DreamHomeTech",
  "03": "Visionary Control",
  "04": "This site",
};

/**
 * Capabilities as a visual system: a pinned horizontal track of ten
 * numbered modules on desktop, a vertical index on smaller screens.
 */
export default function Capabilities() {
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const horizontal = useMediaQuery("(min-width: 1024px)");

  useGSAP(
    () => {
      const el = ref.current;
      const track = trackRef.current;
      if (!el || !track || !horizontal) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      const distance = () => track.scrollWidth - window.innerWidth;
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: ref, dependencies: [horizontal] },
  );

  return (
    <section ref={ref} className="relative overflow-hidden border-t border-line bg-bg">
      <div className="px-gutter flex items-center justify-between pt-10 lg:absolute lg:inset-x-0 lg:top-[calc(var(--nav-h)+0.75rem)] lg:z-10 lg:pt-0">
        <Eyebrow>Capabilities</Eyebrow>
        <span className="t-eyebrow hidden lg:block">10 modules — scroll</span>
      </div>

      {horizontal ? (
        <div className="flex h-[100svh] items-end">
          <div ref={trackRef} className="flex will-change-transform">
            <div className="flex w-[34vw] shrink-0 flex-col justify-end px-[var(--gutter)] pb-20">
              <p className="t-display t-lg">What I bring to a problem.</p>
              <p className="t-body mt-5 max-w-[32ch]">Ten capabilities that tend to show up together on the kind of work I do. Engineering first.</p>
            </div>
            {capabilities.map((c) => (
              <article
                key={c.number}
                className="group relative flex h-[100svh] w-[min(36vw,540px)] shrink-0 flex-col justify-end border-l border-line px-8 pb-20 pt-32 transition-colors hover:bg-bg-2/60"
              >
                <span
                  className="t-display t-num t-outline absolute right-6 top-24 select-none text-[11rem] leading-none text-transparent transition-all duration-700 ease-[var(--ease-expo)] group-hover:[font-variation-settings:'wdth'_100,'wght'_500] group-hover:text-accent/15"
                  aria-hidden="true"
                >
                  {c.number}
                </span>
                <div className="flex h-[17rem] flex-col">
                  <span className="t-eyebrow !text-accent">{c.number}</span>
                  <h3 className="t-display t-md mt-4 min-h-[2.2em]">{c.title}</h3>
                  <p className="t-body mt-5 max-w-[30ch]">{c.detail}</p>
                  <ul className="mt-auto flex flex-wrap gap-2 pt-6">
                    {c.projects.map((p) => (
                      <li key={p} className="t-eyebrow border border-line px-2.5 py-1.5 !text-ink-2">
                        {p} / {PROJECT_NAMES[p]}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
            <div className="w-[var(--gutter)] shrink-0" />
          </div>
          <div className="absolute inset-x-[var(--gutter)] bottom-10 h-px bg-line">
            <div ref={barRef} className="h-full origin-left bg-accent" style={{ transform: "scaleX(0)" }} />
          </div>
        </div>
      ) : (
        <div className="px-gutter pb-16 pt-10">
          <p className="t-display t-lg">What I bring to a problem.</p>
          <ol className="mt-10 border-t border-line">
            {capabilities.map((c, i) => (
              <Fade as="li" key={c.number} delay={i * 0.04} className="grid grid-cols-12 gap-y-2 border-b border-line py-6">
                <span className="t-mono col-span-2 text-accent">{c.number}</span>
                <h3 className="t-display t-sm col-span-10">{c.title}</h3>
                <p className="t-body col-span-10 col-start-3 !text-[0.95rem]">{c.detail}</p>
                <p className="t-eyebrow col-span-10 col-start-3 mt-1">{c.projects.map((p) => PROJECT_NAMES[p]).join(" · ")}</p>
              </Fade>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
