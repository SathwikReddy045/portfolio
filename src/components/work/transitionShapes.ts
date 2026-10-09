import * as THREE from "three";
import { buildWallPieces, WALL_H } from "./dreamhometech/houseModel";

/**
 * Structured 3D line models for the project transitions.
 * Each shape is a list of segments [x1,y1,z1,x2,y2,z2] in metres.
 *  - "beam": the DreamSpaceHub projection room (walls, truss, projectors, beams)
 *  - "wire": the DreamHomeTech house (the real generated wall model + roof)
 *  - "grid": the Visionary Control scene (phone, appliance, tracking grid)
 */
export type Seg3 = [number, number, number, number, number, number];
export type ShapeKind = "beam" | "wire" | "grid";
type V3 = [number, number, number];

const push = (out: Seg3[], a: V3, b: V3) => out.push([a[0], a[1], a[2], b[0], b[1], b[2]]);

function rect(out: Seg3[], c: V3[]) {
  for (let i = 0; i < 4; i++) push(out, c[i], c[(i + 1) % 4]);
}

function boxEdges(out: Seg3[], cx: number, cy: number, cz: number, w: number, h: number, d: number) {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;
  rect(out, [
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y0, z1],
    [x0, y0, z1],
  ]);
  rect(out, [
    [x0, y1, z0],
    [x1, y1, z0],
    [x1, y1, z1],
    [x0, y1, z1],
  ]);
  for (const x of [x0, x1]) for (const z of [z0, z1]) push(out, [x, y0, z], [x, y1, z]);
}

function arc(out: Seg3[], cx: number, cy: number, cz: number, r: number, a0: number, a1: number, n: number, axis: "y" | "z" = "y") {
  for (let i = 0; i < n; i++) {
    const t0 = a0 + ((a1 - a0) * i) / n;
    const t1 = a0 + ((a1 - a0) * (i + 1)) / n;
    if (axis === "y") push(out, [cx + Math.cos(t0) * r, cy, cz + Math.sin(t0) * r], [cx + Math.cos(t1) * r, cy, cz + Math.sin(t1) * r]);
    else push(out, [cx + Math.cos(t0) * r, cy + Math.sin(t0) * r, cz], [cx + Math.cos(t1) * r, cy + Math.sin(t1) * r, cz]);
  }
}

/* ------------------------------------------------------------------ */

export function roomShape(): Seg3[] {
  const out: Seg3[] = [];
  const hw = 3;
  const hd = 2.25;
  const H = 2.8;
  // floor + 1 m grid
  rect(out, [
    [-hw, 0, -hd],
    [hw, 0, -hd],
    [hw, 0, hd],
    [-hw, 0, hd],
  ]);
  for (let x = -2; x <= 2; x++) push(out, [x, 0, -hd], [x, 0, hd]);
  for (let z = -2; z <= 2; z++) push(out, [-hw, 0, z], [hw, 0, z]);
  // walls
  push(out, [-hw, H, -hd], [hw, H, -hd]);
  push(out, [-hw, H, -hd], [-hw, H, hd]);
  push(out, [hw, H, -hd], [hw, H, hd]);
  for (const x of [-hw, hw]) for (const z of [-hd, hd]) push(out, [x, 0, z], [x, H, z]);
  push(out, [-hw, 1.4, -hd], [hw, 1.4, -hd]);
  // door swing on the right wall
  arc(out, hw, 0.01, 1.2, 0.9, Math.PI, Math.PI * 1.5, 8);
  // truss
  const ty = 3.1;
  push(out, [-hw - 0.4, ty, 1.7], [hw + 0.4, ty, 1.7]);
  push(out, [-hw - 0.4, ty - 0.22, 1.7], [hw + 0.4, ty - 0.22, 1.7]);
  for (let i = 0; i < 12; i++) {
    const x0 = -hw - 0.4 + (i * (2 * hw + 0.8)) / 12;
    const x1 = x0 + (2 * hw + 0.8) / 12;
    push(out, [x0, ty - 0.22, 1.7], [x1, ty, 1.7]);
  }
  // projectors + beams
  const proj: { from: V3; foot: V3[] }[] = [
    { from: [-1.5, 2.94, 1.6], foot: [[-3, 0.2, -hd], [0, 0.2, -hd], [0, 2.5, -hd], [-3, 2.5, -hd]] },
    { from: [1.5, 2.94, 1.6], foot: [[0, 0.2, -hd], [3, 0.2, -hd], [3, 2.5, -hd], [0, 2.5, -hd]] },
    { from: [0, 2.94, 0.3], foot: [[-1.6, 0, -2.0], [1.6, 0, -2.0], [1.6, 0, 0.8], [-1.6, 0, 0.8]] },
  ];
  for (const p of proj) {
    boxEdges(out, p.from[0], p.from[1] + 0.06, p.from[2] + 0.1, 0.36, 0.12, 0.3);
    for (const c of p.foot) push(out, p.from, c);
    rect(out, p.foot);
  }
  // projected window on the back wall
  rect(out, [
    [-0.3, 1.0, -hd + 0.01],
    [1.7, 1.0, -hd + 0.01],
    [1.7, 2.3, -hd + 0.01],
    [-0.3, 2.3, -hd + 0.01],
  ]);
  push(out, [0.7, 1.0, -hd + 0.01], [0.7, 2.3, -hd + 0.01]);
  push(out, [-0.3, 1.65, -hd + 0.01], [1.7, 1.65, -hd + 0.01]);
  return out;
}

