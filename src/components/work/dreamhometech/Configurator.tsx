"use client";

import { rooms } from "./houseModel";
import {
  useConfigStore,
  WALL_COLORS,
  FINISH_COLORS,
  type WallSwatch,
  type FloorKind,
  type DoorStyle,
  type Finish,
  type FurnitureSet,
  type Fixture,
  type LightingPreset,
} from "@/lib/store";

const FLOOR_SWATCH: Record<FloorKind, string> = {
  oak: "#b8906a",
  walnut: "#5a3d2b",
  concrete: "#9f9d98",
  tile: "#d8d3c8",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-center gap-3 border-b border-line py-3 last:border-b-0">
      <span className="t-eyebrow">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children, swatch, title }: { active: boolean; onClick: () => void; children?: React.ReactNode; swatch?: string; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      data-cursor="tap"
      className={`t-eyebrow flex items-center gap-2 border px-2.5 py-1.5 transition-colors ${active ? "border-accent !text-ink" : "border-line !text-ink-2 hover:border-ink/40"}`}
    >
      {swatch && <span className="h-3 w-3 rounded-full border border-black/30" style={{ background: swatch }} aria-hidden="true" />}
      {children}
    </button>
  );
}

/**
 * Live configurator for the generated home. Every option maps directly to
 * the 3D scene through the shared config store.
 */
export default function Configurator() {
  const cfg = useConfigStore();
  const selected = rooms.find((r) => r.id === cfg.selectedRoom);

  return (
    <div className="border border-line bg-bg-2/60" data-lenis-prevent-wheel>
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="t-eyebrow !text-ink">Configure</span>
        <span className="t-eyebrow flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> live
        </span>
      </div>

      <div className="px-4">
        <Row label="Apply to">
          <Chip active={!cfg.selectedRoom} onClick={() => cfg.selectRoom(null)}>
            All rooms
          </Chip>
          {rooms.map((r) => (
            <Chip key={r.id} active={cfg.selectedRoom === r.id} onClick={() => cfg.selectRoom(cfg.selectedRoom === r.id ? null : r.id)}>
              {r.label}
            </Chip>
          ))}
        </Row>
        <Row label={selected ? `Walls · ${selected.label}` : "Walls"}>
          {(Object.keys(WALL_COLORS) as WallSwatch[]).map((k) => (
            <Chip key={k} active={(selected ? cfg.roomWalls[selected.id] ?? cfg.wall : cfg.wall) === k} onClick={() => cfg.setWall(k)} swatch={WALL_COLORS[k]} title={k}>
              {k}
            </Chip>
          ))}
        </Row>
        <Row label="Flooring">
          {(Object.keys(FLOOR_SWATCH) as FloorKind[]).map((k) => (
            <Chip key={k} active={cfg.floor === k} onClick={() => cfg.set("floor", k)} swatch={FLOOR_SWATCH[k]}>
              {k}
            </Chip>
          ))}
        </Row>
        <Row label="Doors">
          {(["flush", "panel"] as DoorStyle[]).map((k) => (
            <Chip key={k} active={cfg.door === k} onClick={() => cfg.set("door", k)}>
              {k}
            </Chip>
          ))}
          <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
          {(["white", "charcoal"] as const).map((k) => (
            <Chip key={k} active={cfg.doorColor === k} onClick={() => cfg.set("doorColor", k)} swatch={k === "white" ? "#efede8" : "#2c2c2f"}>
              {k}
            </Chip>
          ))}
        </Row>
        <Row label="Handles">
          {(Object.keys(FINISH_COLORS) as Finish[]).map((k) => (
            <Chip key={k} active={cfg.handle === k} onClick={() => cfg.set("handle", k)} swatch={FINISH_COLORS[k]}>
              {k}
            </Chip>
          ))}
        </Row>
        <Row label="Taps">
          {(Object.keys(FINISH_COLORS) as Finish[]).map((k) => (
            <Chip key={k} active={cfg.tap === k} onClick={() => cfg.set("tap", k)} swatch={FINISH_COLORS[k]}>
              {k}
            </Chip>
          ))}
        </Row>
        <Row label="Furniture">
          {(["a", "b"] as FurnitureSet[]).map((k) => (
            <Chip key={k} active={cfg.furniture === k} onClick={() => cfg.set("furniture", k)}>
              Set {k.toUpperCase()}
            </Chip>
          ))}
        </Row>
        <Row label="Fixtures">
          {(["pendant", "spot"] as Fixture[]).map((k) => (
            <Chip key={k} active={cfg.fixture === k} onClick={() => cfg.set("fixture", k)}>
              {k}
            </Chip>
          ))}
        </Row>
        <Row label="Lighting">
          {(["day", "evening", "night"] as LightingPreset[]).map((k) => (
            <Chip key={k} active={cfg.lighting === k} onClick={() => cfg.set("lighting", k)}>
              {k}
            </Chip>
          ))}
        </Row>
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-3">
        <span className="t-eyebrow !text-ink-3">Click a room in the model to target it</span>
        <button
          type="button"
          className="t-eyebrow !text-ink underline-offset-4 hover:underline"
          onClick={() => {
            cfg.selectRoom(null);
            cfg.set("roomWalls", {});
            cfg.set("wall", "chalk");
            cfg.set("floor", "oak");
            cfg.set("door", "flush");
            cfg.set("doorColor", "white");
            cfg.set("handle", "brass");
            cfg.set("tap", "brass");
            cfg.set("furniture", "a");
            cfg.set("fixture", "pendant");
            cfg.set("lighting", "day");
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
