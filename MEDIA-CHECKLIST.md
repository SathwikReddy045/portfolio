# Media checklist

Eight slots, keyed in `src/content/media.ts`. Drop each file at the path below, then set `src` (and `poster` for video) on the matching entry. Until a slot has a `src`, the site shows a labelled placeholder.

## Status

| Slot | Status | File |
| --- | --- | --- |
| `dsh.hero` | ✅ in place | `public/media/dreamspacehub/hero.mp4` (1280×720, 10s), poster `projection.webp` |
| `dsh.projection` | ✅ in place | `public/media/dreamspacehub/projection.webp` (1920×1281) |
| `vc.hero` | ✅ in place | `public/media/visionarycontrol/hero.mp4` (1280×720, 10s), poster `still.webp` |
| `vc.still` | ✅ in place | `public/media/visionarycontrol/still.webp` (1920×1072) |
| `dht.hero` | ⬜ needed | `public/media/dreamhometech/hero.mp4` + `hero.webp` poster |
| `dht.plan` | ⬜ needed | `public/media/dreamhometech/floorplan.webp` |
| `dht.model` | ⬜ needed | `public/media/dreamhometech/generated-home.webp` |
| `about.portrait` | ⬜ needed | `public/media/about/portrait.webp` |

The VR slot was removed; re-add it later by restoring a `dsh.vr` entry and a `vr-frame` chapter visual.

## Still to source

### DreamHomeTech — `public/media/dreamhometech/`

- **`hero.mp4` + `hero.webp`**: product video or screen recording of the configurator being used (a buyer changing floors, walls, fittings and seeing the home update). Appears full-width under the project header.
- **`floorplan.webp`** (16:10): a real 2D floorplan, as a builder would upload it. Left side of the before/after slider in chapter 01.
- **`generated-home.webp`** (16:10): the 3D home generated from that same floorplan, from a similar angle. Right side of the slider. Same house for both so the slider proves the claim.

### About — `public/media/about/`

- **`portrait.webp`** (4:5): a portrait photo, ideally environmental (studio, the projection room, your desk) rather than a headshot.

## Specs

- **Images**: WebP or AVIF, sRGB, at least 1600px wide for landscape and 1200px for the portrait, under ~600KB. PNG/JPG also work; `next/image` resizes and re-encodes on the fly, but keep sources under ~3MB.
- **Videos**: MP4 (H.264), 1920×1080 preferred (1280×720 is acceptable), 10–30 seconds cut to loop, no audio needed (they autoplay muted and loop), under ~8MB. Export a poster frame as WebP for each video; it is shown before the video loads.
- If you only have a photo for a video slot, change that slot's `kind` to `"image"` and use the photo.
- Filenames: lowercase, no spaces.

## Example entry

```ts
"dht.hero": {
  id: "dht.hero",
  label: "PRODUCT VIDEO",
  kind: "video",
  ratio: "16 / 9",
  src: "/media/dreamhometech/hero.mp4",
  poster: "/media/dreamhometech/hero.webp",
  alt: "A buyer customising a generated 3D home in DreamHomeTech",
},
```

## Already handled, nothing to source

- Favicon (`src/app/icon.svg`) and social preview image (`src/app/opengraph-image.tsx`) are generated from the site's mark and typography.
- All 3D scenes, diagrams, textures and furniture are procedural.
