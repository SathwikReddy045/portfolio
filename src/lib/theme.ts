/**
 * Colour palettes. Every colour on the site resolves to these tokens, so a
 * palette change is one line (DEFAULT_THEME) or one click in the switcher.
 * Dark palettes recolour everything; light palettes keep the projection room,
 * the transitions and the phone screen as dark stage inserts.
 */
export interface Palette {
  id: string;
  name: string;
  note: string;
  bg: string;
  bg2: string;
  bg3: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  /** Neutral 3D surface colour (hero faces, model stage). */
  surface: string;
  /** Light background palette: dark "stage" inserts keep their own tokens. */
  light?: boolean;
}

export const palettes: Palette[] = [
  {
    id: "signal",
    name: "Signal",
    note: "Charcoal, off-white, projector yellow",
    bg: "#0a0a0b",
    bg2: "#0f0f11",
    bg3: "#151517",
    ink: "#ecebe6",
    ink2: "#a3a29c",
    ink3: "#67665f",
    accent: "#ffd23f",
    surface: "#1a1a1d",
  },
  {
    id: "acid",
    name: "Acid",
    note: "Near-black, paper white, lime",
    bg: "#0a0b0a",
    bg2: "#101210",
    bg3: "#161816",
    ink: "#f1f2ea",
    ink2: "#a6a89d",
    ink3: "#6a6c62",
    accent: "#c8ff3d",
    surface: "#1a1b19",
  },
  {
    id: "ember",
    name: "Ember",
    note: "Warm black, bone, international orange",
    bg: "#0c0a09",
    bg2: "#131010",
    bg3: "#1a1615",
    ink: "#f3ece3",
    ink2: "#aa9f93",
    ink3: "#6e655c",
    accent: "#ff5a2e",
    surface: "#1d1917",
  },
  {
    id: "glacier",
    name: "Glacier",
    note: "Blue-black, cool white, electric cyan",
    bg: "#070a0f",
    bg2: "#0c1017",
    bg3: "#12171f",
    ink: "#e9eef5",
    ink2: "#9ca7b5",
    ink3: "#616b78",
    accent: "#5ad0ff",
    surface: "#161c25",
  },
  {
    id: "orchid",
    name: "Orchid",
    note: "Ink violet, lilac white, lavender",
    bg: "#0a0812",
    bg2: "#110e1a",
    bg3: "#181423",
    ink: "#ece7f6",
    ink2: "#a39cb4",
    ink3: "#67607a",
    accent: "#b48cff",
    surface: "#1c1826",
  },
  {
    id: "paper",
    name: "Paper",
    note: "Warm paper, near-black ink, signal orange",
    bg: "#f4f1ea",
    bg2: "#ebe7de",
    bg3: "#e1dcd0",
    ink: "#151518",
    ink2: "#5c5a55",
    ink3: "#948f86",
    accent: "#e84b1f",
    surface: "#d8d3c7",
    light: true,
  },
  {
    id: "mist",
    name: "Mist",
    note: "Pale blue-grey, navy ink, cobalt",
    bg: "#eef1f5",
    bg2: "#e3e8ee",
    bg3: "#d6dde6",
    ink: "#0f161f",
    ink2: "#4f5a68",
    ink3: "#8592a2",
    accent: "#1f56ff",
    surface: "#cfd6df",
    light: true,
  },
  {
    id: "blush",
    name: "Blush",
    note: "Pastel blush, plum ink, raspberry",
    bg: "#f7eef0",
    bg2: "#f0e3e6",
    bg3: "#e6d4d9",
    ink: "#241a1e",
    ink2: "#6a5a60",
    ink3: "#9c8a91",
    accent: "#e1446c",
    surface: "#dfccd1",
    light: true,
  },
];

export const DEFAULT_THEME = "paper";

export const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

export const paletteById = (id?: string | null) => palettes.find((p) => p.id === id) ?? palettes.find((p) => p.id === DEFAULT_THEME)!;

/** CSS custom properties for a palette, as applied to <html>. */
export function paletteVars(p: Palette): Record<string, string> {
  return {
    "--bg": p.bg,
    "--bg-2": p.bg2,
    "--bg-3": p.bg3,
    "--ink": p.ink,
    "--ink-2": p.ink2,
    "--ink-3": p.ink3,
    "--accent": p.accent,
    "--accent-rgb": hexToRgb(p.accent).join(" "),
    "--ink-rgb": hexToRgb(p.ink).join(" "),
    "--surface": p.surface,
  };
}

export function applyPalette(p: Palette) {
  const el = document.documentElement;
  for (const [k, v] of Object.entries(paletteVars(p))) el.style.setProperty(k, v);
  el.dataset.theme = p.id;
  el.dataset.light = p.light ? "1" : "0";
}

/** The palette currently applied to the page (default during SSR). */
export function currentPalette(): Palette {
  if (typeof document === "undefined") return paletteById(DEFAULT_THEME);
  return paletteById(document.documentElement.dataset.theme);
}

/** Colours for imperative code (three.js materials, canvas, GSAP). */
export function themeColors() {
  const p = currentPalette();
  return { accent: p.accent, ink: p.ink, bg: p.bg, surface: p.surface, light: !!p.light, accentRgb: hexToRgb(p.accent), inkRgb: hexToRgb(p.ink) };
}

export const accentRgba = (a: number) => `rgba(${themeColors().accentRgb.join(",")},${a})`;
export const inkRgba = (a: number) => `rgba(${themeColors().inkRgb.join(",")},${a})`;

/** Inline boot script: applies the stored palette before first paint. */
export const themeBootScript = `(function(){try{var id=localStorage.getItem("theme");var P=${JSON.stringify(
  Object.fromEntries(palettes.map((p) => [p.id, paletteVars(p)])),
)};var L=${JSON.stringify(Object.fromEntries(palettes.map((p) => [p.id, p.light ? 1 : 0])))};var v=P[id];if(!v)return;var s=document.documentElement.style;for(var k in v)s.setProperty(k,v[k]);document.documentElement.dataset.theme=id;document.documentElement.dataset.light=String(L[id]||0);}catch(e){}})();`;
