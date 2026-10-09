"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useInView, useIsTouch, useReducedMotion } from "@/lib/hooks";
import { site } from "@/content/site";
import { LineReveal, Fade } from "@/components/ui/TextReveal";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

/**
 * Opening: a procedural architectural wireframe in darkness. The cursor makes
 * geometry solid where it passes; scrolling "prints" the structure solid from
 * the ground up while the statement typography expands from compressed to
 * natural width. Digital architecture becoming real.
 */
export default function HeroExperience() {
  const ref = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const inView = useInView(ref, "20% 0px");
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);

  useGSAP(
    () => {
      const el = ref.current;
      const text = textRef.current;
      if (!el || !text) return;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom top",
          scrub: true,
          onUpdate: (self) => {
            progressRef.current = self.progress;
          },
        },
      });
      tl.to(text, { yPercent: -18, opacity: 0, ease: "none" }, 0);
    },
    { scope: ref },
  );

  return (
    <section
      id="top"
      ref={ref}
      className="relative h-[100svh] min-h-[640px] overflow-hidden"
      aria-label="Introduction"
    >
      {/* 3D architecture */}
      <div
        className="absolute inset-0 transition-opacity duration-[1400ms] ease-out"
        style={{ opacity: ready ? 1 : 0 }}
        aria-hidden="true"
      >
        <HeroScene
          progressRef={progressRef}
          active={inView}
          isTouch={isTouch}
          reduced={reduced}
          onReady={() => setReady(true)}
        />
      </div>

      {/* contrast gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-bg via-bg/55 to-transparent"
        aria-hidden="true"
      />

      {/* typography */}
      <div
        ref={textRef}
        className="px-gutter pointer-events-none relative z-10 flex h-full flex-col justify-end pb-[clamp(1.5rem,5vh,3.5rem)] pt-[var(--nav-h)]"
      >
        <div className="grid-12 items-end gap-y-8">
          <div className="col-span-12 lg:col-span-9">
            <Fade delay={0.2} y={10}>
              <p className="t-eyebrow mb-5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="!text-ink">Software Engineer</span>
                <span className="h-px w-5 bg-accent" aria-hidden="true" />
                <span className="!text-ink">Technical Architect</span>
                <span className="hidden sm:inline">/</span>
                <span className="hidden sm:inline">Spatial · Real-time 3D · AR/VR · Products</span>
              </p>
            </Fade>
            <h1>
              <LineReveal
                trigger="mount"
                widthAxis
                delay={0.35}
                stagger={0.12}
                className="t-display t-hero"
                ariaLabel="I build worlds between digital and physical."
                lines={[
                  "I build worlds",
                  <>
                    between <span className="t-outline">digital</span>
                  </>,
                  "and physical.",
                ]}
              />
            </h1>
          </div>
          <div className="col-span-12 lg:col-span-3 lg:pb-2">
            <Fade delay={0.9} y={16}>
              <p className="t-body max-w-[36ch]">{site.intro}</p>
            </Fade>
          </div>
        </div>

        <Fade delay={1.1} y={0} className="mt-8 flex items-end justify-between border-t border-line pt-4 sm:mt-12">
          <span className="t-eyebrow !text-ink-3">
            {site.location.lat} / {site.location.lng}
          </span>
          <span className="t-eyebrow flex items-center gap-3">
            Scroll
            <span className="relative block h-7 w-px overflow-hidden bg-ink/25" aria-hidden="true">
              <span className="absolute inset-x-0 top-0 h-1/2 bg-accent [animation:scan_1.8s_ease-in-out_infinite]" />
            </span>
          </span>
          <span className="t-eyebrow hidden !text-ink-3 md:block">Digital architecture, becoming real</span>
        </Fade>
      </div>
    </section>
  );
}
