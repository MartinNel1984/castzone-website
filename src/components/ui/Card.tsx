import Link from "next/link";
import type { ReactNode } from "react";

type CardProps = {
  href?: string;
  external?: boolean;
  className?: string;
  children: ReactNode;
  interactive?: boolean;
};

export default function Card({ href, external = false, className = "", children, interactive = true }: CardProps) {
  const classes = `group bg-deep-water-light border border-surface-teal rounded-lg overflow-hidden ${
    interactive ? "hover:border-cast-orange cz-transition" : ""
  } ${className}`;

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="nofollow sponsored noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return <div className={classes}>{children}</div>;
}
