import type Lenis from "lenis";

let lenis: Lenis | null = null;

export const setLenis = (instance: Lenis | null) => {
  lenis = instance;
};

export const getLenis = () => lenis;

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

export function scrollTo(
  target: string | number | HTMLElement,
  opts: { offset?: number; duration?: number; immediate?: boolean } = {},
) {
  if (lenis) {
    lenis.scrollTo(target, {
      offset: opts.offset ?? 0,
      duration: opts.duration ?? 1.6,
      easing: easeOutQuart,
      immediate: opts.immediate,
    });
    return;
  }
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: "smooth" });
    return;
  }
  const el =
    typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}
