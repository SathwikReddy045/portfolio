export interface Capability {
  number: string;
  title: string;
  detail: string;
  projects: string[]; // project numbers
}

export const capabilities: Capability[] = [
  { number: "01", title: "Software engineering", detail: "Application code, data pipelines, integrations and the infrastructure under the visuals. Shipping systems, not demos.", projects: ["01", "02", "03", "04"] },
  { number: "02", title: "Technical architecture", detail: "Designing the systems that connect design data, real-time engines and physical outputs.", projects: ["01", "02"] },
  { number: "03", title: "Real-time 3D", detail: "Environments that render as decisions are made, not after.", projects: ["01", "02", "04"] },
  { number: "04", title: "Spatial computing", detail: "Software that understands rooms, scale and the objects inside them.", projects: ["01", "03"] },
  { number: "05", title: "AR / VR", detail: "Immersive layers that extend physical space, and digital interfaces anchored to real objects.", projects: ["01", "03"] },
  { number: "06", title: "Interactive installations", detail: "Physical environments that respond to people, data and change.", projects: ["01"] },
  { number: "07", title: "Computer vision", detail: "Cameras that recognize what they are looking at, and act on it.", projects: ["03"] },
  { number: "08", title: "WebGL / Three.js", detail: "Browser-native 3D and motion. This site is built with it.", projects: ["04"] },
  { number: "09", title: "Projection systems", detail: "Mapping design data onto real surfaces at 1:1 scale through Resolume and projectors.", projects: ["01"] },
  { number: "10", title: "Product development", detail: "Turning unusual technology into products people and businesses can actually use.", projects: ["02", "03"] },
];
