"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, RoundedBox, SoftShadows } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { buildWallPieces, rooms, WALL_H, DOOR_H } from "./houseModel";
import { furnitureLayout, PALETTES, type MatKey } from "./furnitureLayout";
import { Furniture, useFurnitureMaterials } from "./FurnitureKit";
import { floorTexture, TEXTURE_METRES } from "./textures";
import { useConfigStore, useCursorStore, WALL_COLORS, FINISH_COLORS, type LightingPreset } from "@/lib/store";
import { lerp, range, smooth, clamp } from "@/lib/hooks";
import { themeColors } from "@/lib/theme";

interface Props {
  progressRef: RefObject<number>;
  /** DOM elements (one per room, in `rooms` order) positioned by the scene. */
  labelRefs: RefObject<(HTMLDivElement | null)[]>;
  active: boolean;
  isTouch: boolean;
  reduced: boolean;
}

const T = themeColors();
const MODEL_WHITE = new THREE.Color(T.light ? "#dcd7cc" : "#e9e7e2");
const EXTERIOR = new THREE.Color(T.light ? "#cfc9bc" : "#d6d1c6");
const MODEL_FLOOR = T.light ? "#e4e0d6" : "#f2f0eb";
const ACCENT = new THREE.Color(T.accent);
const DOOR_COLORS = { white: "#efede8", charcoal: "#2c2c2f" };

const backOut = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function unitBox() {
  const g = new THREE.BoxGeometry(1, 1, 1);
  g.translate(0, 0.5, 0);
  return g;
}

/* ------------------------------------------------------------------ */

