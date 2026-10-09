"use client";

import { projectById } from "@/content/projects";
import ProjectHeader from "../ProjectHeader";
import Chapter from "../Chapter";
import ProjectClosing from "../ProjectClosing";
import SpaceSequence from "./SpaceSequence";

/** 01 — DreamSpaceHub. Physical, architectural, immersive. */
export default function DreamSpaceHub() {
  const p = projectById("dreamspacehub");
  return (
    <section id={p.anchor} className="relative" aria-label={`${p.number} ${p.title}`}>
      <ProjectHeader project={p} treatment="beam" />
      <div className="mt-[7vh]">
        <SpaceSequence />
      </div>
      <div className="mt-[3vh]">
        {p.chapters.map((c) => (
          <Chapter key={c.index} chapter={c} />
        ))}
      </div>
      <ProjectClosing number={p.number} text={p.closing} next="DreamHomeTech" />
    </section>
  );
}
