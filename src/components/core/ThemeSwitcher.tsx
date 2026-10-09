"use client";

import { useEffect, useState } from "react";
import { DEFAULT_THEME, palettes } from "@/lib/theme";

/**
 * Floating palette picker. Stores the choice and reloads so every canvas
 * and diagram picks up the new tokens. Remove from the layout once a
 * palette is final (or set DEFAULT_THEME in lib/theme.ts).
 */
export default function ThemeSwitcher() {
  const [active, setActive] = useState(DEFAULT_THEME);

  useEffect(() => {
    setActive(document.documentElement.dataset.theme || DEFAULT_THEME);
  }, []);

  const choose = (id: string) => {
    try {
      localStorage.setItem("theme", id);
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  const current = palettes.find((p) => p.id === active) ?? palettes[0];

  return (
    <div
      className="fixed bottom-5 right-5 z-[150] flex items-center gap-1.5 rounded-full border border-line bg-bg/85 py-1.5 pl-3 pr-2 backdrop-blur-md"
      data-cursor="none"
      role="group"
      aria-label="Colour palette"
    >
      <span className="t-eyebrow mr-1 !text-[0.6rem]">
        Palette <span className="!text-ink">{current.name}</span>
      </span>
      {palettes.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => choose(p.id)}
          title={`${p.name} — ${p.note}`}
          aria-label={`Use ${p.name} palette`}
          aria-pressed={active === p.id}
          className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${active === p.id ? "scale-110 border-ink" : "border-transparent"}`}
          style={{ background: p.accent, boxShadow: `inset 0 0 0 2px ${p.bg}` }}
        />
      ))}
    </div>
  );
}
