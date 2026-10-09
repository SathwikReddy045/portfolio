"use client";

import { projectById } from "@/content/projects";
import ProjectHeader from "../ProjectHeader";
import Chapter from "../Chapter";
import ProjectClosing from "../ProjectClosing";
import ARPhone from "./ARPhone";

/** 03 — Visionary Control. AR, computer vision, future interface. */
export default function VisionaryControl() {
  const p = projectById("visionarycontrol");
  return (
    <section id="experiments" className="relative" aria-label={`${p.number} ${p.title}`}>
      <div id={p.anchor}>
        <ProjectHeader project={p} treatment="reticle" />
        <div className="mt-[7vh]">
          <ARPhone />
        </div>
        <div className="mt-[3vh]">
          {p.chapters.map((c) => (
            <Chapter key={c.index} chapter={c} />
          ))}
        </div>
        <ProjectClosing number={p.number} text={p.closing} />
      </div>
    </section>
  );
}