export function houseShape(): Seg3[] {
  const out: Seg3[] = [];
  const { pieces, openings } = buildWallPieces();
  for (const p of pieces) {
    if (p.side < 0) continue;
    const ux = Math.cos(p.angle);
    const uz = -Math.sin(p.angle);
    const h = p.len / 2;
    const a: V3 = [p.cx - ux * h, p.y0, p.cz - uz * h];
    const b: V3 = [p.cx + ux * h, p.y0, p.cz + uz * h];
    const at: V3 = [a[0], p.y1, a[2]];
    const bt: V3 = [b[0], p.y1, b[2]];
    push(out, a, b);
    push(out, at, bt);
    push(out, a, at);
    push(out, b, bt);
  }
  for (const o of openings) {
    if (o.type !== "window") continue;
    const ux = Math.cos(o.angle);
    const uz = -Math.sin(o.angle);
    const my = (o.y0 + o.y1) / 2;
    push(out, [o.cx - ux * (o.width / 2), my, o.cz - uz * (o.width / 2)], [o.cx + ux * (o.width / 2), my, o.cz + uz * (o.width / 2)]);
    push(out, [o.cx, o.y0, o.cz], [o.cx, o.y1, o.cz]);
  }
  // roof
  const y0 = WALL_H + 0.25;
  const ridge = y0 + 2.1;
  const x0 = -6.6;
  const x1 = 6.6;
  const z0 = -5.1;
  const z1 = 5.1;
  push(out, [x0, y0, z0], [x1, y0, z0]);
  push(out, [x0, y0, z1], [x1, y0, z1]);
  push(out, [x0, ridge, 0], [x1, ridge, 0]);
  for (const x of [x0, x1]) {
    push(out, [x, y0, z0], [x, ridge, 0]);
    push(out, [x, y0, z1], [x, ridge, 0]);
  }
  for (let x = -5.2; x <= 5.3; x += 1.3) {
    push(out, [x, y0, z0], [x, ridge, 0]);
    push(out, [x, y0, z1], [x, ridge, 0]);
  }
  // slab
  rect(out, [
    [-6.6, -0.08, -5.1],
    [6.6, -0.08, -5.1],
    [6.6, -0.08, 5.1],
    [-6.6, -0.08, 5.1],
  ]);
  return out;
}

