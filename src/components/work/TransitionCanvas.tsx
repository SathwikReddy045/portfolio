"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { prepareShapes, type Seg3, type ShapeKind } from "./transitionShapes";
import { clamp, lerp, range, smooth } from "@/lib/hooks";
import { themeColors } from "@/lib/theme";

interface Props {
  from: ShapeKind;
  to: ShapeKind;
  progressRef: RefObject<number>;
  active: boolean;
  isTouch: boolean;
  reduced: boolean;
}

const T = themeColors();
const INK = new THREE.Color("#ecebe6"); // dark stage insert: lines stay light on every palette
const ACC = new THREE.Color(T.accent);

const pointVert = /* glsl */ `
  attribute float aLocal;
  uniform float uPixelRatio;
  varying float vA;
  void main() {
    vA = aLocal;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.5 + 3.5 * aLocal) * uPixelRatio * (16.0 / -mv.z);
  }
`;
const pointFrag = /* glsl */ `
  uniform vec3 uColor;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.12, d) * vA;
    gl_FragColor = vec4(uColor, a);
  }
`;

interface LineModel {
  n: number;
  geometry: LineSegmentsGeometry;
  core: LineMaterial;
  glow: LineMaterial;
  coreObj: LineSegments2;
  glowObj: LineSegments2;
  pos: THREE.InterleavedBuffer;
  col: THREE.InterleavedBuffer;
}

/** A line model drawn with a crisp core pass and a soft additive glow pass. */
function makeLineModel(segs: Seg3[], resolution: THREE.Vector2): LineModel {
  const n = segs.length;
  const geometry = new LineSegmentsGeometry();
  geometry.setPositions(new Float32Array(n * 6));
  geometry.setColors(new Float32Array(n * 6));
  const core = new LineMaterial({ linewidth: 1.25, vertexColors: true, transparent: true, opacity: 0.9 });
  const glow = new LineMaterial({ linewidth: 5.5, vertexColors: true, transparent: true, opacity: 0.09, depthTest: false, blending: THREE.AdditiveBlending });
  core.resolution = resolution;
  glow.resolution = resolution;
  const coreObj = new LineSegments2(geometry, core);
  const glowObj = new LineSegments2(geometry, glow);
  coreObj.frustumCulled = false;
  glowObj.frustumCulled = false;
  glowObj.renderOrder = -1;
  const posAttr = geometry.attributes.instanceStart as THREE.InterleavedBufferAttribute;
  const colAttr = geometry.attributes.instanceColorStart as THREE.InterleavedBufferAttribute;
  return { n, geometry, core, glow, coreObj, glowObj, pos: posAttr.data, col: colAttr.data };
}

const tmpColor = new THREE.Color();

function writeModel(L: LineModel, segs: Seg3[], scanX: number, incoming: boolean, t: number) {
  const pos = L.pos.array as Float32Array;
  const col = L.col.array as Float32Array;
  const band = 0.9;
  for (let i = 0; i < L.n; i++) {
    const s = segs[i];
    const mx = (s[0] + s[3]) / 2;
    const my = (s[1] + s[4]) / 2;
    const mz = (s[2] + s[5]) / 2;
    // 0 = the plane has not reached this segment yet, 1 = it has passed
    const passed = smooth(clamp((scanX - mx + band / 2) / band));
    const grow = incoming ? passed : 1 - passed;
    const near = 1 - clamp(Math.abs(scanX - mx) / 1.4);
    const transit = near * near;
    const lift = transit * 0.22 * (0.6 + 0.4 * Math.sin(t * 3 + mx * 2.1 + mz));
    const o = i * 6;
    pos[o] = mx + (s[0] - mx) * grow;
    pos[o + 1] = my + (s[1] - my) * grow + lift;
    pos[o + 2] = mz + (s[2] - mz) * grow;
    pos[o + 3] = mx + (s[3] - mx) * grow;
    pos[o + 4] = my + (s[4] - my) * grow + lift;
    pos[o + 5] = mz + (s[5] - mz) * grow;
    tmpColor.copy(INK).lerp(ACC, transit);
    col[o] = tmpColor.r;
    col[o + 1] = tmpColor.g;
    col[o + 2] = tmpColor.b;
    col[o + 3] = tmpColor.r;
    col[o + 4] = tmpColor.g;
    col[o + 5] = tmpColor.b;
  }
  L.pos.needsUpdate = true;
  L.col.needsUpdate = true;
}

/**
 * Scan-plane transformation: a plane sweeps through the model. Every segment
 * of the outgoing structure collapses to its midpoint as the plane passes and
 * every segment of the incoming structure grows out of its midpoint behind it.
 * Lines near the plane lift and glow; particles mark the front. Both
 * structures stay legible before and after.
 */
