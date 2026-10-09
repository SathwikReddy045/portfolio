"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { Eyebrow } from "@/components/ui/Section";
import { Fade, ScrubWords } from "@/components/ui/TextReveal";
import Media from "@/components/ui/Media";

const MANIFESTO = [
  "I am a software engineer first. The visuals are the part you can see; the systems underneath are the part I build.",
  "I am interested in the space between software and reality.",
  "I build systems that allow digital information to move into physical environments, and physical environments to become interactive interfaces.",
  "From architectural projection systems to automated 3D homes and AR interfaces, my work explores what happens when technology becomes something you can see, walk through and interact with.",
];

function LocalTime() {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: site.location.timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="t-mono tabular-nums text-ink" suppressHydrationWarning>
      {time} IST
    </span>
  );
}

export default function About() {
  return (
    <section id="about" className="px-gutter relative py-[12vh]">
      <div className="grid-12 gap-y-10">
        <div className="col-span-12 lg:col-span-3">
          <Eyebrow>About</Eyebrow>
          <p className="t-eyebrow mt-3 !text-ink-3">Engineer first. Not a resume, a position.</p>
        </div>
        <div className="col-span-12 lg:col-span-9">
          {MANIFESTO.map((p, i) => (
            <ScrubWords key={i} text={p} className={`t-manifesto ${i === 0 ? "" : "mt-8"} ${i === 0 ? "text-ink" : ""}`} />
          ))}
        </div>
      </div>

      <div className="grid-12 mt-[8vh] gap-y-10 border-t border-line pt-10">
        <Fade className="col-span-6 lg:col-span-3">
          <p className="t-eyebrow">Location</p>
          <p className="t-display t-sm mt-3">
            {site.location.city}
            <br />
            {site.location.country}
          </p>
          <p className="t-mono mt-3 text-ink-3">
            {site.location.lat}
            <br />
            {site.location.lng}
          </p>
        </Fade>
        <Fade className="col-span-6 lg:col-span-3" delay={0.1}>
          <p className="t-eyebrow">Local time</p>
          <p className="mt-3">
            <LocalTime />
          </p>
          <p className="t-eyebrow mt-6">Status</p>
          <p className="t-mono mt-3 flex items-center gap-2 text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {site.availability}
          </p>
        </Fade>
        <Fade className="col-span-12 lg:col-span-3" delay={0.2}>
          <p className="t-eyebrow">Focus</p>
          <ul className="mt-3 space-y-1.5">
            {site.focus.map((f) => (
              <li key={f} className="t-display t-sm">
                {f}
              </li>
            ))}
          </ul>
        </Fade>
        <div className="col-span-12 lg:col-span-3">
          <Media id="about.portrait" />
        </div>
      </div>
    </section>
  );
}
