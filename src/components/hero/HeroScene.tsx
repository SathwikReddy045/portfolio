"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { buildArchitecture } from "./architecture";
import { themeColors } from "@/lib/theme";

const T = themeColors();
const ACCENT = new THREE.Color(T.accent);
const INK = new THREE.Color(T.ink);

interface SceneProps {
  progressRef: RefObject<number>;
  isTouch: boolean;
  reduced: boolean;
}

/* ------------------------------------------------------------------ */
/* Shaders                                                              */
/* ------------------------------------------------------------------ */

const faceVert = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vNormal;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const faceFrag = /* glsl */ `
  uniform vec3 uCursor;
  uniform float uRadius;
  uniform float uScanY;
  uniform vec3 uAccent;
  uniform vec3 uCamPos;
  uniform vec3 uBase;
  varying vec3 vWorld;
  varying vec3 vNormal;
  void main() {
    float d = distance(vWorld, uCursor);
    float prox = 1.0 - smoothstep(0.0, uRadius, d);
    float built = 1.0 - smoothstep(uScanY - 0.5, uScanY + 0.05, vWorld.y);
    float alpha = clamp(prox * 0.95 + built * 0.94, 0.0, 1.0);
    if (alpha < 0.015) discard;

    vec3 N = normalize(vNormal);
    vec3 L = normalize(uCursor - vWorld);
    float diff = max(dot(N, L), 0.0);
    float sky = max(dot(N, normalize(vec3(0.35, 0.8, 0.45))), 0.0);
    vec3 V = normalize(uCamPos - vWorld);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    vec3 base = uBase;
    vec3 col = base + vec3(0.11) * sky * (0.4 + 0.6 * built);
    col += uAccent * diff * prox * 0.85;
    col += uAccent * 0.05 * built;
    col += fres * vec3(0.07);

    float scan = 1.0 - smoothstep(0.0, 0.14, abs(vWorld.y - uScanY));
    col += uAccent * scan * 0.9;

    gl_FragColor = vec4(col, alpha);
  }
`;

const lineVert = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const lineFrag = /* glsl */ `
  uniform vec3 uCursor;
  uniform float uRadius;
  uniform float uScanY;
  uniform vec3 uAccent;
  uniform vec3 uInk;
  uniform float uLineBase;
  varying vec3 vWorld;
  void main() {
    float d = distance(vWorld, uCursor);
    float prox = 1.0 - smoothstep(0.0, uRadius, d);
    float scan = 1.0 - smoothstep(0.0, 0.4, abs(vWorld.y - uScanY));
    float a = uLineBase + prox * 0.7 + scan * 0.7;
    vec3 col = mix(uInk, uAccent, clamp(prox * 0.9 + scan, 0.0, 1.0));
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;

const gridVert = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const gridFrag = /* glsl */ `
  uniform vec3 uCursor;
  uniform float uRadius;
  uniform vec3 uAccent;
  uniform vec3 uInk;
  uniform float uGridBase;
  varying vec3 vWorld;
  void main() {
    vec2 coord = vWorld.xz;
    vec2 g = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    float line = 1.0 - min(min(g.x, g.y), 1.0);
    float r = length(coord);
    float fade = 1.0 - smoothstep(5.0, 17.0, r);
    float prox = 1.0 - smoothstep(0.0, uRadius * 1.4, distance(vWorld, uCursor));
    float a = line * fade * (uGridBase + prox * 0.4);
    gl_FragColor = vec4(mix(uInk, uAccent, prox), a);
  }
`;

const dustVert = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.25 + aSeed * 6.28) * 0.5;
    p.y += sin(uTime * 0.18 + aSeed * 3.1) * 0.35;
    p.z += cos(uTime * 0.21 + aSeed * 4.2) * 0.5;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.2 + aSeed * 1.6) * uPixelRatio * (12.0 / -mv.z);
  }
`;

const dustFrag = /* glsl */ `
  uniform vec3 uInk;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float a = smoothstep(0.5, 0.1, length(c)) * 0.35;
    gl_FragColor = vec4(uInk, a);
  }
`;

/* ------------------------------------------------------------------ */

