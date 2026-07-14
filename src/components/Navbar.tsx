"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import NotificationBell from "@/components/NotificationBell";
import Button from "@/components/ui/Button";

const navLinks = [
  { label: "Forum",        href: "/forum" },
  { label: "The Map",      href: "/venues" },
  { label: "Specials",     href: "/specials" },
  { label: "Trophy Room",  href: "/catches" },
  { label: "Conditions",   href: "/conditions" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadAvatar(u: User | null) {
      if (!u) { setAvatarUrl(null); return; }
      const { data } = await supabase.from("profiles").select("avatar_url").eq("id", u.id).maybeSingle();
      setAvatarUrl(data?.avatar_url ?? null);
    }

    supabase.auth.getUser().then(({ data }) => { setUser(data.user); loadAvatar(data.user); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      loadAvatar(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (!error) { setUser(null); setAvatarUrl(null); }
  }

  const username = user?.user_metadata?.username ?? user?.email?.split("@")[0] ?? "Angler";

  const avatarBadge = (
    <span className="w-7 h-7 rounded-full bg-surface-teal overflow-hidden flex items-center justify-center text-bone-white text-xs font-mono font-semibold flex-shrink-0">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
      ) : (
        username[0]?.toUpperCase()
      )}
    </span>
  );

  return (
    <header className="bg-deep-water border-b border-surface-teal sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0 font-heading font-semibold text-2xl sm:text-3xl text-bone-white leading-none">
            Cast<em className="italic text-cast-orange">Zone</em>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link text-pale-water hover:text-bone-white text-xs font-mono uppercase tracking-wider cz-transition"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop search icon */}
          <Link href="/search" aria-label="Search" className="hidden lg:flex items-center text-pale-water hover:text-bone-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
          </Link>

          {/* Desktop auth */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                <NotificationBell userId={user.id} />
                <Link
                  href={`/profile?username=${encodeURIComponent(username)}`}
                  className="flex items-center gap-2 text-pale-water hover:text-bone-white text-sm font-body transition-colors"
                >
                  {avatarBadge}
                  <span>Hi, <span className="text-bone-white font-medium">{username}</span></span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-storm hover:text-pale-water text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-pale-water hover:text-bone-white text-sm cz-transition">
                  Sign In
                </Link>
                <Button href="/register" size="md">Join Free</Button>
              </>
            )}
          </div>

          {/* Mobile: notification bell + hamburger */}
          <div className="lg:hidden flex items-center gap-1">
            {user && <NotificationBell userId={user.id} />}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-pale-water hover:text-bone-white p-2"
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
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-surface-teal py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-pale-water hover:text-bone-white font-mono uppercase tracking-wider text-sm py-2 cz-transition"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/search"
              onClick={() => setMobileOpen(false)}
              className="block text-pale-water hover:text-bone-white font-mono uppercase tracking-wider text-sm py-2 cz-transition"
            >
              Search
            </Link>
            <div className="flex flex-col gap-2 pt-3 border-t border-surface-teal">
              {user ? (
                <>
                  <Link
                    href={`/profile?username=${encodeURIComponent(username)}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-pale-water text-sm py-1"
                  >
                    {avatarBadge}
                    <span>Hi, <strong className="text-bone-white">{username}</strong></span>
                  </Link>
                  <button onClick={handleSignOut} className="text-storm text-sm text-left py-2">Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-pale-water text-sm py-2">Sign In</Link>
                  <Button href="/register" size="lg" className="w-full">Join Free</Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}