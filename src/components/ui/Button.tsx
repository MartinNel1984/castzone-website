import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "solid" | "line" | "ghost";
type Size = "md" | "lg";

const base = "inline-flex items-center justify-center font-mono uppercase tracking-wider rounded cz-transition disabled:opacity-50 disabled:pointer-events-none";

const sizes: Record<Size, string> = {
  md: "text-xs px-5 py-2.5",
  lg: "text-sm px-8 py-4",
};

const variants: Record<Variant, string> = {
  solid: "bg-cast-orange hover:bg-cast-orange-hover text-white",
  line: "border border-surface-teal hover:border-pale-water text-pale-water hover:text-bone-white",
  ghost: "text-cast-orange hover:text-bone-white",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

type LinkProps = CommonProps & {
  href: string;
  target?: string;
  rel?: string;
  children?: ReactNode;
};

type NativeButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button(props: LinkProps | NativeButtonProps) {
  const { variant = "solid", size = "md", className = "" } = props;
  const classes = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

  if ("href" in props) {
    const { href, target, rel, children } = props;
    return (
      <Link href={href} target={target} rel={rel} className={classes}>
        {children}
      </Link>
    );
  }

  const { variant: _variant, size: _size, className: _className, ...buttonProps } = props;
  return <button className={classes} {...buttonProps} />;
}
