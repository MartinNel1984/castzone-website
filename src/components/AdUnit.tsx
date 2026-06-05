"use client";

import { useEffect } from "react";

declare global {
  interface Window { adsbygoogle: unknown[]; }
}

type Props = {
  slot: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal";
  className?: string;
};

export default function AdUnit({ slot, format = "auto", className = "" }: Props) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch { /* AdSense not loaded yet */ }
  }, []);

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: "block" }}
      data-ad-client="ca-pub-9454815992418505"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
