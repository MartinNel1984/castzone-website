"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

// Pages a logged-out visitor is allowed to see. Everything else requires login.
const PUBLIC_EXACT = ["/"];
const PUBLIC_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password"];

function isPublic(pathname: string): boolean {
  const p = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (PUBLIC_EXACT.includes(p)) return true;
  return PUBLIC_PREFIXES.some((pre) => p === pre || p.startsWith(pre + "/"));
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const pub = isPublic(pathname);
  const [allowed, setAllowed] = useState(pub);

  useEffect(() => {
    if (pub) { setAllowed(true); return; }
    setAllowed(false);

    const supabase = createClient();
    let active = true;

    // getSession() reads the stored session locally — fast, no flash for members.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setAllowed(true);
      } else {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    });

    return () => { active = false; };
  }, [pathname, pub, router]);

  if (allowed) return <>{children}</>;

  // Checking / redirecting — brief, members rarely see this.
  return (
    <div className="max-w-3xl mx-auto px-4 py-32 text-center">
      <p className="text-storm font-body">Loading…</p>
    </div>
  );
}
