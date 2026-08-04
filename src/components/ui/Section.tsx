import Link from "next/link";
import type { ReactNode } from "react";

type SectionProps = {
  title?: string;
  action?: { label: string; href: string };
  className?: string;
  contentClassName?: string;
  children: ReactNode;
  bleed?: boolean;
  /** Adds the hand-drawn linework texture behind the section content (mural-wall pattern). */
  texture?: boolean;
};

export default function Section({
  title,
  action,
  className = "",
  contentClassName = "",
  children,
  bleed = false,
  texture = false,
}: SectionProps) {
  const inner = (
    <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 ${contentClassName}`}>
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

  const textureLayer = texture && <div className="cz-linework" aria-hidden="true" />;

  return bleed ? (
    <section className={`relative overflow-hidden bg-deep-water-light border-t border-b border-surface-teal ${className}`}>
      {textureLayer}
      {inner}
    </section>
  ) : (
    <section className={`relative overflow-hidden border-b border-surface-teal ${className}`}>
      {textureLayer}
      {inner}
    </section>
  );
}
