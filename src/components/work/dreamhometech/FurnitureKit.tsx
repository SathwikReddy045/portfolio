"use client";

import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";
import { PALETTES, type Kind, type MatKey } from "./furnitureLayout";

/**
 * Procedural furniture kit. Every piece is composed from rounded boxes,
 * cylinders, cones and tori so the house reads as designed, not as blocks.
 * Materials are shared across the kit and recoloured live by the configurator.
 */

export type Mats = Record<MatKey, THREE.MeshStandardMaterial>;

interface Base {
  mats: Mats;
  shadows: boolean;
  bulb?: THREE.Material;
}

type V3 = [number, number, number];

export function createFurnitureMaterials(): Mats {
  const mk = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra });
  const p = PALETTES.a;
  return {
    fabric: mk(p.fabric, { roughness: 0.95 }),
    fabricAlt: mk(p.fabricAlt, { roughness: 0.95 }),
    wood: mk(p.wood, { roughness: 0.6 }),
    woodDark: mk(p.woodDark, { roughness: 0.6 }),
    white: mk(p.white, { roughness: 0.5 }),
    dark: mk(p.dark, { roughness: 0.4, metalness: 0.2 }),
    mattress: mk(p.mattress, { roughness: 0.9 }),
    pillow: mk(p.pillow, { roughness: 0.95 }),
    duvet: mk(p.duvet, { roughness: 0.95 }),
    rug: mk(p.rug, { roughness: 1 }),
    rugBorder: mk(p.rugBorder, { roughness: 1 }),
    counter: mk(p.counter, { roughness: 0.55 }),
    stone: mk(p.stone, { roughness: 0.25, metalness: 0.05 }),
    appliance: mk(p.appliance, { roughness: 0.35, metalness: 0.5 }),
    metal: mk(p.metal, { roughness: 0.3, metalness: 0.9 }),
    tap: mk(p.tap, { roughness: 0.22, metalness: 0.95 }),
    shade: mk(p.shade, { roughness: 0.8, side: THREE.DoubleSide }),
    glass: mk(p.glass, { roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.55 }),
    mirror: mk(p.mirror, { roughness: 0.03, metalness: 1 }),
    leather: mk(p.leather, { roughness: 0.5 }),
    bookA: mk(p.bookA, { roughness: 0.8 }),
    bookB: mk(p.bookB, { roughness: 0.8 }),
    bookC: mk(p.bookC, { roughness: 0.8 }),
  };
}

/* ------------------------------------------------------------------ */
/* Primitives                                                           */
/* ------------------------------------------------------------------ */

function RB({
  size,
  r = 0.03,
  pos = [0, 0, 0],
  rot,
  mat,
  shadows,
}: {
  size: V3;
  r?: number;
  pos?: V3;
  rot?: V3;
  mat: THREE.Material;
  shadows: boolean;
}) {
  const radius = Math.min(r, Math.min(size[0], size[1], size[2]) / 2 - 0.0005);
  return (
    <RoundedBox args={size} radius={Math.max(0.0005, radius)} smoothness={3} position={pos} rotation={rot} material={mat} castShadow={shadows} receiveShadow={shadows} />
  );
}

function Cyl({
  r,
  h,
  pos = [0, 0, 0],
  rot,
  mat,
  shadows,
  rTop,
  seg = 20,
  open = false,
}: {
  r: number;
  h: number;
  pos?: V3;
  rot?: V3;
  mat: THREE.Material;
  shadows: boolean;
  rTop?: number;
  seg?: number;
  open?: boolean;
}) {
  return (
    <mesh position={pos} rotation={rot} material={mat} castShadow={shadows} receiveShadow={shadows}>
      <cylinderGeometry args={[rTop ?? r, r, h, seg, 1, open]} />
    </mesh>
  );
}

function Legs({ w, d, h, r = 0.018, inset = 0.06, mat, shadows }: { w: number; d: number; h: number; r?: number; inset?: number; mat: THREE.Material; shadows: boolean }) {
  const x = w / 2 - inset;
  const z = d / 2 - inset;
  return (
    <>
      {[
        [x, z],
        [-x, z],
        [x, -z],
        [-x, -z],
      ].map(([px, pz], i) => (
        <Cyl key={i} r={r} h={h} pos={[px, h / 2, pz]} mat={mat} shadows={shadows} seg={10} />
      ))}
    </>
  );
}

