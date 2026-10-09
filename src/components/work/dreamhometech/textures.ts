import * as THREE from "three";
import type { FloorKind } from "@/lib/store";

const cache = new Map<string, THREE.CanvasTexture>();

/** Deterministic pseudo-random so textures look the same on every visit. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hsl(h: number, s: number, l: number) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Procedural floor textures drawn on a canvas at runtime: oak and walnut
 * planks, polished concrete and ceramic tile. One canvas per kind.
 */
export function floorTexture(kind: FloorKind): THREE.CanvasTexture {
  const hit = cache.get(kind);
  if (hit) return hit;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rand = rng(kind.length * 7919);

  if (kind === "oak" || kind === "walnut") {
    const base = kind === "oak" ? { h: 32, s: 38, l: 58 } : { h: 22, s: 34, l: 27 };
    ctx.fillStyle = hsl(base.h, base.s, base.l);
    ctx.fillRect(0, 0, size, size);
    const plankW = 64;
    const plankL = 384;
    for (let col = 0; col < size / plankW; col++) {
      const offset = (col % 2) * (plankL / 2) + Math.floor(rand() * 60);
      for (let y = -plankL; y < size + plankL; y += plankL) {
        const py = y + offset;
        const l = base.l + (rand() - 0.5) * 10;
        ctx.fillStyle = hsl(base.h + (rand() - 0.5) * 6, base.s + (rand() - 0.5) * 8, l);
        ctx.fillRect(col * plankW, py, plankW, plankL);
        // grain
        ctx.strokeStyle = `rgba(0,0,0,${kind === "oak" ? 0.08 : 0.14})`;
        ctx.lineWidth = 1;
        for (let g = 0; g < 7; g++) {
          const gx = col * plankW + 6 + rand() * (plankW - 12);
          ctx.beginPath();
          ctx.moveTo(gx, py);
          for (let yy = py; yy < py + plankL; yy += 24) {
            ctx.lineTo(gx + Math.sin(yy * 0.05 + g) * 2.5, yy);
          }
          ctx.stroke();
        }
        // joint
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(col * plankW, py, plankW, 2);
      }
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(col * plankW, 0, 2, size);
    }
  } else if (kind === "concrete") {
    ctx.fillStyle = hsl(40, 4, 62);
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 9000; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = rand() * 2.2;
      ctx.fillStyle = `rgba(${rand() > 0.5 ? 255 : 0},${rand() > 0.5 ? 255 : 0},${rand() > 0.5 ? 255 : 0},${rand() * 0.05})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 60; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 40 + rand() * 80);
      g.addColorStop(0, `rgba(0,0,0,${0.03 + rand() * 0.05})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();
  } else {
    // tile
    ctx.fillStyle = hsl(30, 6, 48);
    ctx.fillRect(0, 0, size, size);
    const n = 4;
    const tw = size / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = hsl(40 + (rand() - 0.5) * 6, 10, 82 + (rand() - 0.5) * 5);
        ctx.fillRect(i * tw + 3, j * tw + 3, tw - 6, tw - 6);
        const g = ctx.createLinearGradient(i * tw, j * tw, i * tw + tw, j * tw + tw);
        g.addColorStop(0, "rgba(255,255,255,0.08)");
        g.addColorStop(1, "rgba(0,0,0,0.06)");
        ctx.fillStyle = g;
        ctx.fillRect(i * tw + 3, j * tw + 3, tw - 6, tw - 6);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  cache.set(kind, tex);
  return tex;
}

/** Metres covered by one texture tile. */
export const TEXTURE_METRES: Record<FloorKind, number> = {
  oak: 1.1,
  walnut: 1.1,
  concrete: 2.4,
  tile: 1.2,
};
