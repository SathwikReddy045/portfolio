"use client";

import { useEffect, useRef } from "react";
import { site, isPlaceholder } from "@/content/site";
import { Eyebrow } from "@/components/ui/Section";
import { Fade } from "@/components/ui/TextReveal";
import Magnetic from "@/components/ui/Magnetic";

const LINES = ["Have something", "impossible", "in mind?"];

/**
 * Closing call. The headline is set in a variable font: letters near the
 * cursor widen and gain weight, so the typography physically responds.
 */
export default function Contact() {
  const ref = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const section = ref.current;
    const head = headRef.current;
    if (!section || !head) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const chars = Array.from(head.querySelectorAll<HTMLElement>("[data-char]"));
    const state = chars.map(() => ({ w: 100, g: 600, tw: 100, tg: 600 }));
    let rects: { x: number; y: number }[] = [];
    let raf = 0;
    let running = false;
    let mouse = { x: -9999, y: -9999 };
    let settle = 0;

    const measure = () => {
      rects = chars.map((c) => {
        const r = c.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    };

    const loop = () => {
      let active = false;
      const radius = Math.max(140, window.innerWidth * 0.11);
      for (let i = 0; i < chars.length; i++) {
        const s = state[i];
        const r = rects[i];
        const d = r ? Math.hypot(mouse.x - r.x, mouse.y - r.y) : Infinity;
        const inf = Math.max(0, 1 - d / radius);
        const e = inf * inf * (3 - 2 * inf);
        s.tw = 100 + 25 * e;
        s.tg = 600 + 250 * e;
        s.w += (s.tw - s.w) * 0.16;
        s.g += (s.tg - s.g) * 0.16;
        if (Math.abs(s.tw - s.w) > 0.05 || Math.abs(s.tg - s.g) > 0.5) active = true;
        chars[i].style.fontVariationSettings = `"wdth" ${s.w.toFixed(2)}, "wght" ${s.g.toFixed(1)}`;
      }
      if (active || settle > 0) {
        settle -= 1;
        raf = requestAnimationFrame(loop);
      } else {
        running = false;
      }
    };
    const start = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };
    const onMove = (e: MouseEvent) => {
      mouse = { x: e.clientX, y: e.clientY };
      settle = 10;
      start();
    };
    const onLeave = () => {
      mouse = { x: -9999, y: -9999 };
      settle = 60;
      start();
    };
    const onScroll = () => {
      measure();
      settle = 10;
      start();
    };

    measure();
    section.addEventListener("mousemove", onMove, { passive: true });
    section.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.fonts?.ready.then(measure);
    return () => {
      cancelAnimationFrame(raf);
      section.removeEventListener("mousemove", onMove);
      section.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const links = [
    { key: "email" as const, label: "Email", hint: "Direct is best" },
    { key: "github" as const, label: "GitHub", hint: "Code and experiments" },
  ];

  return (
    <section id="contact" ref={ref} className="px-gutter relative overflow-hidden pb-[8vh] pt-[14vh]">
      <Eyebrow>Contact</Eyebrow>
      <h2 ref={headRef} className="t-display t-hero mt-8" aria-label="Have something impossible in mind?">
        {LINES.map((line, li) => (
          <span key={li} className="block" aria-hidden="true">
            {Array.from(line).map((ch, ci) => (
              <span key={ci} data-char className={`inline-block ${ch === " " ? "w-[0.28em]" : ""} ${li === 1 ? "text-accent" : ""}`}>
                {ch === " " ? "" : ch}
              </span>
            ))}
          </span>
        ))}
      </h2>
      <Fade delay={0.2}>
        <p className="t-body-lg mt-8 text-ink">Let’s build it.</p>
      </Fade>

      <ul className="mt-[7vh] border-t border-line">
        {links.map((l, i) => {
          const value = site.links[l.key];
          const placeholder = isPlaceholder(value);
          const href = placeholder ? "#contact" : l.key === "email" ? `mailto:${value}` : value;
          return (
            <li key={l.key}>
              <a
                href={href}
                target={placeholder || l.key === "email" ? undefined : "_blank"}
                rel={placeholder ? undefined : "noreferrer"}
                data-cursor="open"
                onClick={placeholder ? (e) => e.preventDefault() : undefined}
                className="group grid-12 items-baseline gap-y-1 border-b border-line py-7 md:py-9"
              >
                <span className="t-mono col-span-2 text-ink-3 transition-colors group-hover:text-accent md:col-span-1">0{i + 1}</span>
                <span className="col-span-10 md:col-span-6">
                  <Magnetic strength={0.12}>
                    <span className="t-display t-lg inline-block transition-transform duration-700 ease-[var(--ease-expo)] group-hover:translate-x-3">{l.label}</span>
                  </Magnetic>
                </span>
                <span className="t-mono col-span-12 text-ink-3 md:col-span-5 md:text-right">
                  {placeholder ? <span className="opacity-70">{value} — add in content/site.ts</span> : value.replace(/^https?:\/\//, "")}
                  <span className="ml-3 inline-block transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true">
                    →
                  </span>
                </span>
                <span className="t-eyebrow col-span-10 col-start-3 md:col-span-6 md:col-start-2">{l.hint}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
