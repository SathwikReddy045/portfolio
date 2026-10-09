"use client";

import { useCallback, useRef, useState } from "react";
import Media from "./Media";

/**
 * Before / after slider. Drag the divider (or use the keyboard) to compare
 * two media slots. Works with placeholders until real assets are supplied.
 */
export default function Compare({
  before,
  after,
  labels,
  ratio = "16 / 9",
  className = "",
}: {
  before: string;
  after: string;
  labels: [string, string];
  ratio?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(55);
  const dragging = useRef(false);

  const update = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = ((clientX - r.left) / r.width) * 100;
    setPos(Math.min(96, Math.max(4, p)));
  }, []);

  return (
    <div
      ref={ref}
      className={`relative select-none overflow-hidden bg-bg-2 ${className}`}
      style={{ aspectRatio: ratio, touchAction: "pan-y" }}
      data-cursor="drag"
      onPointerDown={(e) => {
        dragging.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        update(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && update(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <div className="absolute inset-0">
        <Media id={after} ratio="auto" className="!absolute inset-0 h-full" cursor="none" reveal={false} />
      </div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Media id={before} ratio="auto" className="!absolute inset-0 h-full" cursor="none" reveal={false} />
      </div>

      {/* divider */}
      <div className="pointer-events-none absolute inset-y-0 w-px bg-accent" style={{ left: `${pos}%` }}>
        <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-accent bg-bg/80 backdrop-blur-sm">
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true">
            <path d="M4 1L1 4l3 3M10 1l3 3-3 3" stroke="var(--accent)" strokeWidth="1" />
          </svg>
        </span>
      </div>

      <span className="t-eyebrow pointer-events-none absolute left-4 top-4 !text-ink">{labels[0]}</span>
      <span className="t-eyebrow pointer-events-none absolute right-4 top-4 !text-ink">{labels[1]}</span>

      <input
        type="range"
        min={4}
        max={96}
        value={Math.round(pos)}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`Compare ${labels[0]} and ${labels[1]}`}
        className="absolute bottom-3 left-1/2 w-40 -translate-x-1/2 opacity-0 focus-visible:opacity-100"
      />
    </div>
  );
}
