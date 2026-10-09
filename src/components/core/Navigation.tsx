"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { site, isPlaceholder } from "@/content/site";
import { getLenis, scrollTo } from "@/lib/scroll";
import { useUIStore } from "@/lib/store";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const menuOpen = useUIStore((s) => s.menuOpen);
  const setMenuOpen = useUIStore((s) => s.setMenuOpen);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 48));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Track which nav target is in view.
  useGSAP(() => {
    const triggers = site.nav.map((item) =>
      ScrollTrigger.create({
        trigger: item.href,
        start: "top 50%",
        end: "bottom 50%",
        onToggle: (self) => {
          if (self.isActive) setActive(item.href);
          else setActive((cur) => (cur === item.href ? "" : cur));
        },
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, []);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMenuOpen(false);
    scrollTo(href, { offset: 0 });
  };

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[100]">
        <div
          className="absolute inset-x-0 top-0 h-[calc(var(--nav-h)+28px)] bg-gradient-to-b from-bg via-bg/75 to-transparent transition-opacity duration-500"
          style={{ opacity: scrolled ? 1 : 0 }}
          aria-hidden="true"
        />
        <div className="px-gutter relative flex h-[var(--nav-h)] items-center justify-between">
          {/* Identity */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              scrollTo(0);
            }}
            className="pointer-events-auto group flex items-center gap-3"
            aria-label="Back to top"
          >
            <span className="relative block h-5 w-5">
              <span className="absolute inset-0 border border-ink/70 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:rotate-45" />
              <span className="absolute inset-[5px] bg-accent transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-50" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="t-eyebrow !text-ink">{site.name}</span>
              <span
                className="t-eyebrow mt-1 hidden whitespace-nowrap transition-all duration-500 sm:block"
                style={{
                  opacity: scrolled ? 0 : 1,
                  transform: scrolled ? "translateY(-4px)" : "none",
                }}
              >
                {site.role}
              </span>
            </span>
          </a>

          {/* Links */}
          <nav
            aria-label="Primary"
            className="pointer-events-auto hidden items-center transition-all duration-500 ease-[var(--ease-expo)] md:flex"
            style={{
              borderRadius: 999,
              border: `1px solid ${scrolled ? "rgb(var(--ink-rgb) / 0.12)" : "transparent"}`,
              background: scrolled ? "rgba(10,10,11,0.55)" : "transparent",
              backdropFilter: scrolled ? "blur(14px)" : "none",
              padding: scrolled ? "4px 8px" : "0",
            }}
          >
            {site.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => go(e, item.href)}
                className="t-eyebrow group relative px-4 py-2 !text-ink transition-colors hover:!text-accent"
              >
                <span
                  className="absolute left-1.5 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-accent transition-transform duration-300"
                  style={{ transform: `translateY(-50%) scale(${active === item.href ? 1 : 0})` }}
                />
                {item.label}
              </a>
            ))}
          </nav>

          {/* Availability */}
          <div className="pointer-events-auto hidden items-center gap-2.5 lg:flex">
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span className="absolute h-full w-full rounded-full bg-accent/40 [animation:pulse-ring_2s_ease-out_infinite]" />
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            <span className="t-eyebrow !text-ink">{site.availability}</span>
          </div>

          {/* Mobile */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="t-eyebrow pointer-events-auto !text-ink md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            Menu
          </button>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onGo={go} />
    </>
  );
}

function MobileMenu({
  open,
  onClose,
  onGo,
}: {
  open: boolean;
  onClose: () => void;
  onGo: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const links = el.querySelectorAll<HTMLElement>("[data-menu-link]");
      const meta = el.querySelectorAll<HTMLElement>("[data-menu-meta]");
      if (open) {
        getLenis()?.stop();
        gsap.set(el, { pointerEvents: "auto" });
        gsap.timeline()
          .to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "expo.inOut" })
          .fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.07, ease: "expo.out" }, "-=0.35")
          .fromTo(meta, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, "-=0.6");
      } else {
        getLenis()?.start();
        gsap.set(el, { pointerEvents: "none" });
        gsap.to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.6, ease: "expo.inOut" });
      }
    },
    { dependencies: [open] },
  );

  return (
    <div
      id="mobile-menu"
      ref={ref}
      data-lenis-prevent
      className="pointer-events-none fixed inset-0 z-[200] flex flex-col bg-bg md:hidden"
      style={{ clipPath: "inset(0% 0% 100% 0%)" }}
      aria-hidden={!open}
    >
      <div className="px-gutter flex h-[var(--nav-h)] items-center justify-between">
        <span className="t-eyebrow !text-ink">{site.name}</span>
        <button type="button" onClick={onClose} className="t-eyebrow !text-ink">
          Close
        </button>
      </div>
      <nav aria-label="Mobile" className="px-gutter mt-10 flex flex-col gap-2">
        {site.nav.map((item, i) => (
          <span key={item.href} className="split-line">
            <a
              data-menu-link
              href={item.href}
              onClick={(e) => onGo(e, item.href)}
              className="t-display t-xl split-inner flex items-baseline gap-4 !leading-[1]"
            >
              <span className="t-mono text-ink-3">0{i + 1}</span>
              {item.label}
            </a>
          </span>
        ))}
      </nav>
      <div className="px-gutter mt-auto grid grid-cols-2 gap-6 pb-10">
        <div data-menu-meta>
          <p className="t-eyebrow mb-2">Status</p>
          <p className="t-mono flex items-center gap-2 text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {site.availability}
          </p>
        </div>
        <div data-menu-meta>
          <p className="t-eyebrow mb-2">Based in</p>
          <p className="t-mono text-ink">
            {site.location.city}, {site.location.country}
          </p>
        </div>
        <div data-menu-meta className="col-span-2 flex gap-6">
          {(["email", "github"] as const).map((k) => (
            <a
              key={k}
              href={isPlaceholder(site.links[k]) ? "#contact" : k === "email" ? `mailto:${site.links[k]}` : site.links[k]}
              className="t-eyebrow !text-ink underline-offset-4 hover:underline"
              onClick={(e) => (isPlaceholder(site.links[k]) ? onGo(e, "#contact") : undefined)}
            >
              {k}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