export function arShape(): Seg3[] {
  const out: Seg3[] = [];
  // tracking floor grid
  for (let x = -3; x <= 3; x += 0.75) push(out, [x, 0, -2.3], [x, 0, 2.2]);
  for (let z = -2.3; z <= 2.2; z += 0.75) push(out, [-3, 0, z], [3, 0, z]);
  // back wall
  rect(out, [
    [-3, 0, -2.3],
    [3, 0, -2.3],
    [3, 2.8, -2.3],
    [-3, 2.8, -2.3],
  ]);
  // appliance
  const ac: V3 = [0, 1.95, -2.17];
  boxEdges(out, ac[0], ac[1], ac[2], 1.12, 0.3, 0.26);
  push(out, [-0.5, 1.8, -2.03], [0.5, 1.8, -2.03]);
  // bounding brackets
  const bx0 = -0.68;
  const bx1 = 0.68;
  const by0 = 1.68;
  const by1 = 2.22;
  const L = 0.16;
  const z = -2.0;
  push(out, [bx0, by0, z], [bx0 + L, by0, z]);
  push(out, [bx0, by0, z], [bx0, by0 + L, z]);
  push(out, [bx1, by0, z], [bx1 - L, by0, z]);
  push(out, [bx1, by0, z], [bx1, by0 + L, z]);
  push(out, [bx0, by1, z], [bx0 + L, by1, z]);
  push(out, [bx0, by1, z], [bx0, by1 - L, z]);
  push(out, [bx1, by1, z], [bx1 - L, by1, z]);
  push(out, [bx1, by1, z], [bx1, by1 - L, z]);
  // feature crosses on the front face
  const pts: [number, number][] = [
    [-0.45, 1.98],
    [-0.28, 1.86],
    [-0.1, 2.02],
    [0.05, 1.9],
    [0.22, 2.0],
    [0.38, 1.88],
    [0.5, 2.03],
    [-0.5, 1.86],
    [0.14, 2.06],
    [-0.35, 2.04],
  ];
  for (const [x, y] of pts) {
    push(out, [x - 0.05, y, -2.02], [x + 0.05, y, -2.02]);
    push(out, [x, y - 0.05, -2.02], [x, y + 0.05, -2.02]);
  }
  // phone, held in front of the scene
  const m = new THREE.Matrix4().compose(new THREE.Vector3(0.9, 1.25, 0.9), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.12, -0.4, 0.04)), new THREE.Vector3(1, 1, 1));
  const local: Seg3[] = [];
  const w = 0.78;
  const h = 1.62;
  const r = 0.14;
  const hx = w / 2 - r;
  const hy = h / 2 - r;
  push(local, [-hx, h / 2, 0], [hx, h / 2, 0]);
  push(local, [-hx, -h / 2, 0], [hx, -h / 2, 0]);
  push(local, [w / 2, -hy, 0], [w / 2, hy, 0]);
  push(local, [-w / 2, -hy, 0], [-w / 2, hy, 0]);
  arc(local, hx, hy, 0, r, 0, Math.PI / 2, 4, "z");
  arc(local, -hx, hy, 0, r, Math.PI / 2, Math.PI, 4, "z");
  arc(local, -hx, -hy, 0, r, Math.PI, Math.PI * 1.5, 4, "z");
  arc(local, hx, -hy, 0, r, Math.PI * 1.5, Math.PI * 2, 4, "z");
  rect(local, [
    [-w / 2 + 0.05, -h / 2 + 0.05, 0.01],
    [w / 2 - 0.05, -h / 2 + 0.05, 0.01],
    [w / 2 - 0.05, h / 2 - 0.05, 0.01],
    [-w / 2 + 0.05, h / 2 - 0.05, 0.01],
  ]);
  push(local, [-0.12, h / 2 - 0.1, 0.01], [0.12, h / 2 - 0.1, 0.01]);
  // reticle on screen
  rect(local, [
    [-0.2, -0.08, 0.02],
    [0.2, -0.08, 0.02],
    [0.2, 0.22, 0.02],
    [-0.2, 0.22, 0.02],
  ]);
  const v = new THREE.Vector3();
  for (const s of local) {
    v.set(s[0], s[1], s[2]).applyMatrix4(m);
    const a: V3 = [v.x, v.y, v.z];
    v.set(s[3], s[4], s[5]).applyMatrix4(m);
    out.push([a[0], a[1], a[2], v.x, v.y, v.z]);
  }
  // recognition ray, dashed
  const from: V3 = [0.85, 1.3, 0.85];
  const to: V3 = ac;
  for (let i = 0; i < 10; i += 2) {
    const t0 = i / 10;
    const t1 = (i + 1) / 10;
    push(out, [from[0] + (to[0] - from[0]) * t0, from[1] + (to[1] - from[1]) * t0, from[2] + (to[2] - from[2]) * t0], [from[0] + (to[0] - from[0]) * t1, from[1] + (to[1] - from[1]) * t1, from[2] + (to[2] - from[2]) * t1]);
  }
  return out;
}

/* ------------------------------------------------------------------ */

/** Centre on x/z, rest on y = 0, scale so the largest footprint spans `size`. */
export function normalize(segs: Seg3[], size = 8): Seg3[] {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const s of segs) {
    for (const i of [0, 3]) {
      minX = Math.min(minX, s[i]);
      maxX = Math.max(maxX, s[i]);
      minY = Math.min(minY, s[i + 1]);
      minZ = Math.min(minZ, s[i + 2]);
      maxZ = Math.max(maxZ, s[i + 2]);
    }
  }
  const k = size / Math.max(maxX - minX, maxZ - minZ);
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  return segs.map((s) => [(s[0] - cx) * k, (s[1] - minY) * k, (s[2] - cz) * k, (s[3] - cx) * k, (s[4] - minY) * k, (s[5] - cz) * k]);
}

export function buildShape(kind: ShapeKind, size = 8): Seg3[] {
  return normalize(kind === "beam" ? roomShape() : kind === "wire" ? houseShape() : arShape(), size);
}

/** Both structures, normalised into the same frame, plus the sweep extents. */
export function prepareShapes(from: ShapeKind, to: ShapeKind) {
  const A = buildShape(from);
  const B = buildShape(to);
  let minX = Infinity;
  let maxX = -Infinity;
  for (const s of [...A, ...B]) {
    minX = Math.min(minX, s[0], s[3]);
    maxX = Math.max(maxX, s[0], s[3]);
  }
  return { A, B, front: [...A, ...B], minX, maxX };
}
