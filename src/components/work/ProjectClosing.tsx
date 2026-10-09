"use client";

import { LineReveal } from "@/components/ui/TextReveal";

export default function ProjectClosing({ number, text, next }: { number: string; text: string; next?: string }) {
  return (
    <div className="px-gutter pb-[4vh] pt-[5vh]">
      <div className="flex flex-col justify-between gap-6 border-t border-line pt-8 md:flex-row md:items-end">
        <LineReveal as="p" className="t-display t-md max-w-[24ch]" lines={[text]} />
        <p className="t-eyebrow shrink-0">
          End of {number}
          {next ? <span className="!text-ink-3"> — next, {next}</span> : null}
        </p>
      </div>
    </div>
  );
}
