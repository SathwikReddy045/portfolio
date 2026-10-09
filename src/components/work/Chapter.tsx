"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Chapter as ChapterT, ChapterVisual } from "@/content/projects";
import { Eyebrow } from "@/components/ui/Section";
import { Fade, LineReveal } from "@/components/ui/TextReveal";
import Media from "@/components/ui/Media";
import { getMedia } from "@/content/media";
import Compare from "@/components/ui/Compare";
import LiveEditingDiagram from "./dreamspacehub/LiveEditingDiagram";
import PlanRecognition from "./dreamhometech/PlanRecognition";
import BuyerWorkflow from "./dreamhometech/BuyerWorkflow";

/** One numbered case-study chapter. Layout varies so the page never repeats. */
export default function Chapter({ chapter }: { chapter: ChapterT }) {
  const layout = chapter.layout ?? "text-left";

  const text = (
    <div>
      <Eyebrow>
        {chapter.index} — {chapter.label}
      </Eyebrow>
      <h3 className="mt-6">
        <LineReveal className="t-display t-md" lines={[chapter.heading]} />
      </h3>
      {chapter.body.map((p, i) => (
        <Fade key={i} delay={0.1 + i * 0.08}>
          <p className="t-body mt-5 max-w-[50ch]">{p}</p>
        </Fade>
      ))}
    </div>
  );

  const visual = <Visual visual={chapter.visual} />;

  if (layout === "statement") {
    return (
      <section className="relative py-[8vh]">
        <div className="px-gutter mx-auto max-w-[70rem] text-center">
          <Eyebrow className="justify-center">
            {chapter.index} — {chapter.label}
          </Eyebrow>
          <h3 className="mt-8">
            <LineReveal className="t-display t-lg" lines={[chapter.heading]} />
          </h3>
          {chapter.body.map((p, i) => (
            <Fade key={i} delay={0.15}>
              <p className="t-body-lg mx-auto mt-7 max-w-[46ch] text-ink-2">{p}</p>
            </Fade>
          ))}
        </div>
        {chapter.visual.type !== "none" && <div className="mt-[5vh]">{visual}</div>}
      </section>
    );
  }

  if (layout === "full") {
    return (
      <section className="px-gutter relative py-[7vh]">
        <div className="grid-12 gap-y-8">
          <div className="col-span-12 lg:col-span-5">
            <Eyebrow>
              {chapter.index} — {chapter.label}
            </Eyebrow>
            <h3 className="mt-6">
              <LineReveal className="t-display t-md" lines={[chapter.heading]} />
            </h3>
          </div>
          <div className="col-span-12 lg:col-span-5 lg:col-start-8 lg:pt-10">
            {chapter.body.map((p, i) => (
              <Fade key={i} delay={0.1 + i * 0.08}>
                <p className={`t-body max-w-[50ch] ${i > 0 ? "mt-5" : ""}`}>{p}</p>
              </Fade>
            ))}
          </div>
        </div>
        <div className="mt-[5vh]">{visual}</div>
      </section>
    );
  }

  const textFirst = layout === "text-left";
  return (
    <section className="px-gutter relative py-[7vh]">
      <div className="grid-12 items-center gap-y-10">
        <div className={`col-span-12 lg:col-span-5 ${textFirst ? "" : "lg:col-start-8 lg:order-2"}`}>{text}</div>
        <div className={`col-span-12 lg:col-span-6 ${textFirst ? "lg:col-start-7" : "lg:order-1"}`}>{visual}</div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Visual({ visual }: { visual: ChapterVisual }) {
  switch (visual.type) {
    case "media": {
      const portrait = getMedia(visual.id).ratio.trim().startsWith("9");
      return <Media id={visual.id} parallax={4} className={portrait ? "mx-auto w-full max-w-[340px]" : ""} />;
    }
    case "compare":
      return <Compare before={visual.before} after={visual.after} labels={visual.labels} />;
    case "live-editing":
      return <LiveEditingDiagram />;
    case "plan-recognition":
      return <PlanRecognition />;
    case "buyer-workflow":
      return <BuyerWorkflow />;
    case "system-layers":
      return <SystemLayers layers={visual.layers} />;
    case "vr-frame":
      return <VRFrame id={visual.id} />;
    case "options":
      return <OptionsGrid items={visual.items} />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */

function SystemLayers({ layers }: { layers: { label: string; detail: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const rows = el.querySelectorAll<HTMLElement>("[data-layer]");
      const rail = el.querySelector<HTMLElement>("[data-rail]");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      gsap.fromTo(
        rows,
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.9, stagger: 0.14, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 80%", once: true } },
      );
      if (rail) {
        gsap.fromTo(
          rail,
          { scaleY: 0 },
          { scaleY: 1, duration: 1.4, ease: "expo.inOut", transformOrigin: "top", scrollTrigger: { trigger: el, start: "top 80%", once: true } },
        );
      }
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="relative border border-line bg-bg-2/60 p-6 md:p-8">
      <span className="t-eyebrow absolute right-6 top-6 !text-ink-3">System layers</span>
      <div className="relative pl-8">
        <span data-rail className="absolute left-[7px] top-3 h-[calc(100%-1.5rem)] w-px bg-line" aria-hidden="true" />
        <span className="absolute left-[7px] top-3 h-[calc(100%-1.5rem)] w-px overflow-hidden" aria-hidden="true">
          <span className="block h-10 w-full bg-accent [animation:scan_3s_linear_infinite]" />
        </span>
        {layers.map((l, i) => (
          <div key={l.label} data-layer className="relative py-5 first:pt-1 last:pb-1">
            <span className="absolute -left-8 top-[1.55rem] h-[7px] w-[7px] -translate-x-[0px] border border-accent bg-bg first:top-[0.4rem]" style={i === 0 ? { top: "0.45rem" } : undefined} aria-hidden="true" />
            <div className="flex items-baseline gap-4">
              <span className="t-mono w-6 text-ink-3">0{i + 1}</span>
              <span className="t-display t-sm">{l.label}</span>
            </div>
            <p className="t-body mt-2 pl-10 !text-[0.95rem]">{l.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function VRFrame({ id }: { id: string }) {
  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-3">
        {(["L", "R"] as const).map((eye, i) => (
          <div key={eye} className="relative overflow-hidden rounded-[42%_42%_42%_42%/50%_50%_50%_50%] border border-line bg-bg-2">
            <div className="aspect-[1/1.05]">
              <div className="absolute inset-0" style={{ transform: `translateX(${i === 0 ? -2 : 2}%) scale(1.15)` }}>
                <Media id={id} ratio="auto" className="!absolute inset-0 h-full" reveal={false} cursor="play" />
              </div>
            </div>
            <span className="t-eyebrow absolute bottom-4 left-1/2 -translate-x-1/2 !text-ink/70">{eye}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="t-eyebrow">Stereo view</span>
        <span className="t-eyebrow !text-ink-3">Same design data, immersive output</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function OptionsGrid({ items }: { items: string[] }) {
  const ref = useRef<HTMLUListElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      gsap.fromTo(
        el.children,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } },
      );
    },
    { scope: ref },
  );
  return (
    <ul ref={ref} className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-2">
      {items.map((item, i) => (
        <li key={item} className="group flex items-baseline gap-3 bg-bg px-5 py-5 transition-colors hover:bg-bg-2">
          <span className="t-mono text-ink-3 transition-colors group-hover:text-accent">{String(i + 1).padStart(2, "0")}</span>
          <span className="t-display t-sm">{item}</span>
        </li>
      ))}
    </ul>
  );
}
