/**
 * Furniture placement for the generated house, per furniture set.
 * Positions are in metres on the plan (+x east, +z south), rotation in radians.
 */

export type MatKey =
  | "fabric"
  | "fabricAlt"
  | "wood"
  | "woodDark"
  | "white"
  | "dark"
  | "mattress"
  | "pillow"
  | "duvet"
  | "rug"
  | "rugBorder"
  | "counter"
  | "stone"
  | "appliance"
  | "metal"
  | "tap"
  | "shade"
  | "glass"
  | "mirror"
  | "leather"
  | "bookA"
  | "bookB"
  | "bookC";

export const PALETTES: Record<"a" | "b", Record<MatKey, string>> = {
  a: {
    fabric: "#c2b09a",
    fabricAlt: "#8f7f6c",
    wood: "#b08a62",
    woodDark: "#6e5340",
    white: "#f0eee9",
    dark: "#2a2a2d",
    mattress: "#ecebe6",
    pillow: "#f6f3ec",
    duvet: "#d9d2c4",
    rug: "#9a8a76",
    rugBorder: "#7d6e5c",
    counter: "#e6e1d8",
    stone: "#d8d3ca",
    appliance: "#d5d6d4",
    metal: "#9a9ea3",
    tap: "#c9a24a",
    shade: "#ece7dd",
    glass: "#b8d0dd",
    mirror: "#cfd6dc",
    leather: "#8a5f44",
    bookA: "#b65d3f",
    bookB: "#4a5f72",
    bookC: "#d9cfbd",
  },
  b: {
    fabric: "#4b5a52",
    fabricAlt: "#2f3a35",
    wood: "#74503a",
    woodDark: "#3f2d22",
    white: "#e8e5df",
    dark: "#1b1b1e",
    mattress: "#e4e0d8",
    pillow: "#cfc6b6",
    duvet: "#5c6b63",
    rug: "#3d3b3b",
    rugBorder: "#2b2a2a",
    counter: "#2f3033",
    stone: "#44454a",
    appliance: "#3a3b3e",
    metal: "#5d6166",
    tap: "#1a1a1c",
    shade: "#2b2b2e",
    glass: "#a9c2d2",
    mirror: "#c6ccd1",
    leather: "#4a3328",
    bookA: "#8d3f2e",
    bookB: "#2e4050",
    bookC: "#b8ad9c",
  },
};

export type Kind =
  | "sofa"
  | "armchair"
  | "coffeeTable"
  | "diningSet"
  | "tvUnit"
  | "rug"
  | "floorLamp"
  | "bed"
  | "nightstand"
  | "wardrobe"
  | "desk"
  | "chair"
  | "bookshelf"
  | "kitchenRun"
  | "island"
  | "fridge"
  | "bathtub"
  | "toilet"
  | "basin"
  | "mirror"
  | "console"
  | "towelRail";

export interface Placement {
  id: string;
  room: string;
  kind: Kind;
  position: [number, number, number];
  rotationY?: number;
  props?: Record<string, number | boolean | string>;
}

