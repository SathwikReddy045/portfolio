# Sathwik Reddy — Portfolio

Creative-technology portfolio built as a single continuous scroll experience.
Next.js 16 · React 19 · TypeScript · Tailwind v4 · GSAP + ScrollTrigger · Lenis · Three.js (React Three Fiber).

## Run

```bash
npm install
npm run dev      # http://localhost:3000 (use --port 3100 if 3000 is busy)
npm run build    # production build
npm run lint
```

## Where to edit content

| What | File |
| --- | --- |
| Name, roles, hero statement, location, availability, email and GitHub | `src/content/site.ts` |
| Project copy, chapters, meta rows | `src/content/projects.ts` |
| Photos, videos and diagrams (placeholder slots) | `src/content/media.ts` |
| Technology constellation nodes and relationships | `src/content/technologies.ts` |
| Capabilities 01–10 (pinned horizontal track) | `src/content/capabilities.ts` |
| Colours, type scale, spacing tokens | `src/app/globals.css` |

### Replacing a placeholder with a real asset

There are eight slots, keyed in `src/content/media.ts`: three project hero videos, a 1:1 projection photo, a 2D floorplan and its generated 3D home (before/after), an AR still and a portrait photo. DreamSpaceHub and Visionary Control assets are already in place. Drop the file into `public/media/…` and add `src` (and `poster` for video):

```ts
"dsh.projection": {
  id: "dsh.projection",
  label: "1:1 PROJECTION PHOTO",
  kind: "image",
  ratio: "4 / 3",
  src: "/media/dreamspacehub/projection.webp",
  alt: "Living room projected at 1:1 scale",
},
```

Videos are lazy-loaded, muted and loop; images use `next/image`. The placeholder frame, reveal animation and cursor label stay the same.

Contact rows read their targets from `site.links`. The media checklist with filenames and specs is in `MEDIA-CHECKLIST.md`.

## Structure

```
src/
  app/              layout (fonts, metadata), page (section order), globals.css (design system)
  content/          all copy and data — no facts live in components
  lib/              gsap registration, lenis access, hooks, zustand stores
  components/
    core/           SmoothScroll, CustomCursor, Navigation (+ mobile menu), ProjectProgress, Footer
    ui/             TextReveal (line/char/scrub), Media (placeholder/image/video), Compare, Magnetic, Section
    hero/           HeroExperience + HeroScene (procedural architecture, cursor-reactive shaders)
    work/           SelectedWork, ProjectHeader, Chapter, ProjectClosing,
                    ProjectTransition + TransitionCanvas + transitionShapes (3D scan-plane transformation
                    between real line models of the projection room, the house and the AR scene)
      shared/          Mannequin (architectural scale figure)
      dreamspacehub/   SpaceSequence + SpaceCanvas (plan → 3D → projected → 1:1), LiveEditingDiagram
      dreamhometech/   HouseSequence + HouseScene (procedural house + configurator), houseModel (walls/rooms),
                       furnitureLayout + FurnitureKit (procedural furniture), textures, Configurator,
                       PlanRecognition, BuyerWorkflow
      visionarycontrol/ ARPhone + ARScene (phone camera, recognition, anchored controls)
    sections/       TechnologyConstellation, About, Capabilities, Contact
```

## Colour palettes

Palettes live in `src/lib/theme.ts` (five dark, three light); the default is **Paper**. The floating **Palette** pill switches them live and stores the choice in the browser. Change `DEFAULT_THEME` to pick another default (keep the `:root` fallbacks in `globals.css` in sync so the first paint matches), and remove `<ThemeSwitcher />` from `src/app/layout.tsx` if you ever want to hide the picker. Every colour on the site, including the three.js scenes and SVG diagrams, reads from these tokens. On light palettes the projection room, the transitions and the phone screen stay dark via the `.stage-dark` scope, because they are physically dark spaces.

Note for `next dev`: Turbopack does not always recompile `globals.css` after an edit. If a token change doesn't show up, restart the dev server (the production build is always correct).

## Notes

- All 3D is procedural (no model files) and dynamically imported; canvases stop rendering when off-screen.
- `prefers-reduced-motion` disables smooth scroll and pinned sequences and shows final states.
- The nav item **Experiments** anchors to Visionary Control (the experimental project).
- The repo is not yet a git repository; run `git init` before deploying to Vercel.
