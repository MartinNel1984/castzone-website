"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { label: "Forum", href: "/forum" },
  { label: "Tackle Box", href: "/classifieds" },
  { label: "The Map", href: "/venues" },
  { label: "Tournaments", href: "/tournaments" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }

  const username = user?.user_metadata?.username ?? user?.email?.split("@")[0] ?? "Angler";

  return (
    <header className="bg-deep-water border-b border-surface-teal sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-cast-orange text-3xl font-heading font-bold leading-none">C</span>
            <span className="text-bone-white text-xl font-heading font-bold tracking-widest uppercase leading-none">
              ASTZONE
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-pale-water hover:text-bone-white text-sm font-body font-medium uppercase tracking-wider transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-pale-water text-sm font-body">
                  Hi, <span className="text-bone-white font-medium">{username}</span>
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-storm hover:text-pale-water text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-pale-water hover:text-bone-white text-sm font-medium transition-colors">
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-cast-orange hover:bg-cast-orange-hover text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
                >
                  Join Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-pale-water hover:text-bone-white p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-surface-teal py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-pale-water hover:text-bone-white font-medium uppercase tracking-wider text-sm py-2"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t border-surface-teal">
              {user ? (
                <>
                  <span className="text-pale-water text-sm py-1">Hi, <strong className="text-bone-white">{username}</strong></span>
                  <button onClick={handleSignOut} className="text-storm text-sm text-left py-2">Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-pale-water text-sm font-medium py-2">Sign In</Link>
                  <Link
                    href="/register"
                    className="bg-cast-orange hover:bg-cast-orange-hover text-white text-sm font-semibold px-4 py-3 rounded text-center transition-colors"
                  >
                    Join Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