function Spout({ mat, shadows, pos = [0, 0, 0], scale = 1 }: { mat: THREE.Material; shadows: boolean; pos?: V3; scale?: number }) {
  // Tap: vertical riser + quarter-torus spout.
  return (
    <group position={pos} scale={scale}>
      <Cyl r={0.013} h={0.22} pos={[0, 0.11, 0]} mat={mat} shadows={shadows} seg={12} />
      <mesh position={[0, 0.22, 0.09]} rotation={[0, Math.PI / 2, 0]} material={mat} castShadow={shadows}>
        <torusGeometry args={[0.09, 0.011, 8, 16, Math.PI / 2]} />
      </mesh>
      <Cyl r={0.02} h={0.015} pos={[0, 0.005, 0]} mat={mat} shadows={shadows} seg={12} />
    </group>
  );
}

function Handle({ pos, vertical = false, len = 0.12, mat, shadows }: { pos: V3; vertical?: boolean; len?: number; mat: THREE.Material; shadows: boolean }) {
  return <Cyl r={0.007} h={len} pos={pos} rot={vertical ? [0, 0, 0] : [0, 0, Math.PI / 2]} mat={mat} shadows={shadows} seg={8} />;
}

/* ------------------------------------------------------------------ */
/* Seating                                                              */
/* ------------------------------------------------------------------ */

export function Sofa({ mats, shadows, width = 2.4, depth = 0.95, lShape = false, cushions = 3 }: Base & { width?: number; depth?: number; lShape?: boolean; cushions?: number }) {
  const inner = width - 0.36;
  const cw = inner / cushions - 0.03;
  return (
    <group>
      <Legs w={width - 0.1} d={depth - 0.1} h={0.08} r={0.02} mat={mats.dark} shadows={shadows} />
      <RB size={[width, 0.32, depth]} r={0.04} pos={[0, 0.24, 0]} mat={mats.fabricAlt} shadows={shadows} />
      {Array.from({ length: cushions }, (_, i) => {
        const x = -inner / 2 + cw / 2 + i * (inner / cushions) + 0.015;
        return (
          <group key={i}>
            <RB size={[cw, 0.17, depth - 0.34]} r={0.06} pos={[x, 0.485, 0.07]} mat={mats.fabric} shadows={shadows} />
            <RB size={[cw, 0.44, 0.17]} r={0.06} pos={[x, 0.7, -depth / 2 + 0.26]} rot={[-0.14, 0, 0]} mat={mats.fabric} shadows={shadows} />
          </group>
        );
      })}
      <RB size={[0.18, 0.6, depth]} r={0.05} pos={[-width / 2 + 0.09, 0.4, 0]} mat={mats.fabricAlt} shadows={shadows} />
      <RB size={[0.18, 0.6, depth]} r={0.05} pos={[width / 2 - 0.09, 0.4, 0]} mat={mats.fabricAlt} shadows={shadows} />
      {lShape && (
        <group position={[-width / 2 + 0.56, 0, depth / 2 + 0.42]}>
          <RB size={[0.92, 0.32, 0.86]} r={0.04} pos={[0, 0.24, 0]} mat={mats.fabricAlt} shadows={shadows} />
          <RB size={[0.84, 0.17, 0.8]} r={0.06} pos={[0, 0.485, 0]} mat={mats.fabric} shadows={shadows} />
          <Legs w={0.84} d={0.78} h={0.08} r={0.02} mat={mats.dark} shadows={shadows} />
        </group>
      )}
      {/* throw cushion */}
      <RB size={[0.42, 0.42, 0.12]} r={0.05} pos={[width / 2 - 0.42, 0.78, -depth / 2 + 0.42]} rot={[-0.3, 0.15, 0.1]} mat={mats.duvet} shadows={shadows} />
    </group>
  );
}

export function Armchair({ mats, shadows }: Base) {
  return (
    <group>
      <Legs w={0.8} d={0.8} h={0.1} r={0.02} mat={mats.dark} shadows={shadows} />
      <RB size={[0.9, 0.3, 0.88]} r={0.05} pos={[0, 0.25, 0]} mat={mats.fabricAlt} shadows={shadows} />
      <RB size={[0.58, 0.16, 0.6]} r={0.06} pos={[0, 0.48, 0.06]} mat={mats.fabric} shadows={shadows} />
      <RB size={[0.58, 0.46, 0.16]} r={0.06} pos={[0, 0.66, -0.3]} rot={[-0.18, 0, 0]} mat={mats.fabric} shadows={shadows} />
      <RB size={[0.16, 0.56, 0.86]} r={0.05} pos={[-0.37, 0.42, 0]} mat={mats.fabricAlt} shadows={shadows} />
      <RB size={[0.16, 0.56, 0.86]} r={0.05} pos={[0.37, 0.42, 0]} mat={mats.fabricAlt} shadows={shadows} />
    </group>
  );
}

