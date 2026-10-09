"use client";

import { projects } from "@/content/projects";
import { useUIStore } from "@/lib/store";
import { scrollTo } from "@/lib/scroll";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";

/**
 * Persistent 01 / 02 / 03 indicator. Visible only while inside Selected Work.
 * Progress per project is driven by ScrollTriggers created here on mount.
 */
export default function ProjectProgress() {
  const active = useUIStore((s) => s.activeProject);
  const progress = useUIStore((s) => s.projectProgress);
  const visible = active > 0;

  useGSAP(() => {
    const { setActiveProject, setProjectProgress } = useUIStore.getState();
    const triggers = projects.map((p, i) =>
      ScrollTrigger.create({
        trigger: `#${p.anchor}`,
        start: "top 60%",
        end: "bottom 40%",
        onUpdate: (self) => setProjectProgress(i, Math.round(self.progress * 100) / 100),
        onToggle: (self) => {
          if (self.isActive) setActiveProject(i + 1);
          else {
            // Leaving the last project forwards or the first backwards hides the indicator.
            const cur = useUIStore.getState().activeProject;
            if (cur === i + 1) {
              if ((i === projects.length - 1 && self.direction === 1) || (i === 0 && self.direction === -1)) {
                setActiveProject(0);
              }
            }
          }
        },
      }),
    );
    // Hide whenever the viewport centre is outside the whole work region
    // (covers nav jumps and programmatic scrolls that skip the per-project toggles).
    const region = ScrollTrigger.create({
      trigger: `#${projects[0].anchor}`,
      endTrigger: `#${projects[projects.length - 1].anchor}`,
      start: "top 60%",
      end: "bottom 40%",
      onToggle: (self) => {
        if (!self.isActive) setActiveProject(0);
      },
    });
    return () => {
      triggers.forEach((t) => t.kill());
      region.kill();
    };
  }, []);

  const current = active > 0 ? projects[active - 1] : null;

  return (
    <>
      {/* Desktop: vertical rail in the left gutter */}
      <aside
        aria-label="Project progress"
        className="fixed left-3 top-1/2 z-[90] hidden -translate-y-1/2 transition-opacity duration-500 lg:block"
        style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
      >
        <ul className="flex flex-col gap-5">
          {projects.map((p, i) => {
            const isActive = active === i + 1;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => scrollTo(`#${p.anchor}`)}
                  className="group flex items-center gap-3"
                  data-cursor="none"
                  aria-label={`Go to ${p.number} ${p.title}`}
                >
                  <span className="flex flex-col items-center gap-1.5">
                    <span className={`t-eyebrow !text-[0.6rem] transition-colors ${isActive ? "!text-accent" : "!text-ink-3"}`}>{p.number}</span>
                    <span className="relative block h-10 w-px overflow-hidden bg-line">
                      <span
                        className="absolute inset-x-0 top-0 h-full origin-top bg-accent transition-transform duration-150 ease-linear"
                        style={{ transform: `scaleY(${progress[i] ?? 0})` }}
                      />
                    </span>
                  </span>
                  <span
                    className={`t-eyebrow pointer-events-none whitespace-nowrap border border-line bg-bg/80 px-2 py-1 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 ${isActive ? "!text-ink" : "!text-ink-2"}`}
                  >
                    {p.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Mobile: slim bottom bar */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 bottom-0 z-[90] transition-opacity duration-500 lg:hidden"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <div className="px-gutter flex items-center justify-between bg-gradient-to-t from-bg to-transparent py-3">
          <span className="t-eyebrow !text-ink">
            {current ? `${current.number} / ${current.title}` : ""}
          </span>
          <span className="t-eyebrow">
            {current ? `${Math.round((progress[active - 1] ?? 0) * 100)}%` : ""}
          </span>
        </div>
        <div className="h-px w-full bg-line">
          <div
            className="h-full origin-left bg-accent"
            style={{ transform: `scaleX(${current ? progress[active - 1] ?? 0 : 0})` }}
          />
        </div>
      </div>
    </>
  );
}