function Scene({ progressRef, isTouch, reduced }: SceneProps) {
  const { solid, edges } = useMemo(() => buildArchitecture(), []);
  const { camera, gl } = useThree();

  const faceMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: faceVert,
        fragmentShader: faceFrag,
        transparent: true,
        depthWrite: true,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
        uniforms: {
          uCursor: { value: new THREE.Vector3(0, 2, 0) },
          uRadius: { value: 3.2 },
          uScanY: { value: -1 },
          uAccent: { value: ACCENT },
          uCamPos: { value: new THREE.Vector3() },
          uBase: { value: new THREE.Color(T.surface) },
        },
      }),
    [],
  );

  const lineMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: lineVert,
        fragmentShader: lineFrag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uCursor: faceMat.uniforms.uCursor,
          uRadius: { value: 3.2 },
          uScanY: faceMat.uniforms.uScanY,
          uAccent: { value: ACCENT },
          uInk: { value: INK },
          uLineBase: { value: T.light ? 0.3 : 0.14 },
        },
      }),
    [faceMat],
  );

  const gridMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: gridVert,
        fragmentShader: gridFrag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uCursor: faceMat.uniforms.uCursor,
          uRadius: { value: 3.2 },
          uAccent: { value: ACCENT },
          uInk: { value: INK },
          uGridBase: { value: T.light ? 0.16 : 0.09 },
        },
      }),
    [faceMat],
  );

  const dust = useMemo(() => {
    const n = isTouch ? 60 : 140;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = Math.random() * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: dustVert,
      fragmentShader: dustFrag,
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uInk: { value: INK } },
    });
    return { g, m };
  }, [isTouch]);

  // Pointer tracking in NDC relative to the canvas (works beneath overlays).
  const ndc = useRef(new THREE.Vector2(0, 0));
  useEffect(() => {
    if (isTouch) return;
    const onMove = (e: MouseEvent) => {
      const r = gl.domElement.getBoundingClientRect();
      ndc.current.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [gl, isTouch]);

  const target = useRef(new THREE.Vector3(0, 2.2, 0));
  const cursor = useRef(new THREE.Vector3(0, 2.2, 0));
  const plane = useMemo(() => new THREE.Plane(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const tmpDir = useMemo(() => new THREE.Vector3(), []);
  const anchor = useMemo(() => new THREE.Vector3(0, 2.2, 0), []);

  useEffect(() => {
    dust.m.uniforms.uPixelRatio.value = gl.getPixelRatio();
    return () => {
      solid.dispose();
      edges.dispose();
      faceMat.dispose();
      lineMat.dispose();
      gridMat.dispose();
      dust.g.dispose();
      dust.m.dispose();
    };
  }, [gl, solid, edges, faceMat, lineMat, gridMat, dust]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const p = reduced ? 1 : progressRef.current ?? 0;
    const reveal = reduced ? 1 : 0.06 + p * 0.94;

    // Cursor in world space
    if (isTouch || reduced) {
      target.current.set(Math.cos(t * 0.3) * 5, 2.2 + Math.sin(t * 0.45) * 1.6, Math.sin(t * 0.3) * 3.5);
    } else {
      camera.getWorldDirection(tmpDir);
      plane.setFromNormalAndCoplanarPoint(tmpDir, anchor);
      raycaster.setFromCamera(ndc.current, camera);
      raycaster.ray.intersectPlane(plane, target.current);
    }
    cursor.current.lerp(target.current, 1 - Math.pow(0.002, dt));
    faceMat.uniforms.uCursor.value.copy(cursor.current);
    faceMat.uniforms.uScanY.value = -0.7 + reveal * 8.6 + (reduced ? 0 : Math.sin(t * 0.8) * 0.05);
    faceMat.uniforms.uCamPos.value.copy(camera.position);
    dust.m.uniforms.uTime.value = t;

    // Camera: slow orbit + pointer parallax + scroll push-in
    const px = isTouch ? 0 : ndc.current.x;
    const py = isTouch ? 0 : ndc.current.y;
    const ang = 0.75 + Math.sin(t * 0.07) * 0.09 + px * 0.07 + p * 0.55;
    const rad = 17.5 - p * 5;
    const h = 5.8 - py * 0.7 + p * 2.2;
    camera.position.set(Math.sin(ang) * rad, h, Math.cos(ang) * rad);
    camera.lookAt(0, 2.4 - p * 0.6, 0);
  });

  return (
    <group>
      <mesh geometry={solid} material={faceMat} />
      <lineSegments geometry={edges} material={lineMat} />
      <mesh rotation-x={-Math.PI / 2} position-y={-0.38}>
        <planeGeometry args={[70, 70]} />
        <primitive object={gridMat} attach="material" />
      </mesh>
      <points geometry={dust.g} material={dust.m} />
    </group>
  );
}

/* ------------------------------------------------------------------ */

export default function HeroScene({
  progressRef,
  active,
  isTouch,
  reduced,
  onReady,
}: SceneProps & { active: boolean; onReady?: () => void }) {
  return (
    <Canvas
      dpr={[1, isTouch ? 1.5 : 1.75]}
      camera={{ fov: 30, near: 0.1, far: 120, position: [12, 6, 12] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={active ? "always" : "never"}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        onReady?.();
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Scene progressRef={progressRef} isTouch={isTouch} reduced={reduced} />
    </Canvas>
  );
}