export function Chair({ mats, shadows }: Base) {
  return (
    <group>
      <Legs w={0.42} d={0.42} h={0.44} r={0.015} inset={0.03} mat={mats.dark} shadows={shadows} />
      <RB size={[0.44, 0.04, 0.44]} r={0.015} pos={[0, 0.46, 0]} mat={mats.wood} shadows={shadows} />
      <RB size={[0.44, 0.4, 0.03]} r={0.012} pos={[0, 0.7, -0.2]} rot={[0.1, 0, 0]} mat={mats.wood} shadows={shadows} />
      <RB size={[0.4, 0.03, 0.38]} r={0.01} pos={[0, 0.49, 0.01]} mat={mats.leather} shadows={shadows} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Tables & storage                                                     */
/* ------------------------------------------------------------------ */

export function CoffeeTable({ mats, shadows, round = false }: Base & { round?: boolean }) {
  if (round) {
    return (
      <group>
        <Cyl r={0.5} h={0.035} pos={[0, 0.4, 0]} mat={mats.wood} shadows={shadows} seg={36} />
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          return <Cyl key={i} r={0.02} h={0.4} pos={[Math.cos(a) * 0.3, 0.19, Math.sin(a) * 0.3]} rot={[Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18]} mat={mats.dark} shadows={shadows} seg={10} />;
        })}
        <Cyl r={0.09} h={0.1} pos={[0.12, 0.47, -0.08]} mat={mats.stone} shadows={shadows} seg={16} />
      </group>
    );
  }
  return (
    <group>
      <RB size={[1.2, 0.04, 0.6]} r={0.012} pos={[0, 0.4, 0]} mat={mats.wood} shadows={shadows} />
      <RB size={[1.1, 0.02, 0.5]} r={0.008} pos={[0, 0.14, 0]} mat={mats.woodDark} shadows={shadows} />
      <Legs w={1.16} d={0.56} h={0.4} r={0.016} inset={0.02} mat={mats.dark} shadows={shadows} />
      <RB size={[0.3, 0.025, 0.22]} r={0.006} pos={[-0.3, 0.435, 0.05]} mat={mats.bookB} shadows={shadows} />
    </group>
  );
}

export function DiningSet({ mats, shadows }: Base) {
  return (
    <group>
      <RB size={[1.5, 0.04, 0.9]} r={0.012} pos={[0, 0.74, 0]} mat={mats.wood} shadows={shadows} />
      <Legs w={1.42} d={0.82} h={0.72} r={0.025} inset={0.02} mat={mats.woodDark} shadows={shadows} />
      {[
        [-0.42, 0.62, Math.PI],
        [0.42, 0.62, Math.PI],
        [-0.42, -0.62, 0],
        [0.42, -0.62, 0],
      ].map(([x, z, ry], i) => (
        <group key={i} position={[x, 0, z]} rotation-y={ry}>
          <Chair mats={mats} shadows={shadows} />
        </group>
      ))}
      <Cyl r={0.06} h={0.18} pos={[0, 0.85, 0]} mat={mats.stone} shadows={shadows} seg={16} rTop={0.04} />
    </group>
  );
}

export function TVUnit({ mats, shadows }: Base) {
  return (
    <group>
      <RB size={[1.8, 0.42, 0.42]} r={0.012} pos={[0, 0.26, 0]} mat={mats.wood} shadows={shadows} />
      <Legs w={1.7} d={0.36} h={0.06} r={0.014} mat={mats.dark} shadows={shadows} />
      <RB size={[0.86, 0.34, 0.012]} r={0.004} pos={[-0.45, 0.26, 0.213]} mat={mats.woodDark} shadows={shadows} />
      <RB size={[0.86, 0.34, 0.012]} r={0.004} pos={[0.45, 0.26, 0.213]} mat={mats.woodDark} shadows={shadows} />
      <Handle pos={[-0.08, 0.26, 0.225]} mat={mats.metal} shadows={shadows} len={0.1} />
      <Handle pos={[0.08, 0.26, 0.225]} mat={mats.metal} shadows={shadows} len={0.1} />
      {/* television */}
      <RB size={[0.5, 0.02, 0.22]} r={0.005} pos={[0, 0.48, -0.03]} mat={mats.dark} shadows={shadows} />
      <RB size={[1.4, 0.8, 0.03]} r={0.008} pos={[0, 0.9, -0.08]} mat={mats.dark} shadows={shadows} />
      <RB size={[1.34, 0.74, 0.004]} r={0.002} pos={[0, 0.9, -0.062]} mat={mats.mirror} shadows={false} />
    </group>
  );
}

