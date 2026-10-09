"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useARStore } from "@/lib/store";
import { lerp } from "@/lib/hooks";
import { floorTexture } from "../dreamhometech/textures";
import { themeColors } from "@/lib/theme";

export interface ARAnchors {
  box: HTMLDivElement | null;
  label: HTMLDivElement | null;
  panel: HTMLDivElement | null;
  leader: SVGLineElement | null;
  points: (HTMLSpanElement | null)[];
}

interface Props {
  anchorsRef: RefObject<ARAnchors>;
  active: boolean;
  reduced: boolean;
}

/* Unit: width 1.12, height 0.30, depth 0.26. Back face sits on the wall. */
const AC_W = 1.12;
const AC_H = 0.3;
const AC_D = 0.26;
const AC_POS = new THREE.Vector3(0, 0.84, -2.29);

const FEATURE_POINTS: [number, number, number][] = [
  [-0.48, 0.19, 0.235],
  [-0.33, 0.08, 0.245],
  [-0.2, 0.22, 0.225],
  [-0.06, 0.12, 0.245],
  [0.08, 0.2, 0.23],
  [0.2, 0.07, 0.245],
  [0.33, 0.17, 0.235],
  [0.47, 0.1, 0.245],
  [0.5, 0.23, 0.22],
  [-0.52, 0.09, 0.245],
  [0.0, 0.26, 0.2],
  [-0.4, 0.14, 0.24],
  [0.41, 0.24, 0.22],
  [0.14, 0.05, 0.245],
];

/* ------------------------------------------------------------------ */
/* Procedural textures                                                  */
/* ------------------------------------------------------------------ */