function Scene({ from, to, progressRef, reduced }: Props) {
  const { camera, size, gl } = useThree();
  const model = useMemo(() => prepareShapes(from, to), [from, to]);
  const resolution = useMemo(() => new THREE.Vector2(1, 1), []);
  const A = useMemo(() => makeLineModel(model.A, resolution), [model, resolution]);
  const B = useMemo(() => makeLineModel(model.B, resolution), [model, resolution]);

  const points = useMemo(() => {
    const n = 900;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute("aLocal", new THREE.BufferAttribute(new Float32Array(n), 1));
    const seeds = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) seeds[i] = Math.random();
    const m = new THREE.ShaderMaterial({
      vertexShader: pointVert,
      fragmentShader: pointFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uPixelRatio: { value: 1 }, uColor: { value: ACC.clone().multiplyScalar(1.1) } },
    });
    const p = new THREE.Points(g, m);
    p.frustumCulled = false;
    return { n, g, m, p, seeds };
  }, []);

  useEffect(() => {
    resolution.set(size.width, size.height);
    points.m.uniforms.uPixelRatio.value = gl.getPixelRatio();
  }, [size, gl, resolution, points]);

  useEffect(() => {
    return () => {
      for (const L of [A, B]) {
        L.geometry.dispose();
        L.core.dispose();
        L.glow.dispose();
      }
      points.g.dispose();
      points.m.dispose();
    };
  }, [A, B, points]);

  const planeRef = useRef<THREE.Mesh>(null);
  const edgeRef = useRef<THREE.Mesh>(null);
  const planeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: ACC, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }), []);
  const edgeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: ACC, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  const cur = useRef(reduced ? 1 : 0);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const target = reduced ? 1 : progressRef.current ?? 0;
    cur.current = lerp(cur.current, target, 1 - Math.pow(0.0008, dt));
    const p = cur.current;
    const q = smooth(range(p, 0.08, 0.92));
    const scanX = lerp(model.minX - 1.2, model.maxX + 1.2, q);

    writeModel(A, model.A, scanX, false, t);
    writeModel(B, model.B, scanX, true, t);

    // particles scatter along segments at the front
    const pPos = points.g.attributes.position.array as Float32Array;
    const pLoc = points.g.attributes.aLocal.array as Float32Array;
    const front = model.front;
    for (let i = 0; i < points.n; i++) {
      const s = front[Math.floor(points.seeds[i * 3] * front.length)];
      const u = points.seeds[i * 3 + 1];
      const mx = s[0] + (s[3] - s[0]) * u;
      const near = 1 - clamp(Math.abs(scanX - mx) / 1.0);
      const jitter = (points.seeds[i * 3 + 2] - 0.5) * 0.5;
      pPos[i * 3] = mx + jitter * 0.3;
      pPos[i * 3 + 1] = s[1] + (s[4] - s[1]) * u + near * (0.1 + Math.abs(jitter)) * 1.6 + Math.sin(t * 2 + i) * 0.03;
      pPos[i * 3 + 2] = s[2] + (s[5] - s[2]) * u + jitter;
      pLoc[i] = near * near * (0.5 + 0.5 * Math.sin(t * 6 + i * 1.7));
    }
    points.g.attributes.position.needsUpdate = true;
    points.g.attributes.aLocal.needsUpdate = true;

    const vis = Math.sin(q * Math.PI);
    if (planeRef.current) {
      planeRef.current.position.x = scanX;
      planeMat.opacity = vis * 0.04;
    }
    if (edgeRef.current) {
      edgeRef.current.position.x = scanX;
      edgeMat.opacity = vis * 0.5;
    }

    const ang = lerp(-0.62, 0.52, p) + (reduced ? 0 : Math.sin(t * 0.12) * 0.04);
    const r = 15.5;
    const h = lerp(5.5, 7, p);
    camera.position.set(Math.sin(ang) * r, h, Math.cos(ang) * r);
    camera.lookAt(0, 1.5, 0);
  });

  return (
    <>
      <primitive object={A.glowObj} />
      <primitive object={B.glowObj} />
      <primitive object={A.coreObj} />
      <primitive object={B.coreObj} />
      <primitive object={points.p} />
      <mesh ref={planeRef} material={planeMat} position={[0, 2.4, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[12, 5.2]} />
      </mesh>
      <mesh ref={edgeRef} material={edgeMat} position={[0, 2.4, 0]}>
        <boxGeometry args={[0.012, 5.2, 12]} />
      </mesh>
    </>
  );
}

export default function TransitionCanvas(props: Props) {
  return (
    <Canvas
      dpr={[1, props.isTouch ? 1.5 : 2]}
      camera={{ fov: 32, near: 0.1, far: 100, position: [0, 6, 15] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={props.active ? "always" : "never"}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ position: "absolute", inset: 0 }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