export function Rug({ mats, shadows, w = 3, d = 2 }: Base & { w?: number; d?: number }) {
  return (
    <group>
      <RB size={[w, 0.014, d]} r={0.004} pos={[0, 0.007, 0]} mat={mats.rugBorder} shadows={shadows} />
      <RB size={[w - 0.24, 0.012, d - 0.24]} r={0.004} pos={[0, 0.012, 0]} mat={mats.rug} shadows={shadows} />
    </group>
  );
}

export function FloorLamp({ mats, shadows, bulb }: Base) {
  return (
    <group>
      <Cyl r={0.15} h={0.02} pos={[0, 0.01, 0]} mat={mats.dark} shadows={shadows} seg={24} />
      <Cyl r={0.012} h={1.5} pos={[0, 0.76, 0]} mat={mats.metal} shadows={shadows} seg={10} />
      <Cyl r={0.2} rTop={0.13} h={0.3} pos={[0, 1.62, 0]} mat={mats.shade} shadows={shadows} seg={28} open />
      {bulb && (
        <mesh position={[0, 1.58, 0]} material={bulb}>
          <sphereGeometry args={[0.04, 12, 12]} />
        </mesh>
      )}
    </group>
  );
}

export function Bed({ mats, shadows, width = 1.7, length = 2.05 }: Base & { width?: number; length?: number }) {
  return (
    <group>
      <RB size={[width, 0.26, length]} r={0.02} pos={[0, 0.17, 0]} mat={mats.woodDark} shadows={shadows} />
      <Legs w={width - 0.1} d={length - 0.1} h={0.05} r={0.025} mat={mats.dark} shadows={shadows} />
      <RB size={[width - 0.08, 0.24, length - 0.08]} r={0.07} pos={[0, 0.41, 0]} mat={mats.mattress} shadows={shadows} />
      <RB size={[width + 0.02, 0.12, length * 0.62]} r={0.06} pos={[0, 0.58, length * 0.19]} mat={mats.duvet} shadows={shadows} />
      <RB size={[width + 0.02, 0.06, 0.1]} r={0.03} pos={[0, 0.55, length * 0.19 - length * 0.31 + 0.02]} mat={mats.duvet} shadows={shadows} />
      <RB size={[width * 0.4, 0.14, 0.44]} r={0.06} pos={[-width * 0.23, 0.6, -length / 2 + 0.36]} rot={[-0.2, 0, 0.02]} mat={mats.pillow} shadows={shadows} />
      <RB size={[width * 0.4, 0.14, 0.44]} r={0.06} pos={[width * 0.23, 0.6, -length / 2 + 0.36]} rot={[-0.2, 0, -0.02]} mat={mats.pillow} shadows={shadows} />
      <RB size={[width + 0.12, 0.98, 0.07]} r={0.02} pos={[0, 0.62, -length / 2 - 0.03]} mat={mats.wood} shadows={shadows} />
    </group>
  );
}

