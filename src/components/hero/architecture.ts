import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Box with its pivot on the bottom face, positioned in world units (metres). */
function box(w: number, h: number, d: number, x: number, y: number, z: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y + h / 2, z);
  return g;
}

/**
 * Procedural two-storey pavilion: slabs, a column grid, partial walls,
 * a stair, a glazed facade of mullions and a cantilevered balcony.
 * Returns one merged solid geometry plus its edge geometry.
 */
export function buildArchitecture() {
  const parts: THREE.BufferGeometry[] = [];

  // Ground slab and plinth
  parts.push(box(12, 0.25, 8, 0, -0.25, 0));
  parts.push(box(14, 0.12, 10, 0, -0.37, 0));

  // Ground-floor column grid 5 x 3
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 3; j++) {
      parts.push(box(0.26, 3.2, 0.26, -6 + i * 3, 0, -3 + j * 3));
    }
  }

  // First-floor slab
  parts.push(box(12, 0.25, 8, 0, 3.2, 0));

  // First-floor columns along both long edges
  for (let i = 0; i < 5; i++) {
    parts.push(box(0.26, 3, 0.26, -6 + i * 3, 3.45, -3));
    parts.push(box(0.26, 3, 0.26, -6 + i * 3, 3.45, 3));
  }

  // Roof slab with a small overhang
  parts.push(box(12.8, 0.22, 8.8, 0, 6.45, 0));

  // Partial walls
  parts.push(box(0.2, 3.2, 5.6, -6, 0, 0.2)); // ground: left wall
  parts.push(box(5.6, 3.2, 0.2, -3.2, 0, -3)); // ground: back wall segment
  parts.push(box(0.2, 3.2, 3.2, 1.5, 0, -1.4)); // ground: core wall
  parts.push(box(0.2, 3, 4.4, 6, 3.45, -0.8)); // upper: right wall
  parts.push(box(3.6, 3, 0.2, 3.2, 3.45, 3)); // upper: front wall segment
  parts.push(box(4.2, 3, 0.2, -3.9, 3.45, -3)); // upper: back wall segment

  // Glazed facade mullions (ground floor, front)
  for (let i = 0; i <= 10; i++) {
    parts.push(box(0.06, 3.2, 0.06, -6 + i * 1.2, 0, 3));
  }
  parts.push(box(12, 0.06, 0.06, 0, 1.6, 3)); // transom

  // Stair: 12 risers from ground to first-floor slab
  for (let s = 0; s < 12; s++) {
    parts.push(box(1.1, 0.27, 0.3, 4.2, s * 0.27, 2.2 - s * 0.3));
  }
  parts.push(box(0.06, 1.0, 3.7, 3.65, 3.2, 0.5)); // stair guard

  // Cantilevered balcony with railing posts
  parts.push(box(4.2, 0.2, 2.4, 3.9, 3.25, 5.2));
  for (let i = 0; i <= 6; i++) {
    parts.push(box(0.05, 1.05, 0.05, 1.8 + i * 0.7, 3.45, 6.35));
  }
  parts.push(box(4.2, 0.05, 0.05, 3.9, 4.5, 6.35));

  // Roof-top light monitor
  parts.push(box(3, 1.2, 2, -2.5, 6.67, -0.5));

  const solid = mergeGeometries(parts, false);
  if (!solid) throw new Error("Failed to merge architecture geometry");
  solid.computeBoundingBox();
  const edges = new THREE.EdgesGeometry(solid, 20);
  parts.forEach((p) => p.dispose());
  return { solid, edges };
}
