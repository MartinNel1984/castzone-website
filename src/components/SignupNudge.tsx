"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

const VIEWS_KEY = "cz-venue-views";
const DISMISSED_KEY = "cz-nudge-dismissed-at";
const VIEW_THRESHOLD = 3;
const DISMISS_DAYS = 7;

// Pages where a signup banner would get in the way or look silly.
const QUIET_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export default function SignupNudge() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Count venue detail page views for this browser session.
    if (/^\/venues\/[^/]+$/.test(pathname) && pathname !== "/venues/suggest") {
      const views = Number(sessionStorage.getItem(VIEWS_KEY) ?? "0") + 1;
      sessionStorage.setItem(VIEWS_KEY, String(views));
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: hide on quiet paths
    if (QUIET_PATHS.includes(pathname)) { setShow(false); return; }
    if (Number(sessionStorage.getItem(VIEWS_KEY) ?? "0") < VIEW_THRESHOLD) return;

    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) ?? "0");
    if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;

    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active && !data.user) setShow(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setShow(false);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [pathname]);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShow(false);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-deep-water-light border-t border-cast-orange/50 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3 sm:gap-4">
        <span className="text-2xl flex-shrink-0" aria-hidden>🎣</span>
        <p className="flex-1 text-pale-water text-xs sm:text-sm font-body leading-snug">
          <span className="text-bone-white font-medium">Enjoying CastZone?</span>{" "}
          Create a free account to unlock 7-day bite forecasts, save your venues and join the forum.
        </p>
        <Link
          href="/register"
          className="flex-shrink-0 bg-cast-orange hover:bg-bone-white text-deep-water text-xs sm:text-sm font-heading font-bold uppercase tracking-wider rounded px-3 sm:px-4 py-2 transition-colors"
        >
          Sign up free
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 text-storm hover:text-bone-white text-xl leading-none px-1 transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}