export function furnitureLayout(set: "a" | "b"): Placement[] {
  const lShape = set === "b";
  const round = set === "b";
  return [
    /* living */
    { id: "living.rug", room: "living", kind: "rug", position: [-4.3, 0, -1.95], props: { w: 3.2, d: 2.6 } },
    { id: "living.sofa", room: "living", kind: "sofa", position: [-4.3, 0, -1.15], props: { width: 2.4, lShape } },
    { id: "living.table", room: "living", kind: "coffeeTable", position: [-4.3, 0, -2.55], props: { round } },
    { id: "living.tv", room: "living", kind: "tvUnit", position: [-4.3, 0, -4.2] },
    { id: "living.dining", room: "living", kind: "diningSet", position: [-2.05, 0, -3.3] },
    { id: "living.armchair", room: "living", kind: "armchair", position: [-2.2, 0, -0.75], rotationY: Math.PI * 0.6 },
    { id: "living.lamp", room: "living", kind: "floorLamp", position: [-5.6, 0, -0.1] },

    /* kitchen */
    { id: "kitchen.run", room: "kitchen", kind: "kitchenRun", position: [0.75, 0, -4.17], props: { length: 3.3 } },
    { id: "kitchen.island", room: "kitchen", kind: "island", position: [0.75, 0, -2.35] },
    { id: "kitchen.fridge", room: "kitchen", kind: "fridge", position: [2.14, 0, -2.5], rotationY: -Math.PI / 2 },

    /* bath */
    { id: "bath.tub", room: "bath", kind: "bathtub", position: [4.3, 0, -4.1] },
    { id: "bath.basin", room: "bath", kind: "basin", position: [5.72, 0, -2.6], rotationY: -Math.PI / 2 },
    { id: "bath.mirror", room: "bath", kind: "mirror", position: [5.965, 1.45, -2.6], rotationY: -Math.PI / 2, props: { w: 0.7, h: 0.8 } },
    { id: "bath.wc", room: "bath", kind: "toilet", position: [3.0, 0, -1.55], rotationY: Math.PI },
    { id: "bath.rail", room: "bath", kind: "towelRail", position: [2.6, 1.1, -3.0], rotationY: Math.PI / 2 },

    /* hall */
    { id: "hall.rug", room: "hall", kind: "rug", position: [2.5, 0, -0.25], props: { w: 5.0, d: 0.75 } },
    { id: "hall.console", room: "hall", kind: "console", position: [2.8, 0, -0.8] },
    { id: "hall.mirror", room: "hall", kind: "mirror", position: [2.8, 1.45, -0.965], props: { w: 0.6, h: 0.9 } },

    /* bed 1 */
    { id: "bed1.rug", room: "bed1", kind: "rug", position: [-4.2, 0, 3.0], props: { w: 2.4, d: 1.5 } },
    { id: "bed1.bed", room: "bed1", kind: "bed", position: [-4.2, 0, 1.6], props: { width: 1.7, length: 2.05 } },
    { id: "bed1.ns1", room: "bed1", kind: "nightstand", position: [-5.5, 0, 0.95], props: { lamp: true } },
    { id: "bed1.ns2", room: "bed1", kind: "nightstand", position: [-2.9, 0, 0.95], props: { lamp: true } },
    { id: "bed1.wardrobe", room: "bed1", kind: "wardrobe", position: [-1.36, 0, 3.3], rotationY: -Math.PI / 2, props: { width: 2.0 } },
    { id: "bed1.chair", room: "bed1", kind: "armchair", position: [-5.3, 0, 3.6], rotationY: Math.PI * 0.35 },

    /* bed 2 */
    { id: "bed2.bed", room: "bed2", kind: "bed", position: [1.5, 0, 2.6], rotationY: -Math.PI / 2, props: { width: 1.45, length: 1.95 } },
    { id: "bed2.ns", room: "bed2", kind: "nightstand", position: [2.1, 0, 1.55], props: { lamp: true } },
    { id: "bed2.desk", room: "bed2", kind: "desk", position: [-0.4, 0, 1.05], props: { monitor: true } },
    { id: "bed2.chair", room: "bed2", kind: "chair", position: [-0.4, 0, 1.75], rotationY: Math.PI },
    { id: "bed2.wardrobe", room: "bed2", kind: "wardrobe", position: [-0.68, 0, 4.13], props: { width: 1.2 } },

    /* study */
    { id: "study.desk", room: "study", kind: "desk", position: [5.5, 0, 2.4], rotationY: -Math.PI / 2, props: { monitor: true, wide: true } },
    { id: "study.chair", room: "study", kind: "chair", position: [4.75, 0, 2.4], rotationY: -Math.PI / 2 },
    { id: "study.shelf", room: "study", kind: "bookshelf", position: [3.1, 0, 0.8] },
    { id: "study.armchair", room: "study", kind: "armchair", position: [3.3, 0, 3.75], rotationY: -Math.PI * 0.25 },
    { id: "study.lamp", room: "study", kind: "floorLamp", position: [2.85, 0, 4.1] },
    { id: "study.rug", room: "study", kind: "rug", position: [4.3, 0, 2.6], props: { w: 2.2, d: 2.0 } },
  ];
}