function plasterTexture() {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#c4bbab";
  ctx.fillRect(0, 0, size, size);
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 14000; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const l = rnd();
    ctx.fillStyle = `rgba(${l > 0.5 ? 255 : 0},${l > 0.5 ? 250 : 0},${l > 0.5 ? 240 : 0},${rnd() * 0.06})`;
    ctx.beginPath();
    ctx.arc(x, y, rnd() * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, "rgba(255,255,255,0.05)");
  g.addColorStop(1, "rgba(0,0,0,0.08)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

function drawDisplay(ctx: CanvasRenderingContext2D, temp: number, power: boolean, mode: string) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.fillStyle = "#0a0a0b";
  ctx.fillRect(0, 0, w, h);
  ctx.textBaseline = "middle";
  if (power) {
    ctx.fillStyle = "#ffd766";
    ctx.font = "600 64px 'JetBrains Mono', ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${temp}`, w * 0.68, h * 0.52);
    ctx.font = "500 24px 'JetBrains Mono', ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("°C", w * 0.7, h * 0.4);
    ctx.font = "500 16px 'JetBrains Mono', ui-monospace, monospace";
    ctx.fillStyle = "#9fb7c9";
    ctx.fillText(mode.toUpperCase(), w * 0.7, h * 0.72);
  } else {
    ctx.fillStyle = "#2a2a2c";
    ctx.font = "600 56px 'JetBrains Mono', ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("--", w / 2, h * 0.52);
  }
}

/* ------------------------------------------------------------------ */

function AirConditioner({ ledMat, louverRef, displayTex }: { ledMat: THREE.Material; louverRef: RefObject<THREE.Group | null>; displayTex: THREE.CanvasTexture }) {
  const body = useMemo(() => {
    // Cross-section in (depth, height); extruded along the unit's width.
    const s = new THREE.Shape();
    s.moveTo(0, 0.015);
    s.lineTo(0, AC_H);
    s.lineTo(0.17, AC_H);
    s.bezierCurveTo(0.23, AC_H, 0.26, AC_H - 0.05, AC_D, AC_H - 0.12);
    s.bezierCurveTo(AC_D + 0.002, 0.1, 0.24, 0.045, 0.2, 0.015);
    s.lineTo(0, 0.015);
    const g = new THREE.ExtrudeGeometry(s, { depth: AC_W, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 4, curveSegments: 18 });
    g.rotateY(-Math.PI / 2);
    g.translate(AC_W / 2, 0, 0);
    g.computeVertexNormals();
    return g;
  }, []);

  const shell = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f3f3f0", roughness: 0.32, metalness: 0.02 }), []);
  const panel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e9e9e5", roughness: 0.4 }), []);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1b1b1f", roughness: 0.5 }), []);
  const slat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d7d7d2", roughness: 0.6 }), []);
  const displayMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#000000", map: displayTex, emissive: "#ffffff", emissiveMap: displayTex, emissiveIntensity: 1.4, roughness: 0.3 }),
    [displayTex],
  );

  return (
    <group position={AC_POS}>
      <mesh geometry={body} material={shell} castShadow />
      {/* front panel seam + brand plate */}
      <mesh position={[0, 0.2, 0.236]} material={dark}>
        <boxGeometry args={[AC_W - 0.08, 0.003, 0.004]} />
      </mesh>
      <mesh position={[-0.4, 0.14, 0.247]} material={panel}>
        <boxGeometry args={[0.14, 0.02, 0.002]} />
      </mesh>
      {/* top intake grille */}
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={i} position={[-0.5 + i * (1.0 / 29), AC_H + 0.001, 0.085]} material={slat}>
          <boxGeometry args={[0.006, 0.004, 0.13]} />
        </mesh>
      ))}
      <mesh position={[0, AC_H + 0.0005, 0.085]} material={dark}>
        <boxGeometry args={[1.04, 0.002, 0.14]} />
      </mesh>
      {/* outlet cavity + louver */}
      <mesh position={[0, 0.03, 0.2]} material={dark}>
        <boxGeometry args={[1.0, 0.05, 0.06]} />
      </mesh>
      <group ref={louverRef} position={[0, 0.012, 0.235]}>
        <RoundedBox args={[0.98, 0.045, 0.014]} radius={0.004} smoothness={2} position={[0, 0.022, 0.006]} material={panel} castShadow />
      </group>
      {/* display + LED */}
      <mesh position={[0.36, 0.1, 0.247]} material={displayMat}>
        <planeGeometry args={[0.15, 0.052]} />
      </mesh>
      <mesh position={[0.5, 0.08, 0.247]} material={ledMat}>
        <boxGeometry args={[0.03, 0.01, 0.003]} />
      </mesh>
      {/* mounting shadow line on the wall */}
      <mesh position={[0, 0.004, 0.01]} material={dark}>
        <boxGeometry args={[AC_W - 0.06, 0.008, 0.02]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */

function Scene({ anchorsRef, reduced }: Props) {
  const { camera, size } = useThree();
  const louverRef = useRef<THREE.Group>(null);
  const ledMat = useMemo(() => new THREE.MeshStandardMaterial({ color: themeColors().accent, emissive: themeColors().accent, emissiveIntensity: 0 }), []);
  const windowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff6e4", emissive: "#fff1d6", emissiveIntensity: 1.8 }), []);
  const wallTex = useMemo(() => plasterTexture(), []);
  const floorTex = useMemo(() => {
    const t = floorTexture("oak").clone();
    t.needsUpdate = true;
    t.repeat.set(8, 7);
    return t;
  }, []);

  const display = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 96;
    const ctx = c.getContext("2d")!;
    const st = useARStore.getState();
    drawDisplay(ctx, st.temp, st.power, st.mode);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { c, ctx, tex };
  }, []);
  useEffect(() => {
    const unsub = useARStore.subscribe((st) => {
      drawDisplay(display.ctx, st.temp, st.power, st.mode);
      display.tex.needsUpdate = true;
    });
    return unsub;
  }, [display]);

  const flow = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        phase: i / 18,
        x: (i % 9) * 0.11 - 0.44,
        mat: new THREE.MeshBasicMaterial({ color: "#dff0ff", transparent: true, opacity: 0, depthWrite: false }),
      })),
    [],
  );
  const flowRefs = useRef<(THREE.Mesh | null)[]>([]);
  const corners = useMemo(() => {
    const out: THREE.Vector3[] = [];
    for (const sx of [-1, 1]) for (const sy of [0, 1]) for (const sz of [0, 1]) out.push(new THREE.Vector3(sx * AC_W * 0.5, sy * AC_H, sz * AC_D));
    return out;
  }, []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const basePos = useMemo(() => new THREE.Vector3(0.08, 0.5, 0.95), []);
  const lookAt = useMemo(() => new THREE.Vector3(0, 0.9, -2.2), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const power = useARStore.getState().power;
    const fan = useARStore.getState().fan;
    const k = 1 - Math.pow(0.001, dt);

    const sway = reduced ? 0 : 1;
    camera.position.set(
      basePos.x + (Math.sin(t * 1.1) * 0.014 + Math.sin(t * 2.3) * 0.006) * sway,
      basePos.y + (Math.sin(t * 1.7 + 1) * 0.01 + Math.sin(t * 3.1) * 0.004) * sway,
      basePos.z,
    );
    camera.lookAt(lookAt);
    camera.rotation.z += Math.sin(t * 0.9) * 0.006 * sway;

    if (louverRef.current) louverRef.current.rotation.x = lerp(louverRef.current.rotation.x, power ? 1.05 : 0, k);
    ledMat.emissiveIntensity = lerp(ledMat.emissiveIntensity, power ? 3 : 0, k);
    flow.forEach((f, i) => {
      const m = flowRefs.current[i];
      if (!m) return;
      const speed = 0.35 + fan * 0.12;
      const life = (f.phase + t * speed) % 1;
      m.position.set(f.x + Math.sin(t * 2 + i) * 0.02, -0.08 - life * 0.95, 0.26 + life * 0.55);
      m.rotation.x = -0.9;
      const target = power ? (1 - life) * 0.22 * Math.min(1, life * 6) : 0;
      f.mat.opacity = lerp(f.mat.opacity, target, k * 2);
    });

    const a = anchorsRef.current;
    if (!a) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const louverDrop = power ? 0.16 : 0;
    for (const c of corners) {
      tmp.copy(c).add(AC_POS);
      if (c.y === 0) tmp.y -= louverDrop * (louverRef.current ? Math.min(1, louverRef.current.rotation.x) : 0);
      tmp.project(camera);
      const x = (tmp.x * 0.5 + 0.5) * size.width;
      const y = (-tmp.y * 0.5 + 0.5) * size.height;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const pad = 10;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;
    if (a.box) {
      a.box.style.transform = `translate3d(${minX.toFixed(1)}px, ${minY.toFixed(1)}px, 0)`;
      a.box.style.width = `${(maxX - minX).toFixed(1)}px`;
      a.box.style.height = `${(maxY - minY).toFixed(1)}px`;
    }
    if (a.label) a.label.style.transform = `translate3d(${minX.toFixed(1)}px, ${(minY - 34).toFixed(1)}px, 0)`;
    if (a.panel) {
      const pw = a.panel.offsetWidth || 170;
      const fitsRight = maxX + 18 + pw < size.width - 8;
      const px = fitsRight ? maxX + 18 : Math.max(8, Math.min(minX, size.width - pw - 8));
      const py = fitsRight ? minY : maxY + 22;
      a.panel.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
      if (a.leader) {
        a.leader.setAttribute("x1", String(fitsRight ? maxX : (minX + maxX) / 2));
        a.leader.setAttribute("y1", String(fitsRight ? (minY + maxY) / 2 : maxY));
        a.leader.setAttribute("x2", String(fitsRight ? px : px + pw / 2));
        a.leader.setAttribute("y2", String(fitsRight ? py + 22 : py));
      }
    }
    FEATURE_POINTS.forEach((p, i) => {
      const el = a.points[i];
      if (!el) return;
      tmp.set(p[0], p[1], p[2]).add(AC_POS).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * size.width;
      const y = (-tmp.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  });

  return (
    <>
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={2.5} rotation-y={-Math.PI / 2} position={[6, 1, -1]} scale={[4, 3, 1]} color="#fff0dc" />
        <Lightformer intensity={0.9} rotation-x={Math.PI / 2} position={[0, 5, 0]} scale={[10, 10, 1]} />
        <Lightformer intensity={0.5} rotation-y={Math.PI / 2} position={[-6, 1, 0]} scale={[6, 3, 1]} color="#c9d3dd" />
      </Environment>
      <hemisphereLight args={["#fff5e6", "#4a3b2e", 0.75]} />
      <directionalLight position={[3.5, 2.5, 1.5]} intensity={1.6} color="#fff0dc" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.0004} />
      <ambientLight intensity={0.2} />

      {/* room */}
      <mesh position={[0, 0.7, -2.3]} receiveShadow>
        <planeGeometry args={[9, 6]} />
        <meshStandardMaterial map={wallTex} roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -1.3, 0]} receiveShadow>
        <planeGeometry args={[9, 8]} />
        <meshStandardMaterial map={floorTex} roughness={0.6} />
      </mesh>
      <mesh position={[0, -1.24, -2.285]}>
        <boxGeometry args={[9, 0.12, 0.025]} />
        <meshStandardMaterial color="#ebe7df" roughness={0.6} />
      </mesh>
      {/* window with frame */}
      <group position={[2.55, 0.65, -2.27]}>
        <mesh material={windowMat}>
          <planeGeometry args={[1.1, 1.5]} />
        </mesh>
        {[
          [0, 0.77, 1.2, 0.06],
          [0, -0.77, 1.2, 0.06],
          [-0.58, 0, 0.06, 1.6],
          [0.58, 0, 0.06, 1.6],
          [0, 0, 0.03, 1.5],
        ].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0.02]} castShadow>
            <boxGeometry args={[w, h, 0.05]} />
            <meshStandardMaterial color="#f0ece4" roughness={0.5} />
          </mesh>
        ))}
      </group>
      <pointLight position={[2.3, 0.8, -1.5]} intensity={3} color="#fff2dc" distance={6} />

      {/* sideboard */}
      <group position={[-0.1, -1.3, -1.95]}>
        <RoundedBox args={[1.6, 0.68, 0.45]} radius={0.012} smoothness={3} position={[0, 0.4, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#4b3d31" roughness={0.6} />
        </RoundedBox>
        {[-0.39, 0.39].map((x) => (
          <mesh key={x} position={[x, 0.4, 0.228]}>
            <boxGeometry args={[0.74, 0.58, 0.012]} />
            <meshStandardMaterial color="#5a4a3b" roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[0, 0.4, 0.245]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.006, 0.006, 0.12, 8]} />
          <meshStandardMaterial color="#c9a24a" roughness={0.3} metalness={0.9} />
        </mesh>
        <mesh position={[0.45, 0.86, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 0.24, 16]} />
          <meshStandardMaterial color="#d9d4c9" roughness={0.4} />
        </mesh>
        <mesh position={[-0.5, 0.78, 0.02]}>
          <boxGeometry args={[0.26, 0.2, 0.18]} />
          <meshStandardMaterial color="#2b2b2e" roughness={0.5} />
        </mesh>
      </group>

      {/* framed print */}
      <group position={[-1.75, 0.55, -2.27]}>
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.75, 0.03]} />
          <meshStandardMaterial color="#26221f" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.017]}>
          <planeGeometry args={[0.47, 0.67]} />
          <meshStandardMaterial color="#b9ad9c" roughness={0.9} />
        </mesh>
        <mesh position={[0.05, -0.08, 0.019]}>
          <circleGeometry args={[0.12, 32]} />
          <meshStandardMaterial color="#8c7257" roughness={0.9} />
        </mesh>
      </group>

      <AirConditioner ledMat={ledMat} louverRef={louverRef} displayTex={display.tex} />
      <group position={AC_POS}>
        {flow.map((f, i) => (
          <mesh
            key={i}
            ref={(el) => {
              flowRefs.current[i] = el;
            }}
            material={f.mat}
          >
            <planeGeometry args={[0.035, 0.42]} />
          </mesh>
        ))}
      </group>
    </>
  );
}

export default function ARScene(props: Props) {
  return (
    <Canvas
      dpr={[1, 2]}
      shadows
      camera={{ fov: 58, near: 0.1, far: 30, position: [0.08, 0.5, 0.95] }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      frameloop={props.active ? "always" : "never"}
      onCreated={({ gl }) => {
        gl.setClearColor("#1a1715", 1);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
