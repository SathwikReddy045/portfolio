import { create } from "zustand";

/* ---------------- Cursor ---------------- */
export type CursorVariant = "default" | "link" | "label" | "hidden";

interface CursorState {
  variant: CursorVariant;
  label: string;
  set: (variant: CursorVariant, label?: string) => void;
  reset: () => void;
}

export const useCursorStore = create<CursorState>((set) => ({
  variant: "default",
  label: "",
  set: (variant, label = "") => set({ variant, label }),
  reset: () => set({ variant: "default", label: "" }),
}));

/* ---------------- UI ---------------- */
interface UIState {
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  activeProject: number; // 0 = none, 1..3
  projectProgress: number[]; // per project 0..1
  setProjectProgress: (index: number, value: number) => void;
  setActiveProject: (index: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  menuOpen: false,
  setMenuOpen: (v) => set({ menuOpen: v }),
  activeProject: 0,
  projectProgress: [0, 0, 0],
  setProjectProgress: (index, value) =>
    set((s) => {
      if (s.projectProgress[index] === value) return s;
      const next = [...s.projectProgress];
      next[index] = value;
      return { projectProgress: next };
    }),
  setActiveProject: (index) =>
    set((s) => (s.activeProject === index ? s : { activeProject: index })),
}));

/* ---------------- DreamHomeTech configurator ---------------- */
export type WallSwatch = "chalk" | "clay" | "sage" | "slate" | "terracotta";
export type FloorKind = "oak" | "walnut" | "concrete" | "tile";
export type DoorStyle = "flush" | "panel";
export type Finish = "brass" | "chrome" | "black";
export type FurnitureSet = "a" | "b";
export type Fixture = "pendant" | "spot";
export type LightingPreset = "day" | "evening" | "night";

export const WALL_COLORS: Record<WallSwatch, string> = {
  chalk: "#e9e5dc",
  clay: "#c9a98c",
  sage: "#9aa894",
  slate: "#6a7078",
  terracotta: "#b5624a",
};

export const FINISH_COLORS: Record<Finish, string> = {
  brass: "#c9a24a",
  chrome: "#d8dbe0",
  black: "#1a1a1c",
};

interface ConfigState {
  wall: WallSwatch;
  roomWalls: Partial<Record<string, WallSwatch>>;
  selectedRoom: string | null;
  floor: FloorKind;
  door: DoorStyle;
  doorColor: "white" | "charcoal";
  handle: Finish;
  tap: Finish;
  furniture: FurnitureSet;
  fixture: Fixture;
  lighting: LightingPreset;
  set: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
  setWall: (swatch: WallSwatch) => void;
  selectRoom: (id: string | null) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  wall: "chalk",
  roomWalls: {},
  selectedRoom: null,
  floor: "oak",
  door: "flush",
  doorColor: "white",
  handle: "brass",
  tap: "brass",
  furniture: "a",
  fixture: "pendant",
  lighting: "day",
  set: (key, value) => set({ [key]: value } as Partial<ConfigState>),
  setWall: (swatch) =>
    set((s) =>
      s.selectedRoom
        ? { roomWalls: { ...s.roomWalls, [s.selectedRoom]: swatch } }
        : { wall: swatch, roomWalls: {} },
    ),
  selectRoom: (id) => set({ selectedRoom: id }),
}));

/* ---------------- Visionary Control AR state ---------------- */
export type ACMode = "cool" | "heat" | "fan";

interface ARState {
  power: boolean;
  temp: number;
  mode: ACMode;
  fan: 1 | 2 | 3;
  togglePower: () => void;
  setPower: (v: boolean) => void;
  setTemp: (v: number) => void;
  setMode: (m: ACMode) => void;
  setFan: (f: 1 | 2 | 3) => void;
}

export const useARStore = create<ARState>((set) => ({
  power: false,
  temp: 22,
  mode: "cool",
  fan: 2,
  togglePower: () => set((s) => ({ power: !s.power })),
  setPower: (v) => set({ power: v }),
  setTemp: (v) => set({ temp: Math.min(30, Math.max(16, v)) }),
  setMode: (mode) => set({ mode }),
  setFan: (fan) => set({ fan }),
}));
