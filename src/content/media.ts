/**
 * MEDIA MANIFEST
 * Every image / video slot on the site is keyed here. A slot with no `src`
 * renders a clearly labelled placeholder. Drop files into /public/media and
 * fill in `src` (and `poster` for video) to replace a placeholder.
 *
 * Eight slots in total. Suggested file paths for the empty ones are noted
 * on each slot; see MEDIA-CHECKLIST.md.
 */
export type MediaKind = "image" | "video" | "diagram" | "model";

export interface MediaSlot {
  id: string;
  label: string; // shown inside the placeholder, e.g. "PROJECTION PHOTO"
  kind: MediaKind;
  ratio: string; // CSS aspect-ratio, e.g. "16 / 9"
  src?: string;
  poster?: string;
  alt?: string;
}

export const media: Record<string, MediaSlot> = {
  /* ---------- DreamSpaceHub ---------- */
  "dsh.hero": {
    id: "dsh.hero",
    label: "PROJECT VIDEO",
    kind: "video",
    ratio: "16 / 9",
    src: "/media/dreamspacehub/hero.mp4",
    poster: "/media/dreamspacehub/projection.webp",
    alt: "DreamSpaceHub: architectural designs projected at 1:1 scale inside a physical space",
  },
  "dsh.projection": {
    id: "dsh.projection",
    label: "1:1 PROJECTION PHOTO",
    kind: "image",
    ratio: "3 / 2",
    src: "/media/dreamspacehub/projection.webp",
    alt: "A floorplan projected at 1:1 scale onto the floor of the DreamSpaceHub space, with wall projections, movable wall panels and a person for scale",
  },

  /* ---------- DreamHomeTech ---------- */
  "dht.hero": { id: "dht.hero", label: "PRODUCT VIDEO", kind: "video", ratio: "16 / 9" }, // /media/dreamhometech/hero.mp4 + hero.webp
  "dht.plan": { id: "dht.plan", label: "2D FLOORPLAN", kind: "image", ratio: "16 / 10" }, // /media/dreamhometech/floorplan.webp
  "dht.model": { id: "dht.model", label: "GENERATED 3D HOME", kind: "image", ratio: "16 / 10" }, // /media/dreamhometech/generated-home.webp

  /* ---------- Visionary Control ---------- */
  "vc.hero": {
    id: "vc.hero",
    label: "DEMO VIDEO",
    kind: "video",
    ratio: "16 / 9",
    src: "/media/visionarycontrol/hero.mp4",
    poster: "/media/visionarycontrol/still.webp",
    alt: "Visionary Control: a phone camera pointed at an air conditioner shows its controls anchored in AR",
  },
  "vc.still": {
    id: "vc.still",
    label: "AR STILL",
    kind: "image",
    ratio: "16 / 9",
    src: "/media/visionarycontrol/still.webp",
    alt: "A hand holding a phone up to a wall-mounted air conditioner; the screen shows the Visionary Control interface with temperature, mode and power controls anchored to the unit",
  },

  /* ---------- About ---------- */
  "about.portrait": { id: "about.portrait", label: "PORTRAIT", kind: "image", ratio: "4 / 5" }, // /media/about/portrait.webp
};

export const getMedia = (id: string): MediaSlot =>
  media[id] ?? { id, label: id.toUpperCase(), kind: "image", ratio: "16 / 9" };
