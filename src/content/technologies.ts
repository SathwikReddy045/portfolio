export interface TechNode {
  id: string;
  label: string;
  x: number; // 0..1 of width
  y: number; // 0..1 of height
  size?: number;
  usedIn: string[]; // project ids
}

export interface ProjectNode {
  id: string;
  label: string;
  number: string;
  x: number;
  y: number;
}

export const projectNodes: ProjectNode[] = [
  { id: "dreamspacehub", label: "DreamSpaceHub", number: "01", x: 0.13, y: 0.76 },
  { id: "dreamhometech", label: "DreamHomeTech", number: "02", x: 0.5, y: 0.92 },
  { id: "visionarycontrol", label: "Visionary Control", number: "03", x: 0.87, y: 0.74 },
  { id: "site", label: "This site", number: "04", x: 0.5, y: 0.08 },
];

export const techNodes: TechNode[] = [
  { id: "spatial", label: "Spatial computing", x: 0.5, y: 0.46, size: 1.3, usedIn: ["dreamspacehub", "visionarycontrol"] },
  { id: "realtime", label: "Real-time 3D", x: 0.35, y: 0.6, size: 1.2, usedIn: ["dreamspacehub", "dreamhometech", "site"] },
  { id: "webgl", label: "WebGL", x: 0.3, y: 0.2, usedIn: ["site"] },
  { id: "threejs", label: "Three.js", x: 0.41, y: 0.3, usedIn: ["site"] },
  { id: "unreal", label: "Unreal Engine", x: 0.62, y: 0.7, usedIn: ["dreamhometech"] },
  { id: "arvr", label: "AR / VR", x: 0.7, y: 0.4, size: 1.15, usedIn: ["dreamspacehub", "visionarycontrol"] },
  { id: "cv", label: "Computer vision", x: 0.82, y: 0.52, usedIn: ["visionarycontrol"] },
  { id: "projection", label: "Projection mapping", x: 0.2, y: 0.5, usedIn: ["dreamspacehub"] },
  { id: "resolume", label: "Resolume", x: 0.1, y: 0.34, usedIn: ["dreamspacehub"] },
  { id: "cad", label: "CAD data", x: 0.25, y: 0.8, usedIn: ["dreamspacehub", "dreamhometech"] },
  { id: "interactive", label: "Interactive systems", x: 0.64, y: 0.2, size: 1.1, usedIn: ["dreamspacehub", "dreamhometech", "visionarycontrol", "site"] },
  { id: "automation", label: "Automation", x: 0.45, y: 0.8, usedIn: ["dreamspacehub", "dreamhometech"] },
  { id: "web", label: "Web platform", x: 0.18, y: 0.17, usedIn: ["dreamhometech", "site"] },
  { id: "systems", label: "Systems & pipelines", x: 0.51, y: 0.63, size: 1.1, usedIn: ["dreamspacehub", "dreamhometech"] },
];

/** Relationships between technologies (constellation lines). */
export const techEdges: [string, string][] = [
  ["webgl", "threejs"],
  ["threejs", "realtime"],
  ["realtime", "unreal"],
  ["realtime", "spatial"],
  ["spatial", "arvr"],
  ["arvr", "cv"],
  ["spatial", "projection"],
  ["projection", "resolume"],
  ["cad", "automation"],
  ["cad", "projection"],
  ["automation", "realtime"],
  ["interactive", "spatial"],
  ["interactive", "arvr"],
  ["interactive", "threejs"],
  ["cv", "interactive"],
  ["unreal", "automation"],
  ["web", "webgl"],
  ["web", "threejs"],
  ["web", "resolume"],
  ["systems", "automation"],
  ["systems", "cad"],
  ["systems", "realtime"],
  ["systems", "unreal"],
];
