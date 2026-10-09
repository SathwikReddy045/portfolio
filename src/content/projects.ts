export type ChapterVisual =
  | { type: "media"; id: string }
  | { type: "compare"; before: string; after: string; labels: [string, string] }
  | { type: "live-editing" }
  | { type: "system-layers"; layers: { label: string; detail: string }[] }
  | { type: "plan-recognition" }
  | { type: "buyer-workflow" }
  | { type: "vr-frame"; id: string }
  | { type: "options"; items: string[] }
  | { type: "none" };

export interface Chapter {
  index: string;
  label: string;
  heading: string;
  body: string[];
  visual: ChapterVisual;
  layout?: "text-left" | "text-right" | "full" | "statement";
}

export interface Project {
  id: string;
  number: string;
  anchor: string;
  title: string;
  subtitle: string;
  language: string; // visual personality
  description: string[];
  meta: { label: string; value: string }[];
  heroMedia: string;
  chapters: Chapter[];
  closing: string;
}

export const projects: Project[] = [
  /* ------------------------------------------------------------------ */
  {
    id: "dreamspacehub",
    number: "01",
    anchor: "work-01",
    title: "DreamSpaceHub",
    subtitle: "When architecture becomes physical.",
    language: "Physical / Architectural / Immersive",
    description: [
      "DreamSpaceHub is an architectural experience platform where future homes can be experienced before construction through 1:1 scale projection, immersive visualization and VR.",
      "Sathwik handled the technical architecture and built the systems that connect architectural design data with real-time physical visualization.",
    ],
    meta: [
      { label: "Role", value: "Technical architecture, systems" },
      { label: "Domain", value: "Architecture, projection, VR" },
      { label: "Output", value: "1:1 projected environment" },
      { label: "Pipeline", value: "CAD data, real-time, Resolume" },
    ],
    heroMedia: "dsh.hero",
    chapters: [
      {
        index: "01",
        label: "The problem and the idea",
        heading: "Drawings are not experiences.",
        body: [
          "Most people will only ever meet their future home as a plan, a render or a walkthrough on a screen. Scale, proportion and light are the things that matter most, and the hardest to read from a drawing.",
          "DreamSpaceHub turns a physical space into a canvas: architectural designs are projected 1:1 onto real surfaces, extended with immersive visualization and VR, so a home can be experienced, questioned and changed before construction.",
        ],
        visual: { type: "none" },
        layout: "statement",
      },
      {
        index: "02",
        label: "The system",
        heading: "One source of truth. Many outputs.",
        body: [
          "Sathwik designed the technical architecture and built the systems that connect architectural design data with real-time physical visualization: a pipeline that starts in CAD and ends on the walls of a room.",
          "A single design dataset feeds every output, so the projection environment, the immersive visualization and the VR experience stay in sync with the design as it changes.",
        ],
        visual: {
          type: "system-layers",
          layers: [
            { label: "Design", detail: "Architectural design data authored in CAD" },
            { label: "Bridge", detail: "Design changes extracted as real-time data and geometry" },
            { label: "Real-time", detail: "Visualization pipeline rendering the space live" },
            { label: "Output", detail: "Resolume, projectors, 1:1 physical environment, VR" },
          ],
        },
        layout: "text-left",
      },
      {
        index: "03",
        label: "Live editing",
        heading: "Change the drawing. Watch the room change.",
        body: [
          "The architect edits the design in CAD. The change flows automatically through the real-time visualization pipeline, into Resolume, out of the projectors and onto the physical environment.",
          "No export, no rebuild. A live loop between the drawing and the room.",
        ],
        visual: { type: "live-editing" },
        layout: "full",
      },
      {
        index: "04",
        label: "1:1 projection",
        heading: "True scale changes decisions.",
        body: [
          "At 1:1, a corridor is either wide enough or it isn’t. Projection mapping turns the walls and floor of a physical space into the surfaces of the designed home, so it can be walked through, furnished and questioned at real scale.",
          "Where the physical environment ends, VR continues with the same design data for the rooms, levels and views the projection surface cannot reach.",
        ],
        visual: { type: "media", id: "dsh.projection" },
        layout: "text-right",
      },
    ],
    closing: "A home you can walk through before it exists.",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "dreamhometech",
    number: "02",
    anchor: "work-02",
    title: "DreamHomeTech",
    subtitle: "From 2D floorplan to a home you can walk through.",
    language: "Product / 3D / Construction / Future home",
    description: [
      "DreamHomeTech is a technology platform developed for the Australian construction industry. A builder uploads a conventional 2D floorplan. The system processes it and generates a 3D representation of the house, which can be customized and visualized in real time.",
      "The resulting experience is shared with the homebuyer, who can explore and customize their future home before construction begins.",
    ],
    meta: [
      { label: "Market", value: "Australian construction industry" },
      { label: "Input", value: "Conventional 2D floorplan" },
      { label: "Output", value: "Customizable real-time 3D home" },
      { label: "Engine", value: "Automated 2D to 3D, Unreal Engine" },
    ],
    heroMedia: "dht.hero",
    chapters: [
      {
        index: "01",
        label: "From floorplan to house",
        heading: "Homes are bought from floorplans.",
        body: [
          "In volume home building, a buyer’s first and often only picture of their future home is a 2D floorplan. Builders need a faster way to help buyers understand, choose and commit, without bespoke 3D work for every home.",
          "A builder uploads a conventional 2D floorplan. The system processes it and generates a 3D representation of the house: walls, rooms and openings, ready to be visualized and customized.",
        ],
        visual: {
          type: "compare",
          before: "dht.plan",
          after: "dht.model",
          labels: ["2D plan", "3D home"],
        },
        layout: "full",
      },
      {
        index: "02",
        label: "Automated spatial understanding",
        heading: "The drawing is read, not traced.",
        body: [
          "The system interprets the floorplan. Walls, rooms, doors and windows become spatial data rather than lines on a page, which is what makes the generated home customizable instead of a static model.",
        ],
        visual: { type: "plan-recognition" },
        layout: "text-left",
      },
      {
        index: "03",
        label: "Real-time customization",
        heading: "Rendered as you decide.",
        body: [
          "The generated environment is visualized in real time. Every change, a colour, a floor, a fitting, is seen immediately rather than rendered overnight.",
          "Buyers change what they will live with, and see it as they change it.",
        ],
        visual: {
          type: "options",
          items: ["Wall colours", "Flooring", "Doors", "Handles", "Taps", "Furniture", "Fixtures", "Materials", "Finishes", "Lighting"],
        },
        layout: "text-left",
      },
      {
        index: "04",
        label: "Builder to buyer workflow",
        heading: "Built for builders. Experienced by buyers.",
        body: [
          "The platform is primarily built for builders. The builder uploads, generates and shares. The buyer enters the experience, customizes the home and experiences it before it is built.",
        ],
        visual: { type: "buyer-workflow" },
        layout: "full",
      },
    ],
    closing: "A floorplan becomes a place you can walk through.",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "visionarycontrol",
    number: "03",
    anchor: "work-03",
    title: "Visionary Control",
    subtitle: "Point. Recognize. Control.",
    language: "AR / Computer vision / Future interface",
    description: [
      "Visionary Control is an experimental AR application that allows users to point their smartphone camera at an appliance and interact with it digitally.",
      "The physical appliance becomes the interface. The camera identifies the object and presents its controls through the mobile AR experience.",
    ],
    meta: [
      { label: "Type", value: "Experimental AR application" },
      { label: "Platform", value: "Smartphone camera" },
      { label: "Core", value: "Computer vision, AR anchoring" },
      { label: "Interface", value: "The appliance itself" },
    ],
    heroMedia: "vc.hero",
    chapters: [
      {
        index: "01",
        label: "The idea",
        heading: "The appliance is the interface.",
        body: [
          "Point a smartphone camera at an appliance. Computer vision identifies it and tracks it as the phone moves, and its controls appear anchored to the object itself. No manual, no app per device, no hunting for the right remote.",
        ],
        visual: { type: "media", id: "vc.still" },
        layout: "text-left",
      },
      {
        index: "02",
        label: "Anchored controls, physical response",
        heading: "Tap on screen. Change in the room.",
        body: [
          "The interface is placed in the AR view and locked to the appliance, so the digital controls and the physical object read as one thing. Interactions in the AR layer translate into the device’s response in the physical world, closing the loop between seeing, understanding and controlling.",
        ],
        visual: { type: "none" },
        layout: "statement",
      },
    ],
    closing: "An experiment in interfaces that live in the room.",
  },
];

export const projectById = (id: string) => projects.find((p) => p.id === id)!;
