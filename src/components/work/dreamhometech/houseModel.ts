/**
 * Procedural house model for the DreamHomeTech sequence.
 * Everything is defined in metres on a plan where +x is east and +z is south.
 */

export const WALL_H = 2.7;
export const DOOR_H = 2.1;
export const SILL_H = 0.9;
export const WIN_TOP = 2.2;

export interface Opening {
  at: number; // distance along the wall from its start, to the opening's start
  width: number;
  type: "door" | "window";
}

export interface WallDef {
  id: string;
  a: [number, number];
  b: [number, number];
  t: number;
  openings: Opening[];
}

export interface RoomDef {
  id: string;
  label: string;
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

export const rooms: RoomDef[] = [
  { id: "living", label: "LIVING", x0: -6, z0: -4.5, x1: -1, z1: 0.5 },
  { id: "kitchen", label: "KITCHEN", x0: -1, z0: -4.5, x1: 2.5, z1: -1 },
  { id: "bath", label: "BATH", x0: 2.5, z0: -4.5, x1: 6, z1: -1 },
  { id: "hall", label: "HALL", x0: -1, z0: -1, x1: 6, z1: 0.5 },
  { id: "bed1", label: "BED 01", x0: -6, z0: 0.5, x1: -1, z1: 4.5 },
  { id: "bed2", label: "BED 02", x0: -1, z0: 0.5, x1: 2.5, z1: 4.5 },
  { id: "study", label: "STUDY", x0: 2.5, z0: 0.5, x1: 6, z1: 4.5 },
];

export const walls: WallDef[] = [
  // exterior
  { id: "n", a: [-6, -4.5], b: [6, -4.5], t: 0.25, openings: [{ at: 1.4, width: 2.2, type: "window" }, { at: 7.6, width: 1.4, type: "window" }, { at: 10.4, width: 0.8, type: "window" }] },
  { id: "e", a: [6, -4.5], b: [6, 4.5], t: 0.25, openings: [{ at: 6, width: 1.8, type: "window" }] },
  { id: "s", a: [6, 4.5], b: [-6, 4.5], t: 0.25, openings: [{ at: 0.9, width: 1.6, type: "window" }, { at: 4.4, width: 1.6, type: "window" }, { at: 8.6, width: 2.4, type: "window" }] },
  { id: "w", a: [-6, 4.5], b: [-6, -4.5], t: 0.25, openings: [{ at: 1, width: 2, type: "window" }, { at: 6.6, width: 1.0, type: "door" }] },
  // interior
  { id: "i1", a: [-1, -4.5], b: [-1, 0.5], t: 0.15, openings: [{ at: 1.1, width: 1.9, type: "door" }, { at: 3.9, width: 0.9, type: "door" }] },
  { id: "i2", a: [2.5, -4.5], b: [2.5, -1], t: 0.15, openings: [] },
  { id: "i3", a: [-1, -1], b: [6, -1], t: 0.15, openings: [{ at: 0.9, width: 1.7, type: "door" }, { at: 5.0, width: 0.8, type: "door" }] },
  { id: "i4", a: [-6, 0.5], b: [6, 0.5], t: 0.15, openings: [{ at: 3.7, width: 0.9, type: "door" }, { at: 6.3, width: 0.9, type: "door" }, { at: 9.8, width: 0.9, type: "door" }] },
  { id: "i5", a: [-1, 0.5], b: [-1, 4.5], t: 0.15, openings: [] },
  { id: "i6", a: [2.5, 0.5], b: [2.5, 4.5], t: 0.15, openings: [] },
];

export interface WallPiece {
  wall: string;
  cx: number;
  cz: number;
  len: number;
  angle: number;
  y0: number;
  y1: number;
  t: number;
  /** room on this side, or "exterior" */
  room: string;
  /** offset of this half-piece from the wall centreline (metres, signed) */
  side: number;
}

export interface OpeningInst {
  wall: string;
  type: "door" | "window";
  cx: number;
  cz: number;
  angle: number;
  width: number;
  y0: number;
  y1: number;
  t: number;
  nx: number;
  nz: number;
}

export const roomAt = (x: number, z: number) =>
  rooms.find((r) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1)?.id ?? "exterior";

/** Split walls into solid pieces (two half-thickness instances per piece, one per side). */
export function buildWallPieces() {
  const pieces: WallPiece[] = [];
  const openings: OpeningInst[] = [];
  for (const w of walls) {
    const dx = w.b[0] - w.a[0];
    const dz = w.b[1] - w.a[1];
    const len = Math.hypot(dx, dz);
    const ux = dx / len;
    const uz = dz / len;
    const nx = -uz;
    const nz = ux;
    const angle = Math.atan2(-uz, ux); // rotation about Y so local +x follows the wall

    const spans: { s: number; e: number; y0: number; y1: number }[] = [];
    let cursor = 0;
    const sorted = [...w.openings].sort((a, b) => a.at - b.at);
    for (const o of sorted) {
      if (o.at > cursor) spans.push({ s: cursor, e: o.at, y0: 0, y1: WALL_H });
      // above the opening
      const top = o.type === "door" ? DOOR_H : WIN_TOP;
      spans.push({ s: o.at, e: o.at + o.width, y0: top, y1: WALL_H });
      if (o.type === "window") spans.push({ s: o.at, e: o.at + o.width, y0: 0, y1: SILL_H });
      const mid = o.at + o.width / 2;
      openings.push({
        wall: w.id,
        type: o.type,
        cx: w.a[0] + ux * mid,
        cz: w.a[1] + uz * mid,
        angle,
        width: o.width,
        y0: o.type === "door" ? 0 : SILL_H,
        y1: top,
        t: w.t,
        nx,
        nz,
      });
      cursor = o.at + o.width;
    }
    if (cursor < len) spans.push({ s: cursor, e: len, y0: 0, y1: WALL_H });

    for (const sp of spans) {
      const mid = (sp.s + sp.e) / 2;
      const cx = w.a[0] + ux * mid;
      const cz = w.a[1] + uz * mid;
      for (const side of [-1, 1]) {
        const probeX = cx + nx * side * (w.t / 2 + 0.2);
        const probeZ = cz + nz * side * (w.t / 2 + 0.2);
        pieces.push({
          wall: w.id,
          cx,
          cz,
          len: sp.e - sp.s,
          angle,
          y0: sp.y0,
          y1: sp.y1,
          t: w.t / 2,
          room: roomAt(probeX, probeZ),
          side: (side * w.t) / 4,
        });
      }
    }
  }
  return { pieces, openings };
}
