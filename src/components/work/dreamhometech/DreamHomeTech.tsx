"use client";

import { projectById } from "@/content/projects";
import ProjectHeader from "../ProjectHeader";
import Chapter from "../Chapter";
import ProjectClosing from "../ProjectClosing";
import HouseSequence from "./HouseSequence";

/** 02 — DreamHomeTech. Product, 3D, construction, future home. */
export default function DreamHomeTech() {
  const p = projectById("dreamhometech");
  return (
    <section id={p.anchor} className="relative" aria-label={`${p.number} ${p.title}`}>
      <ProjectHeader project={p} treatment="blueprint" />
      <div className="mt-[7vh]">
        <HouseSequence />
      </div>
      <div className="mt-[3vh]">
        {p.chapters.map((c) => (
          <Chapter key={c.index} chapter={c} />
        ))}
      </div>
      <ProjectClosing number={p.number} text={p.closing} next="Visionary Control" />
    </section>
  );
}
