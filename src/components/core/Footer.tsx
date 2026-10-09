"use client";

import { site, isPlaceholder } from "@/content/site";
import { scrollTo } from "@/lib/scroll";

export default function Footer() {
  const links = [
    { label: "Email", key: "email" as const },
    { label: "GitHub", key: "github" as const },
  ];

  return (
    <footer className="px-gutter relative border-t border-line pb-10 pt-12">
      <div className="grid-12 items-end gap-y-10">
        <div className="col-span-12 md:col-span-5">
          <p className="t-display t-sm">{site.name}</p>
          <p className="t-eyebrow mt-2">{site.role}</p>
        </div>

        <div className="col-span-6 md:col-span-3">
          <p className="t-eyebrow mb-3">Elsewhere</p>
          <ul className="flex flex-col gap-1.5">
            {links.map((l) => {
              const value = site.links[l.key];
              const placeholder = isPlaceholder(value);
              const href = placeholder ? "#contact" : l.key === "email" ? `mailto:${value}` : value;
              return (
                <li key={l.key}>
                  <a
                    href={href}
                    target={placeholder || l.key === "email" ? undefined : "_blank"}
                    rel={placeholder ? undefined : "noreferrer"}
                    className="t-mono text-ink-2 transition-colors hover:text-accent"
                  >
                    {l.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="col-span-6 md:col-span-4 md:text-right">
          <p className="t-eyebrow">© {site.year}</p>
          <p className="t-eyebrow mt-1.5 !text-ink-3">
            {site.location.city} · {site.location.lat} {site.location.lng}
          </p>
          <button
            type="button"
            onClick={() => scrollTo(0)}
            className="t-eyebrow mt-6 inline-flex items-center gap-2 !text-ink transition-colors hover:!text-accent"
          >
            Back to top <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-2 border-t border-line-2 pt-5 md:flex-row md:items-center md:justify-between">
        <p className="t-eyebrow !text-ink-3">
          04 / This site — Next.js, Three.js, GSAP. Built as the fourth project.
        </p>
        <p className="t-eyebrow !text-ink-3">Designed and built by {site.name}</p>
      </div>
    </footer>
  );
}