export function Nightstand({ mats, shadows, bulb, lamp = true }: Base & { lamp?: boolean }) {
  return (
    <group>
      <RB size={[0.48, 0.5, 0.42]} r={0.015} pos={[0, 0.29, 0]} mat={mats.wood} shadows={shadows} />
      <Legs w={0.42} d={0.36} h={0.08} r={0.014} mat={mats.dark} shadows={shadows} />
      <RB size={[0.42, 0.18, 0.012]} r={0.004} pos={[0, 0.4, 0.213]} mat={mats.woodDark} shadows={shadows} />
      <Handle pos={[0, 0.4, 0.225]} mat={mats.metal} shadows={shadows} len={0.08} />
      {lamp && (
        <group position={[0, 0.54, 0]}>
          <Cyl r={0.08} h={0.02} pos={[0, 0.01, 0]} mat={mats.dark} shadows={shadows} seg={18} />
          <Cyl r={0.012} h={0.26} pos={[0, 0.15, 0]} mat={mats.metal} shadows={shadows} seg={10} />
          <Cyl r={0.14} rTop={0.1} h={0.18} pos={[0, 0.34, 0]} mat={mats.shade} shadows={shadows} seg={24} open />
          {bulb && (
            <mesh position={[0, 0.32, 0]} material={bulb}>
              <sphereGeometry args={[0.03, 10, 10]} />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
}

export function Wardrobe({ mats, shadows, width = 2 }: Base & { width?: number }) {
  const n = Math.max(2, Math.round(width / 0.5));
  const pw = width / n - 0.02;
  return (
    <group>
      <RB size={[width, 2.2, 0.6]} r={0.01} pos={[0, 1.1, 0]} mat={mats.white} shadows={shadows} />
      <RB size={[width - 0.04, 0.08, 0.56]} r={0.004} pos={[0, 0.04, 0]} mat={mats.dark} shadows={shadows} />
      {Array.from({ length: n }, (_, i) => {
        const x = -width / 2 + pw / 2 + 0.01 + i * (width / n);
        const hx = i % 2 === 0 ? x + pw / 2 - 0.05 : x - pw / 2 + 0.05;
        return (
          <group key={i}>
            <RB size={[pw, 2.06, 0.02]} r={0.004} pos={[x, 1.13, 0.31]} mat={mats.white} shadows={shadows} />
            <Handle pos={[hx, 1.1, 0.33]} vertical mat={mats.metal} shadows={shadows} len={0.16} />
          </group>
        );
      })}
    </group>
  );
}

export function Desk({ mats, shadows, monitor = true, wide = false }: Base & { monitor?: boolean; wide?: boolean }) {
  const w = wide ? 1.6 : 1.3;
  return (
    <group>
      <RB size={[w, 0.04, 0.66]} r={0.012} pos={[0, 0.74, 0]} mat={mats.wood} shadows={shadows} />
      <RB size={[0.04, 0.72, 0.6]} r={0.006} pos={[-w / 2 + 0.05, 0.36, 0]} mat={mats.woodDark} shadows={shadows} />
      <RB size={[0.04, 0.72, 0.6]} r={0.006} pos={[w / 2 - 0.05, 0.36, 0]} mat={mats.woodDark} shadows={shadows} />
      <RB size={[w - 0.2, 0.04, 0.04]} r={0.006} pos={[0, 0.2, -0.25]} mat={mats.woodDark} shadows={shadows} />
      {monitor && (
        <group position={[0, 0.76, -0.16]}>
          <Cyl r={0.11} h={0.014} pos={[0, 0.007, 0]} mat={mats.dark} shadows={shadows} seg={20} />
          <RB size={[0.04, 0.24, 0.03]} r={0.006} pos={[0, 0.14, 0]} mat={mats.dark} shadows={shadows} />
          <RB size={[0.62, 0.36, 0.024]} r={0.006} pos={[0, 0.4, 0.01]} mat={mats.dark} shadows={shadows} />
          <RB size={[0.58, 0.32, 0.004]} r={0.002} pos={[0, 0.4, 0.024]} mat={mats.mirror} shadows={false} />
        </group>
      )}
      <RB size={[0.42, 0.014, 0.14]} r={0.004} pos={[0, 0.767, 0.12]} mat={mats.appliance} shadows={shadows} />
      <Cyl r={0.04} h={0.09} pos={[w / 2 - 0.2, 0.805, 0.08]} mat={mats.white} shadows={shadows} seg={14} />
    </group>
  );
}

const BOOK_COLORS: MatKey[] = ["bookA", "bookB", "bookC", "dark", "bookB", "bookA", "bookC", "woodDark"];

export function Bookshelf({ mats, shadows, width = 1.1 }: Base & { width?: number }) {
  const shelves = [0.05, 0.5, 0.95, 1.4, 1.85];
  return (
    <group>
      <RB size={[0.03, 2.0, 0.32]} r={0.004} pos={[-width / 2 + 0.015, 1.0, 0]} mat={mats.wood} shadows={shadows} />
      <RB size={[0.03, 2.0, 0.32]} r={0.004} pos={[width / 2 - 0.015, 1.0, 0]} mat={mats.wood} shadows={shadows} />
      <RB size={[width, 0.03, 0.32]} r={0.004} pos={[0, 1.985, 0]} mat={mats.wood} shadows={shadows} />
      <RB size={[width - 0.06, 0.012, 0.3]} r={0.002} pos={[0, 1.0, -0.15]} rot={[Math.PI / 2, 0, 0]} mat={mats.woodDark} shadows={shadows} />
      {shelves.map((y, si) => (
        <group key={si}>
          <RB size={[width - 0.06, 0.025, 0.3]} r={0.004} pos={[0, y, 0]} mat={mats.wood} shadows={shadows} />
          {si < shelves.length - 1 &&
            Array.from({ length: 7 + (si % 3) }, (_, bi) => {
              const bw = 0.03 + ((bi * 7 + si * 3) % 4) * 0.008;
              const bh = 0.2 + ((bi * 5 + si) % 5) * 0.025;
              const x = -width / 2 + 0.08 + bi * 0.058 + (si % 2) * 0.1;
              if (x > width / 2 - 0.08) return null;
              return <RB key={bi} size={[bw, bh, 0.2]} r={0.004} pos={[x, y + bh / 2 + 0.013, 0.02]} mat={mats[BOOK_COLORS[(bi + si) % BOOK_COLORS.length]]} shadows={shadows} />;
            })}
        </group>
      ))}
      <Cyl r={0.05} h={0.14} pos={[width / 2 - 0.16, shelves[3] + 0.08, 0.02]} mat={mats.stone} shadows={shadows} seg={14} rTop={0.035} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Kitchen                                                              */
/* ------------------------------------------------------------------ */

export function KitchenRun({ mats, shadows, length = 3.3 }: Base & { length?: number }) {
  const n = Math.round(length / 0.6);
  const dw = length / n - 0.02;
  return (
    <group>
      {/* base cabinets */}
      <RB size={[length, 0.86, 0.6]} r={0.01} pos={[0, 0.43, 0]} mat={mats.counter} shadows={shadows} />
      <RB size={[length - 0.02, 0.1, 0.52]} r={0.004} pos={[0, 0.05, -0.02]} mat={mats.dark} shadows={shadows} />
      {Array.from({ length: n }, (_, i) => {
        const x = -length / 2 + dw / 2 + 0.01 + i * (length / n);
        return (
          <group key={i}>
            <RB size={[dw, 0.7, 0.02]} r={0.004} pos={[x, 0.49, 0.31]} mat={mats.counter} shadows={shadows} />
            <Handle pos={[x, 0.78, 0.33]} mat={mats.tap} shadows={shadows} len={0.14} />
          </group>
        );
      })}
      {/* worktop + splashback */}
      <RB size={[length + 0.04, 0.04, 0.64]} r={0.008} pos={[0, 0.88, 0.01]} mat={mats.stone} shadows={shadows} />
      <RB size={[length, 0.55, 0.02]} r={0.004} pos={[0, 1.18, -0.3]} mat={mats.stone} shadows={shadows} />
      {/* wall cabinets (away from the window) */}
      <RB size={[length * 0.42, 0.7, 0.35]} r={0.01} pos={[-length * 0.29, 1.78, -0.125]} mat={mats.counter} shadows={shadows} />
      <RB size={[length * 0.2, 0.64, 0.02]} r={0.004} pos={[-length * 0.395, 1.78, 0.06]} mat={mats.counter} shadows={shadows} />
      <RB size={[length * 0.2, 0.64, 0.02]} r={0.004} pos={[-length * 0.185, 1.78, 0.06]} mat={mats.counter} shadows={shadows} />
      <Handle pos={[-length * 0.31, 1.52, 0.08]} vertical mat={mats.tap} shadows={shadows} len={0.12} />
      <Handle pos={[-length * 0.27, 1.52, 0.08]} vertical mat={mats.tap} shadows={shadows} len={0.12} />
      {/* hob + hood */}
      <RB size={[0.6, 0.012, 0.5]} r={0.004} pos={[-0.95, 0.906, 0]} mat={mats.dark} shadows={shadows} />
      {[
        [-1.1, -0.12],
        [-0.8, -0.12],
        [-1.1, 0.12],
        [-0.8, 0.12],
      ].map(([x, z], i) => (
        <Cyl key={i} r={0.075} h={0.006} pos={[x, 0.915, z]} mat={mats.metal} shadows={false} seg={20} />
      ))}
      <RB size={[0.62, 0.05, 0.42]} r={0.008} pos={[-0.95, 1.46, -0.08]} mat={mats.appliance} shadows={shadows} />
      <RB size={[0.3, 0.6, 0.26]} r={0.006} pos={[-0.95, 1.79, -0.16]} mat={mats.appliance} shadows={shadows} />
      {/* sink + tap */}
      <RB size={[0.56, 0.02, 0.42]} r={0.006} pos={[0.55, 0.9, 0.0]} mat={mats.dark} shadows={false} />
      <RB size={[0.5, 0.006, 0.36]} r={0.003} pos={[0.55, 0.905, 0.0]} mat={mats.metal} shadows={false} />
      <Spout mat={mats.tap} shadows={shadows} pos={[0.55, 0.9, -0.22]} />
    </group>
  );
}

export function Island({ mats, shadows }: Base) {
  return (
    <group>
      <RB size={[1.6, 0.86, 0.8]} r={0.01} pos={[0, 0.43, 0]} mat={mats.counter} shadows={shadows} />
      <RB size={[1.56, 0.1, 0.72]} r={0.004} pos={[0, 0.05, 0]} mat={mats.dark} shadows={shadows} />
      <RB size={[1.72, 0.04, 0.92]} r={0.008} pos={[0, 0.88, 0]} mat={mats.stone} shadows={shadows} />
      {[-0.4, 0.4].map((x) => (
        <group key={x} position={[x, 0, 0.68]}>
          <Cyl r={0.17} h={0.05} pos={[0, 0.68, 0]} mat={mats.leather} shadows={shadows} seg={24} />
          <Legs w={0.26} d={0.26} h={0.66} r={0.012} inset={0.02} mat={mats.metal} shadows={shadows} />
          <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.metal} castShadow={shadows}>
            <torusGeometry args={[0.13, 0.008, 6, 20]} />
          </mesh>
        </group>
      ))}
      <Cyl r={0.07} h={0.12} pos={[0.45, 0.96, -0.2]} mat={mats.stone} shadows={shadows} seg={16} rTop={0.05} />
    </group>
  );
}

export function Fridge({ mats, shadows }: Base) {
  return (
    <group>
      <RB size={[0.68, 1.86, 0.66]} r={0.02} pos={[0, 0.93, 0]} mat={mats.appliance} shadows={shadows} />
      <RB size={[0.66, 0.006, 0.02]} r={0.002} pos={[0, 1.25, 0.33]} mat={mats.dark} shadows={false} />
      <Handle pos={[-0.22, 1.5, 0.35]} vertical mat={mats.metal} shadows={shadows} len={0.4} />
      <Handle pos={[-0.22, 0.95, 0.35]} vertical mat={mats.metal} shadows={shadows} len={0.4} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Bathroom & hall                                                      */
/* ------------------------------------------------------------------ */

export function Bathtub({ mats, shadows }: Base) {
  return (
    <group>
      <RB size={[1.7, 0.58, 0.76]} r={0.07} pos={[0, 0.29, 0]} mat={mats.white} shadows={shadows} />
      <RB size={[1.5, 0.02, 0.56]} r={0.01} pos={[0, 0.58, 0]} mat={mats.glass} shadows={false} />
      <Spout mat={mats.tap} shadows={shadows} pos={[0.72, 0.58, 0]} scale={0.9} />
    </group>
  );
}

export function Toilet({ mats, shadows }: Base) {
  return (
    <group>
      <RB size={[0.4, 0.42, 0.18]} r={0.03} pos={[0, 0.62, -0.26]} mat={mats.white} shadows={shadows} />
      <Cyl r={0.12} h={0.26} pos={[0, 0.13, 0]} mat={mats.white} shadows={shadows} seg={20} rTop={0.16} />
      <mesh position={[0, 0.33, 0]} scale={[0.2, 0.12, 0.27]} material={mats.white} castShadow={shadows}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <RB size={[0.38, 0.03, 0.46]} r={0.015} pos={[0, 0.43, -0.02]} mat={mats.white} shadows={shadows} />
      <Cyl r={0.025} h={0.01} pos={[0, 0.835, -0.26]} mat={mats.metal} shadows={false} seg={12} />
    </group>
  );
}

export function Basin({ mats, shadows }: Base) {
  return (
    <group>
      <RB size={[0.5, 0.78, 0.9]} r={0.01} pos={[0, 0.41, 0]} mat={mats.wood} shadows={shadows} />
      <RB size={[0.02, 0.34, 0.84]} r={0.004} pos={[0.26, 0.6, 0]} mat={mats.woodDark} shadows={shadows} />
      <RB size={[0.02, 0.34, 0.84]} r={0.004} pos={[0.26, 0.24, 0]} mat={mats.woodDark} shadows={shadows} />
      <Handle pos={[0.28, 0.6, 0]} mat={mats.tap} shadows={shadows} len={0.14} />
      <Handle pos={[0.28, 0.24, 0]} mat={mats.tap} shadows={shadows} len={0.14} />
      <RB size={[0.54, 0.035, 0.94]} r={0.008} pos={[0, 0.82, 0]} mat={mats.stone} shadows={shadows} />
      <Cyl r={0.2} h={0.1} pos={[0.03, 0.88, 0]} mat={mats.white} shadows={shadows} seg={28} rTop={0.19} />
      <Cyl r={0.16} h={0.01} pos={[0.03, 0.925, 0]} mat={mats.glass} shadows={false} seg={28} />
      <Spout mat={mats.tap} shadows={shadows} pos={[-0.19, 0.84, 0]} scale={0.85} />
    </group>
  );
}

export function Mirror({ mats, shadows, w = 0.7, h = 0.8 }: Base & { w?: number; h?: number }) {
  return (
    <group>
      <RB size={[w, h, 0.025]} r={0.005} pos={[0, 0, 0]} mat={mats.dark} shadows={shadows} />
      <RB size={[w - 0.05, h - 0.05, 0.008]} r={0.002} pos={[0, 0, 0.016]} mat={mats.mirror} shadows={false} />
    </group>
  );
}

export function Console({ mats, shadows }: Base) {
  return (
    <group>
      <RB size={[0.9, 0.035, 0.3]} r={0.008} pos={[0, 0.8, 0]} mat={mats.wood} shadows={shadows} />
      <RB size={[0.03, 0.8, 0.26]} r={0.004} pos={[-0.4, 0.4, 0]} mat={mats.dark} shadows={shadows} />
      <RB size={[0.03, 0.8, 0.26]} r={0.004} pos={[0.4, 0.4, 0]} mat={mats.dark} shadows={shadows} />
      <RB size={[0.8, 0.03, 0.26]} r={0.004} pos={[0, 0.3, 0]} mat={mats.wood} shadows={shadows} />
      <Cyl r={0.06} h={0.22} pos={[-0.22, 0.93, 0]} mat={mats.stone} shadows={shadows} seg={16} rTop={0.045} />
      <RB size={[0.22, 0.03, 0.16]} r={0.006} pos={[0.2, 0.83, 0.02]} mat={mats.bookC} shadows={shadows} />
    </group>
  );
}

export function TowelRail({ mats, shadows }: Base) {
  return (
    <group>
      <Cyl r={0.012} h={0.6} rot={[0, 0, Math.PI / 2]} pos={[0, 0, 0.06]} mat={mats.tap} shadows={shadows} seg={10} />
      <Cyl r={0.014} h={0.06} rot={[Math.PI / 2, 0, 0]} pos={[-0.25, 0, 0.03]} mat={mats.tap} shadows={shadows} seg={10} />
      <Cyl r={0.014} h={0.06} rot={[Math.PI / 2, 0, 0]} pos={[0.25, 0, 0.03]} mat={mats.tap} shadows={shadows} seg={10} />
      <RB size={[0.36, 0.5, 0.05]} r={0.02} pos={[0.02, -0.24, 0.08]} mat={mats.duvet} shadows={shadows} />
    </group>
  );
}

/* ------------------------------------------------------------------ */

export function Furniture({ kind, props = {}, ...base }: Base & { kind: Kind; props?: Record<string, number | boolean | string> }) {
  const p = props as Record<string, never>;
  switch (kind) {
    case "sofa":
      return <Sofa {...base} {...p} />;
    case "armchair":
      return <Armchair {...base} />;
    case "coffeeTable":
      return <CoffeeTable {...base} {...p} />;
    case "diningSet":
      return <DiningSet {...base} />;
    case "tvUnit":
      return <TVUnit {...base} />;
    case "rug":
      return <Rug {...base} {...p} />;
    case "floorLamp":
      return <FloorLamp {...base} />;
    case "bed":
      return <Bed {...base} {...p} />;
    case "nightstand":
      return <Nightstand {...base} {...p} />;
    case "wardrobe":
      return <Wardrobe {...base} {...p} />;
    case "desk":
      return <Desk {...base} {...p} />;
    case "chair":
      return <Chair {...base} />;
    case "bookshelf":
      return <Bookshelf {...base} />;
    case "kitchenRun":
      return <KitchenRun {...base} {...p} />;
    case "island":
      return <Island {...base} />;
    case "fridge":
      return <Fridge {...base} />;
    case "bathtub":
      return <Bathtub {...base} />;
    case "toilet":
      return <Toilet {...base} />;
    case "basin":
      return <Basin {...base} />;
    case "mirror":
      return <Mirror {...base} {...p} />;
    case "console":
      return <Console {...base} />;
    case "towelRail":
      return <TowelRail {...base} />;
    default:
      return null;
  }
}

/** Hook: shared kit materials created once per scene. */
export function useFurnitureMaterials() {
  return useMemo(() => createFurnitureMaterials(), []);
}
