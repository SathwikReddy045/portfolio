"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import Mannequin from "../shared/Mannequin";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { lerp, range, smooth } from "@/lib/hooks";
import { themeColors } from "@/lib/theme";

interface Props {
  progressRef: RefObject<number>;
  active: boolean;
  isTouch: boolean;
  reduced: boolean;
}

const T = themeColors();
const ACCENT = new THREE.Color(T.accent);
const ROOM = { w: 6, d: 4.5, h: 2.8 };

/* ------------------------------------------------------------------ */
/* Shaders: bare surfaces that receive "projected" design content       */
/* ------------------------------------------------------------------ */

const surfVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const wallFrag = /* glsl */ `
  uniform float uProj;
  uniform float uTime;
  uniform float uBeam;
  uniform float uDim;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec3 N = normalize(vNormal);
    float l = 0.3 + 0.7 * max(dot(N, normalize(vec3(0.3, 0.85, 0.45))), 0.0);
    vec3 bare = vec3(0.17, 0.17, 0.18) * l * (1.0 - uDim * 0.55);

    float inBeam = smoothstep(0.04, 0.16, vUv.x) * smoothstep(0.96, 0.84, vUv.x) * smoothstep(0.0, 0.08, vUv.y) * smoothstep(0.99, 0.9, vUv.y);
    vec3 plaster = vec3(0.86, 0.79, 0.68);
    float win = step(0.56, vUv.x) * step(vUv.x, 0.86) * step(0.34, vUv.y) * step(vUv.y, 0.82);
    float frame = win * (step(0.985, fract(vUv.x * 6.6)) + step(0.985, fract(vUv.y * 4.2)));
    vec3 sky = vec3(0.98, 0.93, 0.80);
    vec3 content = mix(plaster, sky, win);
    content = mix(content, vec3(0.35, 0.3, 0.26), clamp(frame, 0.0, 1.0));
    float skirting = step(vUv.y, 0.05);
    content = mix(content, vec3(0.9, 0.88, 0.84), skirting);
    float scan = 0.95 + 0.05 * sin(vUv.y * 700.0 + uTime * 25.0);
    content *= scan;
    vec3 col = mix(bare, content * 1.1, uProj * inBeam * uBeam);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const floorFrag = /* glsl */ `
  uniform float uProj;
  uniform float uTime;
  uniform float uDim;
  varying vec2 vUv;
  void main() {
    vec3 bare = vec3(0.12, 0.12, 0.13) * (1.0 - uDim * 0.5);
    float inBeam = smoothstep(0.08, 0.3, vUv.x) * smoothstep(0.92, 0.7, vUv.x) * smoothstep(0.05, 0.3, vUv.y) * smoothstep(0.98, 0.75, vUv.y);
    float plank = step(0.975, fract(vUv.x * 14.0));
    float joint = step(0.985, fract(vUv.y * 5.0 + step(0.5, fract(vUv.x * 7.0)) * 0.5));
    vec3 wood = vec3(0.58, 0.42, 0.29) * (1.0 - plank * 0.35 - joint * 0.3);
    wood *= 0.9 + 0.1 * sin(vUv.x * 90.0);
    float scan = 0.95 + 0.05 * sin(vUv.y * 500.0 + uTime * 25.0);
    vec3 col = mix(bare, wood * scan, uProj * inBeam);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const beamVert = /* glsl */ `
  uniform float uLength;
  varying float vT;
  varying vec2 vUv;
  void main() {
    vT = clamp(-position.y / uLength, 0.0, 1.0);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const beamFrag = /* glsl */ `
  uniform float uIntensity;
  uniform vec3 uColor;
  uniform float uTime;
  varying float vT;
  varying vec2 vUv;
  void main() {
    float edge = abs(fract(vUv.x * 4.0) - 0.5) * 2.0;
    float a = pow(1.0 - vT, 1.8) * 0.5 + 0.02 + edge * edge * 0.08 * (1.0 - vT);
    a *= uIntensity * (0.94 + 0.06 * sin(uTime * 28.0));
    gl_FragColor = vec4(uColor * a, a);
  }
`;

/* ------------------------------------------------------------------ */

function bar(a: THREE.Vector3, b: THREE.Vector3, r = 0.01) {
  const d = b.clone().sub(a);
  const len = d.length();
  const g = new THREE.CylinderGeometry(r, r, len, 6);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  g.translate(a.x, a.y, a.z);
  return g;
}

/** Triangular lattice truss along x, like a stage lighting rig. */
function Truss({ length, position, material }: { length: number; position: [number, number, number]; material: THREE.Material }) {
  const geo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const chords: [number, number][] = [
      [0.12, -0.1],
      [0.12, 0.1],
      [-0.1, 0],
    ];
    for (const [y, z] of chords) {
      const g = new THREE.CylinderGeometry(0.016, 0.016, length, 8);
      g.rotateZ(Math.PI / 2);
      g.translate(0, y, z);
      parts.push(g);
    }
    const n = Math.max(2, Math.round(length / 0.45));
    for (let i = 0; i <= n; i++) {
      const x0 = -length / 2 + (i * length) / n;
      const x1 = x0 + length / n;
      if (i < n) {
        parts.push(bar(new THREE.Vector3(x0, -0.1, 0), new THREE.Vector3(x1, 0.12, -0.1)));
        parts.push(bar(new THREE.Vector3(x0, -0.1, 0), new THREE.Vector3(x1, 0.12, 0.1)));
      }
      parts.push(bar(new THREE.Vector3(x0, 0.12, -0.1), new THREE.Vector3(x0, 0.12, 0.1)));
    }
    const merged = mergeGeometries(parts, false)!;
    parts.forEach((g) => g.dispose());
    return merged;
  }, [length]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={material} position={position} />;
}

function Projector({ material, lens, vent, tilt = 0 }: { material: THREE.Material; lens: THREE.Material; vent: THREE.Material; tilt?: number }) {
  return (
    <group>
      <mesh material={material} position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
      </mesh>
      <mesh material={material} position={[0, 0.085, 0]}>
        <boxGeometry args={[0.18, 0.02, 0.14]} />
      </mesh>
      <group rotation-x={tilt}>
        <RoundedBox args={[0.38, 0.11, 0.32]} radius={0.016} smoothness={3} material={material} />
        {[-0.12, -0.06, 0, 0.06, 0.12].map((x) => (
          <mesh key={x} material={vent} position={[x, 0.056, 0.05]}>
            <boxGeometry args={[0.03, 0.002, 0.14]} />
          </mesh>
        ))}
        <mesh material={material} position={[0.09, -0.005, -0.175]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.046, 0.052, 0.05, 24]} />
        </mesh>
        <mesh material={lens} position={[0.09, -0.005, -0.202]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.03, 0.03, 0.006, 24]} />
        </mesh>
      </group>
    </group>
  );
}

function Beam({ from, to, radius, shared }: { from: THREE.Vector3; to: THREE.Vector3; radius: number; shared: { uIntensity: { value: number }; uTime: { value: number } } }) {
  const { geometry, material, quaternion, length } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(to, from);
    const length = dir.length();
    dir.normalize();
    const geometry = new THREE.ConeGeometry(radius, length, 4, 1, true, Math.PI / 4);
    geometry.translate(0, -length / 2, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
    const material = new THREE.ShaderMaterial({
      vertexShader: beamVert,
      fragmentShader: beamFrag,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uLength: { value: length },
        uIntensity: shared.uIntensity,
        uTime: shared.uTime,
        uColor: { value: ACCENT },
      },
    });
    return { geometry, material, quaternion, length };
  }, [from, to, radius, shared]);
  void length;
  return <mesh geometry={geometry} material={material} position={from} quaternion={quaternion} />;
}

function Scene({ progressRef, reduced }: Props) {
  const { camera, size } = useThree();
  const target = useRef(reduced ? 1 : 0);
  const current = useRef(reduced ? 1 : 0);

  const uniforms = useMemo(
    () => ({
      uProj: { value: 0 },
      uTime: { value: 0 },
      uDim: { value: 0 },
      uIntensity: { value: 0 },
    }),
    [],
  );

  const wallMat = (beam: number) =>
    new THREE.ShaderMaterial({
      vertexShader: surfVert,
      fragmentShader: wallFrag,
      uniforms: { uProj: uniforms.uProj, uTime: uniforms.uTime, uDim: uniforms.uDim, uBeam: { value: beam } },
    });
  const mats = useMemo(
    () => ({
      back: wallMat(1),
      side: wallMat(0.55),
      floor: new THREE.ShaderMaterial({
        vertexShader: surfVert,
        fragmentShader: floorFrag,
        uniforms: { uProj: uniforms.uProj, uTime: uniforms.uTime, uDim: uniforms.uDim },
      }),
      lines: new THREE.LineBasicMaterial({ color: "#ecebe6", transparent: true, opacity: 0.8 }),
      accentLines: new THREE.LineBasicMaterial({ color: T.accent, transparent: true, opacity: 0.9 }),
      dark: new THREE.MeshStandardMaterial({ color: "#232326", roughness: 0.8, metalness: 0.2 }),
      projector: new THREE.MeshStandardMaterial({ color: "#2b2b30", roughness: 0.45, metalness: 0.35 }),
      vent: new THREE.MeshStandardMaterial({ color: "#121214", roughness: 0.6 }),
      figure: new THREE.MeshStandardMaterial({ color: "#1b1b1e", roughness: 0.95 }),
      lens: new THREE.MeshBasicMaterial({ color: T.accent }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Wall geometries with pivot at the floor
  const geo = useMemo(() => {
    const mk = (w: number, h: number, d: number) => {
      const g = new THREE.BoxGeometry(w, h, d);
      g.translate(0, h / 2, 0);
      return g;
    };
    return {
      back: mk(ROOM.w, ROOM.h, 0.15),
      side: mk(0.15, ROOM.h, ROOM.d),
      floor: new THREE.PlaneGeometry(ROOM.w, ROOM.d),
    };
  }, []);

  // Floorplan lines: wall footprints, dimension lines, a door swing
  const plan = useMemo(() => {
    const pts: number[] = [];
    const rect = (x0: number, z0: number, x1: number, z1: number) => {
      pts.push(x0, 0, z0, x1, 0, z0, x1, 0, z0, x1, 0, z1, x1, 0, z1, x0, 0, z1, x0, 0, z1, x0, 0, z0);
    };
    const hw = ROOM.w / 2;
    const hd = ROOM.d / 2;
    rect(-hw - 0.15, -hd - 0.15, hw + 0.15, -hd); // back wall footprint
    rect(-hw - 0.15, -hd, -hw, hd); // left
    rect(hw, -hd, hw + 0.15, hd); // right
    // dimension lines
    const y = 0.002;
    pts.push(-hw, y, hd + 0.6, hw, y, hd + 0.6, -hw, y, hd + 0.45, -hw, y, hd + 0.75, hw, y, hd + 0.45, hw, y, hd + 0.75);
    pts.push(hw + 0.8, y, -hd, hw + 0.8, y, hd, hw + 0.65, y, -hd, hw + 0.95, y, -hd, hw + 0.65, y, hd, hw + 0.95, y, hd);
    // door swing on the right wall
    const cx = hw;
    const cz = 1.2;
    for (let i = 0; i < 12; i++) {
      const a0 = Math.PI + (i / 12) * (Math.PI / 2);
      const a1 = Math.PI + ((i + 1) / 12) * (Math.PI / 2);
      pts.push(cx + Math.cos(a0) * 0.9, y, cz + Math.sin(a0) * 0.9, cx + Math.cos(a1) * 0.9, y, cz + Math.sin(a1) * 0.9);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));

    // 0.5 m grid
    const grid: number[] = [];
    for (let x = -hw; x <= hw + 0.001; x += 0.5) grid.push(x, 0.001, -hd, x, 0.001, hd);
    for (let z = -hd; z <= hd + 0.001; z += 0.5) grid.push(-hw, 0.001, z, hw, 0.001, z);
    const gg = new THREE.BufferGeometry();
    gg.setAttribute("position", new THREE.Float32BufferAttribute(grid, 3));
    const gridMat = new THREE.LineBasicMaterial({ color: "#ecebe6", transparent: true, opacity: 0.12 });
    return { g, gg, gridMat };
  }, []);

  const projectors = useMemo(() => {
    const lensLocal = new THREE.Vector3(0.09, -0.005, -0.205);
    const mk = (pos: THREE.Vector3, to: THREE.Vector3, radius: number, tilt: number) => {
      const lens = lensLocal.clone().applyEuler(new THREE.Euler(tilt, 0, 0)).add(pos);
      return { pos, from: lens, to, radius, tilt };
    };
    return [
      mk(new THREE.Vector3(-1.5, 2.92, 1.7), new THREE.Vector3(-1.5, 1.35, -ROOM.d / 2), 2.3, 0.3),
      mk(new THREE.Vector3(1.5, 2.92, 1.7), new THREE.Vector3(1.5, 1.35, -ROOM.d / 2), 2.3, 0.3),
      mk(new THREE.Vector3(0, 2.92, 0.4), new THREE.Vector3(0, 0, -0.4), 2.6, 1.15),
    ];
  }, []);

  const backRef = useRef<THREE.Mesh>(null);
  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);
  const planRef = useRef<THREE.LineSegments>(null);
  const gridRef = useRef<THREE.LineSegments>(null);
  const rigRef = useRef<THREE.Group>(null);
  const figureRef = useRef<THREE.Group>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  const keys = useMemo(
    () => [
      { s: 0, pos: new THREE.Vector3(0, 13.2, 3.4), look: new THREE.Vector3(0, 0, 0.2), fov: 30 },
      { s: 1.2, pos: new THREE.Vector3(6.8, 6.4, 8.6), look: new THREE.Vector3(0, 1.1, 0), fov: 34 },
      { s: 2.4, pos: new THREE.Vector3(4.6, 3.8, 7.0), look: new THREE.Vector3(0, 1.2, -0.7), fov: 36 },
      { s: 3.6, pos: new THREE.Vector3(0.55, 1.6, 2.3), look: new THREE.Vector3(-0.3, 1.45, -ROOM.d / 2), fov: 56 },
    ],
    [],
  );
  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpLook = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    target.current = reduced ? 1 : progressRef.current ?? 0;
    current.current = lerp(current.current, target.current, 1 - Math.pow(0.0008, dt));
    const s = current.current * 4;

    const extrude = smooth(range(s, 0.85, 1.9));
    const proj = smooth(range(s, 1.95, 2.85));
    const eye = smooth(range(s, 2.95, 3.7));

    uniforms.uTime.value = t;
    uniforms.uProj.value = proj;
    uniforms.uDim.value = proj;
    uniforms.uIntensity.value = proj * (1 - eye * 0.35);

    if (backRef.current) backRef.current.scale.y = 0.001 + smooth(range(s, 0.85, 1.55));
    if (leftRef.current) leftRef.current.scale.y = 0.001 + smooth(range(s, 1.05, 1.75));
    if (rightRef.current) rightRef.current.scale.y = 0.001 + smooth(range(s, 1.15, 1.9));
    mats.lines.opacity = 0.85 - extrude * 0.72 - proj * 0.13;
    plan.gridMat.opacity = 0.12 * (1 - extrude);
    if (rigRef.current) {
      const k = smooth(range(s, 1.7, 2.3));
      rigRef.current.position.y = (1 - k) * 1.2;
      rigRef.current.visible = k > 0.001;
      rigRef.current.scale.setScalar(0.001 + k);
    }
    if (figureRef.current) {
      const k = smooth(range(s, 3.0, 3.5));
      figureRef.current.visible = k > 0.001;
      figureRef.current.scale.setScalar(0.001 + k);
    }
    if (ambientRef.current) ambientRef.current.intensity = 0.55 - proj * 0.3;

    // camera along keyframes
    let i = 0;
    while (i < keys.length - 2 && s > keys[i + 1].s) i++;
    const a = keys[i];
    const b = keys[i + 1];
    const k = smooth(range(s, a.s, b.s));
    tmpPos.lerpVectors(a.pos, b.pos, k);
    tmpLook.lerpVectors(a.look, b.look, k);
    // Widen the view on portrait canvases so the room stays in frame.
    const aspect = size.width / Math.max(1, size.height);
    const boost = aspect < 1 ? Math.min(1.6, 0.78 / aspect) : 1;
    const fov = lerp(a.fov, b.fov, k) * Math.max(1, boost);
    // subtle handheld sway at eye level
    const sway = eye * (reduced ? 0 : 1);
    tmpPos.x += Math.sin(t * 0.6) * 0.03 * sway;
    tmpPos.y += Math.sin(t * 0.9) * 0.015 * sway;
    camera.position.copy(tmpPos);
    camera.lookAt(tmpLook);
    const pc = camera as THREE.PerspectiveCamera;
    if (Math.abs(pc.fov - fov) > 0.01) {
      pc.fov = fov;
      pc.updateProjectionMatrix();
    }
  });

  const hd = ROOM.d / 2;
  const hw = ROOM.w / 2;

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.55} />
      <directionalLight position={[3, 6, 4]} intensity={0.7} />

      {/* floor + plan */}
      <mesh geometry={geo.floor} material={mats.floor} rotation-x={-Math.PI / 2} />
      <lineSegments ref={gridRef} geometry={plan.gg} material={plan.gridMat} />
      <lineSegments ref={planRef} geometry={plan.g} material={mats.lines} />

      {/* walls */}
      <mesh ref={backRef} geometry={geo.back} material={mats.back} position={[0, 0, -hd - 0.075]} />
      <mesh ref={leftRef} geometry={geo.side} material={mats.side} position={[-hw - 0.075, 0, 0]} />
      <mesh ref={rightRef} geometry={geo.side} material={mats.side} position={[hw + 0.075, 0, 0]} />

      {/* projector rig: lattice truss + three mounted projectors */}
      <group ref={rigRef}>
        <Truss length={ROOM.w + 0.8} position={[0, 3.2, 1.7]} material={mats.projector} />
        <Truss length={1.8} position={[0, 3.2, 0.4]} material={mats.projector} />
        {projectors.map((p, i) => (
          <group key={i}>
            <group position={p.pos}>
              <Projector material={mats.projector} lens={mats.lens} vent={mats.vent} tilt={p.tilt} />
            </group>
            <Beam from={p.from} to={p.to} radius={p.radius} shared={uniforms} />
          </group>
        ))}
      </group>

      {/* scale figure */}
      <group ref={figureRef} position={[-1.7, 0, -1.5]} rotation-y={0.5}>
        <Mannequin material={mats.figure} />
      </group>
    </>
  );
}

export default function SpaceCanvas(props: Props) {
  return (
    <Canvas
      dpr={[1, props.isTouch ? 1.5 : 1.75]}
      camera={{ fov: 30, near: 0.1, far: 80, position: [0, 13.2, 3.4] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={props.active ? "always" : "never"}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ position: "absolute", inset: 0 }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