function Scene({ progressRef, labelRefs, isTouch, reduced }: Props) {
  const { camera, size, scene } = useThree();
  const cfg = useConfigStore();
  const sRef = useRef(reduced ? 8 : 0);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const orbiting = useRef(false);
  const shadows = !isTouch;

  const model = useMemo(() => buildWallPieces(), []);
  const wallOrder = useMemo(() => {
    const ids = Array.from(new Set(model.pieces.map((p) => p.wall)));
    return new Map(ids.map((id, i) => [id, i / Math.max(1, ids.length - 1)]));
  }, [model]);

  const box = useMemo(() => unitBox(), []);
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.96 }), []);
  const fillerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: MODEL_WHITE, roughness: 0.95 }), []);
  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a2a2c", roughness: 0.45, metalness: 0.4 }), []);
  const trimMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ecebe6", roughness: 0.55 }), []);
  const glassMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#aac6d6", roughness: 0.05, metalness: 0, transmission: 0.0, transparent: true, opacity: 0.42, emissive: "#0b1b2b", emissiveIntensity: 0 }),
    [],
  );
  const doorMat = useMemo(() => new THREE.MeshStandardMaterial({ color: DOOR_COLORS.white, roughness: 0.55 }), []);
  const doorInsetMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d9d6cf", roughness: 0.6 }), []);
  const handleMat = useMemo(() => new THREE.MeshStandardMaterial({ color: FINISH_COLORS.brass, roughness: 0.25, metalness: 0.95 }), []);
  const modelFloorMat = useMemo(() => new THREE.MeshStandardMaterial({ color: MODEL_FLOOR, roughness: 1, transparent: true, opacity: 0 }), []);
  const groundMat = useMemo(() => new THREE.MeshStandardMaterial({ color: T.light ? T.surface : "#1b1e1a", roughness: 1, transparent: true, opacity: 0 }), []);
  const slabMat = useMemo(() => new THREE.MeshStandardMaterial({ color: T.light ? "#bdb8ae" : "#8f8c86", roughness: 0.95, transparent: true, opacity: 0 }), []);
  const roofMat = useMemo(() => new THREE.LineBasicMaterial({ color: T.accent, transparent: true, opacity: 0 }), []);
  const planMat = useMemo(() => new THREE.LineBasicMaterial({ color: T.ink, transparent: true, opacity: 0.9 }), []);
  const gridMat = useMemo(() => new THREE.LineBasicMaterial({ color: T.ink, transparent: true, opacity: 0.1 }), []);
  const outlineMat = useMemo(() => new THREE.LineBasicMaterial({ color: T.accent, transparent: true, opacity: 0 }), []);
  const bulbMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff4dc", emissive: "#ffd9a0", emissiveIntensity: 0 }), []);
  const mats = useFurnitureMaterials();
  const matTargets = useRef(new Map<MatKey, THREE.Color>());

  const wallsRef = useRef<THREE.InstancedMesh>(null);
  const fillersRef = useRef<THREE.InstancedMesh>(null);
  const framesRef = useRef<THREE.InstancedMesh>(null);
  const skirtingRef = useRef<THREE.InstancedMesh>(null);
  const doorsRef = useRef<THREE.Group>(null);
  const glassRef = useRef<THREE.Group>(null);
  const furnRef = useRef<THREE.Group>(null);
  const fixturesRef = useRef<THREE.Group>(null);
  const texFloorsRef = useRef<THREE.Group>(null);
  const modelFloorsRef = useRef<THREE.Group>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const pointsRef = useRef<THREE.Group>(null);
  const outlineRef = useRef<THREE.LineLoop>(null);

  const wallColors = useMemo(() => {
    const cur = new Float32Array(model.pieces.length * 3);
    for (let i = 0; i < model.pieces.length; i++) MODEL_WHITE.toArray(cur, i * 3);
    return cur;
  }, [model]);

  const frames = useMemo(() => {
    const out: { cx: number; cz: number; angle: number; y: number; sx: number; sy: number; sz: number; kind: "door" | "window"; k: number }[] = [];
    model.openings.forEach((o, k) => {
      const depth = o.t + 0.05;
      const h = o.y1 - o.y0;
      const ux = Math.cos(o.angle);
      const uz = -Math.sin(o.angle);
      const half = o.width / 2 - 0.03;
      out.push({ cx: o.cx - ux * half, cz: o.cz - uz * half, angle: o.angle, y: o.y0, sx: 0.06, sy: h, sz: depth, kind: o.type, k });
      out.push({ cx: o.cx + ux * half, cz: o.cz + uz * half, angle: o.angle, y: o.y0, sx: 0.06, sy: h, sz: depth, kind: o.type, k });
      out.push({ cx: o.cx, cz: o.cz, angle: o.angle, y: o.y1 - 0.06, sx: o.width, sy: 0.06, sz: depth, kind: o.type, k });
      if (o.type === "window") out.push({ cx: o.cx, cz: o.cz, angle: o.angle, y: o.y0, sx: o.width + 0.08, sy: 0.05, sz: depth + 0.08, kind: o.type, k });
    });
    return out;
  }, [model]);

  const skirting = useMemo(
    () =>
      model.pieces
        .filter((p) => p.y0 === 0 && p.room !== "exterior")
        .map((p) => {
          const nx = Math.sin(p.angle);
          const nz = Math.cos(p.angle);
          const sign = Math.sign(p.side);
          const off = p.side * 2 + sign * 0.009;
          return { cx: p.cx + nx * off, cz: p.cz + nz * off, angle: p.angle, len: p.len, wall: p.wall };
        }),
    [model],
  );

  const doors = useMemo(() => model.openings.filter((o) => o.type === "door"), [model]);
  const windows = useMemo(() => model.openings.filter((o) => o.type === "window"), [model]);

  const plan = useMemo(() => {
    const pts: number[] = [];
    const y = 0.012;
    for (const p of model.pieces) {
      if (p.y0 > 0 || p.side < 0) continue;
      const ux = Math.cos(p.angle);
      const uz = -Math.sin(p.angle);
      const nx = -uz;
      const nz = ux;
      const t = p.t * 2;
      const corners = [
        [p.cx - ux * (p.len / 2) - nx * (t / 2), p.cz - uz * (p.len / 2) - nz * (t / 2)],
        [p.cx + ux * (p.len / 2) - nx * (t / 2), p.cz + uz * (p.len / 2) - nz * (t / 2)],
        [p.cx + ux * (p.len / 2) + nx * (t / 2), p.cz + uz * (p.len / 2) + nz * (t / 2)],
        [p.cx - ux * (p.len / 2) + nx * (t / 2), p.cz - uz * (p.len / 2) + nz * (t / 2)],
      ];
      for (let i = 0; i < 4; i++) {
        const a = corners[i];
        const b = corners[(i + 1) % 4];
        pts.push(a[0], y, a[1], b[0], y, b[1]);
      }
    }
    for (const o of model.openings) {
      const ux = Math.cos(o.angle);
      const uz = -Math.sin(o.angle);
      if (o.type === "window") {
        for (const off of [-0.05, 0.05]) {
          pts.push(o.cx - ux * (o.width / 2) + o.nx * off, y, o.cz - uz * (o.width / 2) + o.nz * off, o.cx + ux * (o.width / 2) + o.nx * off, y, o.cz + uz * (o.width / 2) + o.nz * off);
        }
      } else {
        const hx = o.cx - ux * (o.width / 2);
        const hz = o.cz - uz * (o.width / 2);
        const n = 10;
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * (Math.PI / 2);
          const a1 = ((i + 1) / n) * (Math.PI / 2);
          pts.push(
            hx + (ux * Math.cos(a0) + o.nx * Math.sin(a0)) * o.width,
            y,
            hz + (uz * Math.cos(a0) + o.nz * Math.sin(a0)) * o.width,
            hx + (ux * Math.cos(a1) + o.nx * Math.sin(a1)) * o.width,
            y,
            hz + (uz * Math.cos(a1) + o.nz * Math.sin(a1)) * o.width,
          );
        }
        pts.push(hx, y, hz, hx + o.nx * o.width, y, hz + o.nz * o.width);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const grid: number[] = [];
    for (let x = -8; x <= 8; x++) grid.push(x, 0.005, -6.5, x, 0.005, 6.5);
    for (let z = -6; z <= 6; z++) grid.push(-8, 0.005, z, 8, 0.005, z);
    const gg = new THREE.BufferGeometry();
    gg.setAttribute("position", new THREE.Float32BufferAttribute(grid, 3));
    return { g, gg };
  }, [model]);

  const roof = useMemo(() => {
    const pts: number[] = [];
    const y0 = WALL_H + 0.25;
    const ridge = y0 + 2.1;
    const x0 = -6.6;
    const x1 = 6.6;
    const z0 = -5.1;
    const z1 = 5.1;
    pts.push(x0, y0, z0, x1, y0, z0, x0, y0, z1, x1, y0, z1, x0, ridge, 0, x1, ridge, 0);
    for (const x of [x0, x1]) pts.push(x, y0, z0, x, ridge, 0, x, y0, z1, x, ridge, 0);
    for (let x = -5.2; x <= 5.3; x += 1.3) pts.push(x, y0, z0, x, ridge, 0, x, y0, z1, x, ridge, 0);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  const placements = useMemo(() => furnitureLayout(cfg.furniture), [cfg.furniture]);

  // floor textures
  const floorTex = useMemo(() => floorTexture(cfg.floor), [cfg.floor]);
  const texFloorMats = useMemo(() => rooms.map(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6, transparent: true, opacity: 0 })), []);
  useEffect(() => {
    texFloorMats.forEach((m, i) => {
      const r = rooms[i];
      const t = floorTex.clone();
      t.needsUpdate = true;
      t.repeat.set((r.x1 - r.x0) / TEXTURE_METRES[cfg.floor], (r.z1 - r.z0) / TEXTURE_METRES[cfg.floor]);
      m.map = t;
      m.roughness = cfg.floor === "tile" ? 0.35 : cfg.floor === "concrete" ? 0.5 : 0.62;
      m.needsUpdate = true;
    });
  }, [floorTex, texFloorMats, cfg.floor]);

  // configurator → material targets
  useEffect(() => {
    doorMat.color.set(DOOR_COLORS[cfg.doorColor]);
    doorInsetMat.color.set(cfg.doorColor === "white" ? "#dcd9d2" : "#3a3a3e");
  }, [cfg.doorColor, doorMat, doorInsetMat]);
  useEffect(() => {
    handleMat.color.set(FINISH_COLORS[cfg.handle]);
  }, [cfg.handle, handleMat]);
  useEffect(() => {
    const palette = PALETTES[cfg.furniture];
    (Object.keys(palette) as MatKey[]).forEach((k) => {
      matTargets.current.set(k, new THREE.Color(k === "tap" ? FINISH_COLORS[cfg.tap] : palette[k]));
    });
  }, [cfg.furniture, cfg.tap]);

  const lightTargets = useMemo<Record<"model" | LightingPreset, { hemi: number; hemiSky: string; sun: number; sunColor: string; sunPos: [number, number, number]; points: number; env: number }>>(
    () => ({
      model: { hemi: 1.0, hemiSky: "#dfe6ee", sun: 1.5, sunColor: "#fff6e8", sunPos: [8, 14, 6], points: 0, env: 0.55 },
      day: { hemi: 0.7, hemiSky: "#d4e2f2", sun: 2.6, sunColor: "#fff1dc", sunPos: [10, 16, 4], points: 0, env: 0.7 },
      evening: { hemi: 0.28, hemiSky: "#6a6f84", sun: 1.2, sunColor: "#ffb070", sunPos: [-14, 4.5, 8], points: 1.4, env: 0.35 },
      night: { hemi: 0.12, hemiSky: "#223044", sun: 0.0, sunColor: "#8899bb", sunPos: [-14, 4.5, 8], points: 2.0, env: 0.15 },
    }),
    [],
  );

  const tmpM = useMemo(() => new THREE.Matrix4(), []);
  const tmpP = useMemo(() => new THREE.Vector3(), []);
  const tmpQ = useMemo(() => new THREE.Quaternion(), []);
  const tmpS = useMemo(() => new THREE.Vector3(), []);
  const tmpC = useMemo(() => new THREE.Color(), []);
  const camPos = useMemo(() => new THREE.Vector3(0, 23, 5.5), []);
  const camLook = useMemo(() => new THREE.Vector3(), []);
  const curLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const yAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  const keys = useMemo(
    () => [
      { s: 0, pos: new THREE.Vector3(0, 23, 5.5), look: new THREE.Vector3(0, 0, 0.3), fov: 30 },
      { s: 1.6, pos: new THREE.Vector3(9, 16.5, 11), look: new THREE.Vector3(0, 0.4, 0), fov: 32 },
      { s: 3.2, pos: new THREE.Vector3(10.5, 14.5, 12.5), look: new THREE.Vector3(0, 0.6, 0), fov: 33 },
      { s: 5, pos: new THREE.Vector3(11.5, 13.5, 13.5), look: new THREE.Vector3(0, 0.6, 0), fov: 33 },
      { s: 7, pos: new THREE.Vector3(13, 13, 15), look: new THREE.Vector3(0, 0.8, 0), fov: 33 },
      { s: 8, pos: new THREE.Vector3(13.5, 12.5, 15.5), look: new THREE.Vector3(0, 0.6, 0), fov: 33 },
    ],
    [],
  );

  useEffect(() => {
    return () => {
      box.dispose();
      plan.g.dispose();
      plan.gg.dispose();
      roof.dispose();
    };
  }, [box, plan, roof]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const target = reduced ? 8 : progressRef.current ?? 0;
    sRef.current = lerp(sRef.current, target, 1 - Math.pow(0.0005, dt));
    const s = sRef.current;
    const k = 1 - Math.pow(0.001, dt);

    planMat.opacity = 0.9 * (1 - smooth(range(s, 1.4, 2.6)));
    gridMat.opacity = 0.1 * (1 - smooth(range(s, 0.6, 1.8)));

    const materials = smooth(range(s, 5, 5.9));
    const lighting = smooth(range(s, 6, 6.9));
    const complete = smooth(range(s, 7, 7.7));
    const cut = range(s, 3, 3.9);

    // ----- walls
    const walls = wallsRef.current;
    if (walls) {
      let colorDirty = false;
      model.pieces.forEach((p, i) => {
        const order = wallOrder.get(p.wall) ?? 0;
        const rise = smooth(range(s, 1 + order * 0.5, 1.45 + order * 0.5));
        const nx = Math.sin(p.angle);
        const nz = Math.cos(p.angle);
        tmpP.set(p.cx + nx * p.side, p.y0 * rise, p.cz + nz * p.side);
        tmpQ.setFromAxisAngle(yAxis, p.angle);
        tmpS.set(p.len, Math.max(0.0001, (p.y1 - p.y0) * rise), p.t);
        tmpM.compose(tmpP, tmpQ, tmpS);
        walls.setMatrixAt(i, tmpM);
        const roomSwatch = p.room === "exterior" ? null : cfg.roomWalls[p.room] ?? cfg.wall;
        if (materials <= 0.001) tmpC.copy(MODEL_WHITE);
        else if (p.room === "exterior") tmpC.copy(MODEL_WHITE).lerp(EXTERIOR, materials);
        else tmpC.copy(MODEL_WHITE).lerp(new THREE.Color(WALL_COLORS[roomSwatch!]), materials);
        const o = i * 3;
        const dr = tmpC.r - wallColors[o];
        const dg = tmpC.g - wallColors[o + 1];
        const db = tmpC.b - wallColors[o + 2];
        if (Math.abs(dr) + Math.abs(dg) + Math.abs(db) > 0.002) {
          wallColors[o] += dr * k;
          wallColors[o + 1] += dg * k;
          wallColors[o + 2] += db * k;
          colorDirty = true;
        }
        if (cfg.selectedRoom && p.room === cfg.selectedRoom && s > 7.5) {
          const pulse = 0.08 + 0.06 * Math.sin(t * 4);
          walls.setColorAt(i, tmpC.setRGB(wallColors[o] + pulse, wallColors[o + 1] + pulse * 0.8, wallColors[o + 2]));
          colorDirty = true;
        } else {
          walls.setColorAt(i, tmpC.setRGB(wallColors[o], wallColors[o + 1], wallColors[o + 2]));
        }
      });
      walls.instanceMatrix.needsUpdate = true;
      if (walls.instanceColor && (colorDirty || cfg.selectedRoom)) walls.instanceColor.needsUpdate = true;
    }

    // ----- fillers
    const fillers = fillersRef.current;
    if (fillers) {
      model.openings.forEach((o, i) => {
        const order = wallOrder.get(o.wall) ?? 0;
        const rise = smooth(range(s, 1 + order * 0.5, 1.45 + order * 0.5));
        const cutK = cut <= 0 ? 0 : smooth(range(cut, i / model.openings.length - 0.1, i / model.openings.length + 0.25));
        const sc = (1 - cutK) * rise;
        const h = o.y1 - o.y0;
        tmpP.set(o.cx, o.y0 + (h * (1 - sc)) / 2, o.cz);
        tmpQ.setFromAxisAngle(yAxis, o.angle);
        tmpS.set(o.width * (1 - cutK * 0.3), Math.max(0.0001, h * sc), o.t + 0.002);
        tmpM.compose(tmpP, tmpQ, tmpS);
        fillers.setMatrixAt(i, tmpM);
        tmpC.copy(MODEL_WHITE).lerp(ACCENT, cutK > 0 && cutK < 1 ? 1 : 0);
        fillers.setColorAt(i, tmpC);
      });
      fillers.instanceMatrix.needsUpdate = true;
      if (fillers.instanceColor) fillers.instanceColor.needsUpdate = true;
      fillers.visible = cut < 1;
    }

    // ----- frames
    const fr = framesRef.current;
    if (fr) {
      frames.forEach((f, i) => {
        const pop = cut <= 0 ? 0 : backOut(clamp(smooth(range(cut, f.k / model.openings.length - 0.05, f.k / model.openings.length + 0.3))));
        tmpP.set(f.cx, f.y, f.cz);
        tmpQ.setFromAxisAngle(yAxis, f.angle);
        tmpS.set(Math.max(0.0001, f.sx * pop), Math.max(0.0001, f.sy * pop), f.sz);
        tmpM.compose(tmpP, tmpQ, tmpS);
        fr.setMatrixAt(i, tmpM);
        fr.setColorAt(i, f.kind === "door" ? tmpC.set(doorMat.color) : tmpC.set("#2a2a2c"));
      });
      fr.instanceMatrix.needsUpdate = true;
      if (fr.instanceColor) fr.instanceColor.needsUpdate = true;
      fr.visible = cut > 0;
    }

    // ----- skirting (arrives with materials)
    const sk = skirtingRef.current;
    if (sk) {
      skirting.forEach((p, i) => {
        const k2 = smooth(range(s, 5.1 + (i / skirting.length) * 0.3, 5.4 + (i / skirting.length) * 0.3));
        tmpP.set(p.cx, 0, p.cz);
        tmpQ.setFromAxisAngle(yAxis, p.angle);
        tmpS.set(p.len * k2 + 0.0001, 0.09, 0.016);
        tmpM.compose(tmpP, tmpQ, tmpS);
        sk.setMatrixAt(i, tmpM);
      });
      sk.instanceMatrix.needsUpdate = true;
      sk.visible = s > 5.05;
    }

    // ----- doors & glass
    const popGroup = (g: THREE.Group | null, offset: number) => {
      if (!g) return;
      g.children.forEach((c, i) => {
        const pop = cut <= 0 ? 0 : backOut(clamp(smooth(range(cut, (i / g.children.length) * 0.6 + offset, (i / g.children.length) * 0.6 + offset + 0.3))));
        c.scale.setScalar(Math.max(0.0001, pop));
        c.visible = pop > 0.001;
      });
    };
    popGroup(doorsRef.current, 0.1);
    popGroup(glassRef.current, 0.15);

    // ----- furniture (rises into place)
    const fg = furnRef.current;
    if (fg) {
      const n = Math.max(1, fg.children.length);
      fg.children.forEach((outer, i) => {
        const pop = backOut(clamp(smooth(range(s, 4 + (i / n) * 0.72, 4.3 + (i / n) * 0.72))));
        const inner = outer.children[0];
        if (inner) {
          inner.scale.setScalar(Math.max(0.0001, 0.6 + 0.4 * pop));
          inner.position.y = (1 - clamp(pop)) * 0.35;
        }
        outer.visible = pop > 0.001;
      });
    }
    // furniture colours
    matTargets.current.forEach((target, key) => mats[key].color.lerp(target, k));

    // ----- floors
    modelFloorsRef.current?.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
      const reveal = smooth(range(s, 1.9 + i * 0.08, 2.4 + i * 0.08));
      const pulse = Math.sin(clamp(range(s, 2 + i * 0.1, 2.7 + i * 0.1)) * Math.PI);
      m.opacity = reveal;
      c.visible = reveal > 0.001;
      m.color.set(MODEL_FLOOR).lerp(ACCENT, pulse * 0.45);
    });
    texFloorMats.forEach((m) => (m.opacity = materials));
    if (texFloorsRef.current) texFloorsRef.current.visible = materials > 0.001;

    // ----- room labels
    labelRefs.current?.forEach((el, i) => {
      if (!el) return;
      const r = rooms[i];
      const a = smooth(range(s, 0.2 + i * 0.05, 0.6 + i * 0.05)) * (1 - smooth(range(s, 3.6, 4.2)));
      el.style.opacity = String(a);
      if (a <= 0.001) return;
      tmpP.set((r.x0 + r.x1) / 2, 0.02, (r.z0 + r.z1) / 2).project(camera);
      const x = (tmpP.x * 0.5 + 0.5) * size.width;
      const y = (-tmpP.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    });

    // ----- lighting
    const preset = lightTargets[cfg.lighting];
    const modelL = lightTargets.model;
    const hemi = hemiRef.current;
    const sun = sunRef.current;
    if (hemi) {
      hemi.intensity = lerp(hemi.intensity, lerp(modelL.hemi, preset.hemi, lighting), k);
      hemi.color.lerp(tmpC.set(lighting > 0.5 ? preset.hemiSky : modelL.hemiSky), k);
    }
    if (sun) {
      sun.intensity = lerp(sun.intensity, lerp(modelL.sun, preset.sun, lighting), k);
      sun.color.lerp(tmpC.set(preset.sunColor), k * lighting + 0.01);
      tmpP.set(...modelL.sunPos).lerp(tmpS.set(...preset.sunPos), lighting);
      sun.position.lerp(tmpP, k);
    }
    scene.environmentIntensity = lerp(scene.environmentIntensity, lerp(modelL.env, preset.env, lighting), k);
    const pointsOn = preset.points * lighting;
    pointsRef.current?.children.forEach((c) => {
      const l = c as THREE.PointLight;
      l.intensity = lerp(l.intensity, pointsOn * 6, k);
    });
    bulbMat.emissiveIntensity = lerp(bulbMat.emissiveIntensity, pointsOn > 0.05 ? 2.5 : 0, k);
    glassMat.emissiveIntensity = lerp(glassMat.emissiveIntensity, cfg.lighting === "night" ? lighting * 0.6 : 0, k);
    if (fixturesRef.current) {
      const pop = backOut(clamp(smooth(range(s, 6, 6.6))));
      fixturesRef.current.scale.setScalar(Math.max(0.0001, pop));
      fixturesRef.current.visible = pop > 0.001;
    }

    // ----- complete house
    roofMat.opacity = complete * 0.32;
    groundMat.opacity = complete;
    slabMat.opacity = complete;

    // selection outline
    if (outlineRef.current) {
      const r = rooms.find((rr) => rr.id === cfg.selectedRoom);
      outlineMat.opacity = r && s > 7.5 ? 0.9 : 0;
      if (r) {
        outlineRef.current.position.set((r.x0 + r.x1) / 2, 0.04, (r.z0 + r.z1) / 2);
        outlineRef.current.scale.set(r.x1 - r.x0 - 0.2, 1, r.z1 - r.z0 - 0.2);
      }
    }

    // ----- camera
    const last = keys[keys.length - 1];
    const wantsOrbit = s > 7.6;
    const settled = camera.position.distanceTo(last.pos) < 0.35 && curLook.distanceTo(last.look) < 0.2;
    const interactive = wantsOrbit && (orbiting.current || settled);
    const controls = controlsRef.current;
    if (controls) controls.enabled = interactive;
    if (interactive) {
      if (!orbiting.current) {
        orbiting.current = true;
        controls?.target.copy(curLook);
      }
      controls?.update();
    } else {
      orbiting.current = false;
      let i = 0;
      while (i < keys.length - 2 && s > keys[i + 1].s) i++;
      const a = keys[i];
      const b = keys[i + 1];
      const kk = smooth(range(s, a.s, b.s));
      camPos.lerpVectors(a.pos, b.pos, kk);
      camLook.lerpVectors(a.look, b.look, kk);
      camera.position.lerp(camPos, k);
      curLook.lerp(camLook, k);
      camera.lookAt(curLook);
      const pc = camera as THREE.PerspectiveCamera;
      const fov = lerp(a.fov, b.fov, kk);
      if (Math.abs(pc.fov - fov) > 0.01) {
        pc.fov = fov;
        pc.updateProjectionMatrix();
      }
    }
  });

  return (
    <>
      {shadows && <SoftShadows size={14} samples={10} focus={0.5} />}
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2.2} rotation-x={Math.PI / 2} position={[0, 6, -9]} scale={[12, 12, 1]} />
        <Lightformer intensity={1.2} rotation-y={Math.PI / 2} position={[-8, 2, 0]} scale={[16, 2, 1]} />
        <Lightformer intensity={1.2} rotation-y={-Math.PI / 2} position={[8, 2, 0]} scale={[16, 2, 1]} />
        <Lightformer color="#ffd9a8" intensity={0.8} rotation-x={Math.PI / 2} position={[0, 9, 0]} scale={[14, 14, 1]} form="ring" />
      </Environment>

      <hemisphereLight ref={hemiRef} args={["#dfe6ee", "#3a3630", 1.0]} />
      <directionalLight
        ref={sunRef}
        position={[8, 14, 6]}
        intensity={1.5}
        castShadow={shadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <group ref={pointsRef}>
        {rooms.map((r) => (
          <pointLight key={r.id} position={[(r.x0 + r.x1) / 2, WALL_H - 0.5, (r.z0 + r.z1) / 2]} intensity={0} color="#ffd9a8" distance={7} decay={2} />
        ))}
      </group>

      {/* ground + slab */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.16} material={groundMat} receiveShadow={shadows}>
        <planeGeometry args={[80, 80]} />
      </mesh>
      <mesh position-y={-0.15} material={slabMat} receiveShadow={shadows}>
        <boxGeometry args={[13.2, 0.14, 10.2]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[-9, -0.07, 1]} material={slabMat}>
        <planeGeometry args={[4.5, 3.4]} />
      </mesh>

      {/* plan */}
      <lineSegments geometry={plan.gg} material={gridMat} />
      <lineSegments geometry={plan.g} material={planMat} />

      {/* floors */}
      <group ref={modelFloorsRef}>
        {rooms.map((r) => (
          <mesh key={r.id} rotation-x={-Math.PI / 2} position={[(r.x0 + r.x1) / 2, 0.0, (r.z0 + r.z1) / 2]} material={modelFloorMat.clone()} receiveShadow={shadows}>
            <planeGeometry args={[r.x1 - r.x0, r.z1 - r.z0]} />
          </mesh>
        ))}
      </group>
      <group ref={texFloorsRef}>
        {rooms.map((r, i) => (
          <mesh
            key={r.id}
            rotation-x={-Math.PI / 2}
            position={[(r.x0 + r.x1) / 2, 0.008, (r.z0 + r.z1) / 2]}
            material={texFloorMats[i]}
            receiveShadow={shadows}
            onClick={(e) => {
              if (sRef.current < 7.5) return;
              e.stopPropagation();
              const st = useConfigStore.getState();
              st.selectRoom(st.selectedRoom === r.id ? null : r.id);
            }}
            onPointerOver={() => {
              if (sRef.current >= 7.5) useCursorStore.getState().set("label", "SELECT ROOM");
            }}
            onPointerOut={() => useCursorStore.getState().set("label", "ORBIT")}
          >
            <planeGeometry args={[r.x1 - r.x0, r.z1 - r.z0]} />
          </mesh>
        ))}
      </group>
      <lineLoop ref={outlineRef} material={outlineMat} rotation-x={-Math.PI / 2}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3]} />
        </bufferGeometry>
      </lineLoop>

      {/* walls, fillers, frames, skirting */}
      <instancedMesh ref={wallsRef} args={[box, wallMat, model.pieces.length]} castShadow={shadows} receiveShadow={shadows} frustumCulled={false} />
      <instancedMesh ref={fillersRef} args={[box, fillerMat, model.openings.length]} frustumCulled={false} />
      <instancedMesh ref={framesRef} args={[box, frameMat, frames.length]} castShadow={shadows} frustumCulled={false} />
      <instancedMesh ref={skirtingRef} args={[box, trimMat, skirting.length]} frustumCulled={false} />

      {/* doors */}
      <group ref={doorsRef}>
        {doors.map((o, i) => {
          const ux = Math.cos(o.angle);
          const uz = -Math.sin(o.angle);
          const hx = o.cx - ux * (o.width / 2 - 0.03);
          const hz = o.cz - uz * (o.width / 2 - 0.03);
          const leafW = o.width - 0.08;
          return (
            <group key={i} position={[hx, 0, hz]} rotation-y={o.angle + 0.55}>
              <RoundedBox args={[leafW, DOOR_H - 0.02, 0.045]} radius={0.006} smoothness={2} position={[leafW / 2, DOOR_H / 2 - 0.01, 0]} material={doorMat} castShadow={shadows} />
              {cfg.door === "panel" &&
                [0.62, 1.52].map((y) => (
                  <RoundedBox key={y} args={[leafW * 0.68, 0.7, 0.056]} radius={0.004} smoothness={2} position={[leafW / 2, y, 0]} material={doorInsetMat} />
                ))}
              {[-0.035, 0.035].map((z) => (
                <group key={z} position={[leafW - 0.09, 1.02, z]}>
                  <mesh material={handleMat} rotation-x={Math.PI / 2}>
                    <cylinderGeometry args={[0.02, 0.02, 0.02, 14]} />
                  </mesh>
                  <mesh material={handleMat} position={[-0.055, 0, z > 0 ? 0.02 : -0.02]}>
                    <cylinderGeometry args={[0.008, 0.008, 0.13, 10]} />
                  </mesh>
                </group>
              ))}
            </group>
          );
        })}
      </group>

      {/* windows */}
      <group ref={glassRef}>
        {windows.map((o, i) => (
          <group key={i} position={[o.cx, o.y0, o.cz]} rotation-y={o.angle}>
            <mesh position={[0, (o.y1 - o.y0) / 2, 0]} material={glassMat}>
              <boxGeometry args={[o.width - 0.08, o.y1 - o.y0 - 0.08, 0.016]} />
            </mesh>
            <mesh position={[0, (o.y1 - o.y0) / 2, 0]} material={frameMat}>
              <boxGeometry args={[0.04, o.y1 - o.y0 - 0.08, 0.06]} />
            </mesh>
            <mesh position={[0, (o.y1 - o.y0) * 0.62, 0]} material={frameMat}>
              <boxGeometry args={[o.width - 0.08, 0.035, 0.06]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* furniture */}
      <group ref={furnRef}>
        {placements.map((pl) => (
          <group key={pl.id} position={pl.position} rotation-y={pl.rotationY ?? 0}>
            <group>
              <Furniture kind={pl.kind} props={pl.props} mats={mats} shadows={shadows} bulb={bulbMat} />
            </group>
          </group>
        ))}
      </group>

      {/* fixtures */}
      <group ref={fixturesRef}>
        {rooms.map((r) => {
          const cx = (r.x0 + r.x1) / 2;
          const cz = (r.z0 + r.z1) / 2;
          if (cfg.fixture === "pendant") {
            return (
              <group key={r.id} position={[cx, WALL_H, cz]}>
                <mesh position={[0, -0.22, 0]} material={frameMat}>
                  <cylinderGeometry args={[0.005, 0.005, 0.44, 6]} />
                </mesh>
                <mesh position={[0, -0.52, 0]} material={mats.shade} castShadow={shadows}>
                  <coneGeometry args={[0.17, 0.18, 28, 1, true]} />
                </mesh>
                <mesh position={[0, -0.5, 0]} material={bulbMat}>
                  <sphereGeometry args={[0.035, 12, 12]} />
                </mesh>
              </group>
            );
          }
          return (
            <group key={r.id} position={[cx, WALL_H - 0.02, cz]}>
              {[-0.8, 0, 0.8].map((dx) => (
                <mesh key={dx} position={[dx, 0, 0]} material={bulbMat}>
                  <cylinderGeometry args={[0.07, 0.07, 0.03, 16]} />
                </mesh>
              ))}
            </group>
          );
        })}
      </group>

      <lineSegments geometry={roof} material={roofMat} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={9}
        maxDistance={32}
        minPolarAngle={0.3}
        maxPolarAngle={1.22}
        target={[0, 0.6, 0]}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */

export default function HouseScene(props: Props) {
  return (
    <Canvas
      dpr={[1, props.isTouch ? 1.5 : 1.75]}
      shadows={!props.isTouch}
      camera={{ fov: 30, near: 0.5, far: 120, position: [0, 23, 5.5] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={props.active ? "always" : "never"}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
      style={{ position: "absolute", inset: 0 }}
      data-cursor="orbit"
    >
      <Scene {...props} />
    </Canvas>
  );
}
