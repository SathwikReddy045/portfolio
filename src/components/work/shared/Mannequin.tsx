"use client";

import * as THREE from "three";

type V3 = [number, number, number];

function Cap({ r, l, pos, rot, material, castShadow }: { r: number; l: number; pos: V3; rot?: V3; material: THREE.Material; castShadow: boolean }) {
  return (
    <mesh position={pos} rotation={rot} material={material} castShadow={castShadow}>
      <capsuleGeometry args={[r, l, 4, 12]} />
    </mesh>
  );
}

/**
 * Articulated scale figure (1.75 m) in the style of architectural
 * visualization silhouettes: head, neck, torso, pelvis, jointed arms and
 * legs in a relaxed walking pose. Matte and anonymous by design.
 */
export default function Mannequin({
  material,
  scale = 1,
  walking = true,
  castShadow = false,
}: {
  material: THREE.Material;
  scale?: number;
  walking?: boolean;
  castShadow?: boolean;
}) {
  const armSwing: [number, number][] = walking
    ? [
        [-0.22, 0.38],
        [0.22, -0.32],
      ]
    : [
        [-0.22, 0.04],
        [0.22, -0.04],
      ];
  const legSwing: [number, number][] = walking
    ? [
        [-0.1, 0.3],
        [0.1, -0.3],
      ]
    : [
        [-0.1, 0],
        [0.1, 0],
      ];

  return (
    <group scale={scale}>
      <mesh position={[0, 1.63, 0]} material={material} castShadow={castShadow}>
        <sphereGeometry args={[0.11, 18, 18]} />
      </mesh>
      <Cap r={0.04} l={0.05} pos={[0, 1.49, 0]} material={material} castShadow={castShadow} />
      <mesh position={[0, 1.2, 0]} scale={[1.1, 1, 0.62]} material={material} castShadow={castShadow}>
        <capsuleGeometry args={[0.14, 0.4, 4, 14]} />
      </mesh>
      <mesh position={[0, 0.94, 0]} scale={[1, 0.8, 0.7]} material={material} castShadow={castShadow}>
        <capsuleGeometry args={[0.13, 0.1, 4, 14]} />
      </mesh>

      {armSwing.map(([x, a], i) => (
        <group key={i} position={[x * 0.95, 1.42, 0]} rotation={[a, 0, x < 0 ? 0.1 : -0.1]}>
          <Cap r={0.04} l={0.26} pos={[0, -0.17, 0]} material={material} castShadow={castShadow} />
          <group position={[0, -0.33, 0]} rotation={[-0.4, 0, 0]}>
            <Cap r={0.035} l={0.24} pos={[0, -0.15, 0]} material={material} castShadow={castShadow} />
            <mesh position={[0, -0.32, 0]} material={material} castShadow={castShadow}>
              <sphereGeometry args={[0.05, 10, 10]} />
            </mesh>
          </group>
        </group>
      ))}

      {legSwing.map(([x, a], i) => (
        <group key={i} position={[x, 0.9, 0]} rotation={[a, 0, 0]}>
          <Cap r={0.064} l={0.34} pos={[0, -0.24, 0]} material={material} castShadow={castShadow} />
          <group position={[0, -0.46, 0]} rotation={[a > 0 ? -0.08 : 0.28, 0, 0]}>
            <Cap r={0.052} l={0.32} pos={[0, -0.23, 0]} material={material} castShadow={castShadow} />
            <mesh position={[0, -0.43, 0.05]} material={material} castShadow={castShadow}>
              <boxGeometry args={[0.1, 0.06, 0.26]} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
