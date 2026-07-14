import Link from "next/link";
import type { ReactNode } from "react";

type SectionProps = {
  title?: string;
  action?: { label: string; href: string };
  className?: string;
  contentClassName?: string;
  children: ReactNode;
  bleed?: boolean;
};

export default function Section({
  title,
  action,
  className = "",
  contentClassName = "",
  children,
  bleed = false,
}: SectionProps) {
  const inner = (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 ${contentClassName}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          {title && <h2 className="text-3xl font-heading font-semibold text-bone-white">{title}</h2>}
          {action && (
            <Link
              href={action.href}
              className="font-mono text-xs uppercase tracking-wider text-cast-orange hover:text-bone-white cz-transition"
            >
              {action.label} &rarr;
            </Link>
          )}
        </div>
      )}
      {children}
    </div>
  );

  return bleed ? (
    <section className={`bg-deep-water-light border-t border-b border-surface-teal ${className}`}>{inner}</section>
  ) : (
    <section className={`border-b border-surface-teal ${className}`}>{inner}</section>
  );
}
