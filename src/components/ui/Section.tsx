import type { ReactNode } from "react";

export function Eyebrow({
  children,
  className = "",
  accent = true,
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <p className={`t-eyebrow flex items-center gap-3 ${className}`}>
      {accent && <span className="h-px w-6 bg-accent" aria-hidden="true" />}
      <span>{children}</span>
    </p>
  );
}

export function Rule({ className = "" }: { className?: string }) {
  return <div className={`hairline ${className}`} aria-hidden="true" />;
}
