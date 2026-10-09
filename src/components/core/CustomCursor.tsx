"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useCursorStore, type CursorVariant } from "@/lib/store";
import { themeColors, accentRgba, inkRgba } from "@/lib/theme";

/**
 * Contextual labels. Add `data-cursor="explore"` (etc.) to any element.
 * Plain links and buttons get the enlarged ring automatically.
 */
const LABELS: Record<string, string> = {
  explore: "EXPLORE →",
  case: "VIEW CASE STUDY",
  drag: "DRAG",
  orbit: "ORBIT",
  play: "PLAY",
  tap: "TAP",
  open: "OPEN",
  scroll: "SCROLL",
};

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    document.documentElement.classList.add("has-cursor");

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 0 });

    const xDot = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3" });
    const yDot = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3" });
    const xRing = gsap.quickTo(ring, "x", { duration: 0.4, ease: "power3" });
    const yRing = gsap.quickTo(ring, "y", { duration: 0.4, ease: "power3" });

    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      gsap.to([dot, ring], { opacity: 1, duration: 0.4, overwrite: "auto" });
    };
    const hide = () => {
      shown = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.3, overwrite: "auto" });
    };

    const onMove = (e: MouseEvent) => {
      xDot(e.clientX);
      yDot(e.clientY);
      xRing(e.clientX);
      yRing(e.clientY);
      show();
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>("[data-cursor], a, button, [role=button]");
      const store = useCursorStore.getState();
      if (!el) {
        store.reset();
        return;
      }
      const key = el.dataset.cursor;
      if (key === "hidden") store.set("hidden");
      else if (key && LABELS[key]) store.set("label", LABELS[key]);
      else if (key === "none") store.reset();
      else store.set("link");
    };

    const apply = (variant: CursorVariant, text: string) => {
      const ease = "power3.out";
      const accent = themeColors().accent;
      if (variant === "label") {
        label.textContent = text;
        const w = label.offsetWidth + 30;
        gsap.to(ring, {
          width: w,
          height: 34,
          backgroundColor: accent,
          borderColor: accent,
          scale: 1,
          opacity: shown ? 1 : 0,
          duration: 0.35,
          ease,
          overwrite: "auto",
        });
        gsap.to(label, { opacity: 1, duration: 0.25, delay: 0.08, overwrite: "auto" });
        gsap.to(dot, { scale: 0, duration: 0.25, overwrite: "auto" });
        return;
      }
      gsap.to(label, { opacity: 0, duration: 0.15, overwrite: "auto" });
      if (variant === "hidden") {
        gsap.to([ring, dot], { opacity: 0, duration: 0.25, overwrite: "auto" });
        return;
      }
      gsap.to(ring, {
        width: 36,
        height: 36,
        backgroundColor: accentRgba(0),
        borderColor: variant === "link" ? inkRgba(0.9) : inkRgba(0.45),
        scale: variant === "link" ? 1.55 : 1,
        opacity: shown ? 1 : 0,
        duration: 0.35,
        ease,
        overwrite: "auto",
      });
      gsap.to(dot, { scale: variant === "link" ? 0.5 : 1, opacity: shown ? 1 : 0, duration: 0.25, overwrite: "auto" });
    };

    const unsub = useCursorStore.subscribe((s) => apply(s.variant, s.label));

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver);
    document.documentElement.addEventListener("mouseleave", hide);
    document.documentElement.addEventListener("mouseenter", show);

    return () => {
      unsub();
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", hide);
      document.documentElement.removeEventListener("mouseenter", show);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9999] hidden [@media(hover:hover)_and_(pointer:fine)]:block">
      <div
        ref={ringRef}
        className="fixed left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border will-change-transform"
        style={{ borderColor: "rgb(var(--ink-rgb) / 0.45)" }}
      >
        <span
          ref={labelRef}
          className="t-eyebrow whitespace-nowrap opacity-0"
          style={{ color: "var(--bg)", letterSpacing: "0.12em", fontSize: "0.625rem" }}
        />
      </div>
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-ink mix-blend-difference will-change-transform"
      />
    </div>
  );
}
