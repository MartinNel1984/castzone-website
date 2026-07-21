"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

const WHATSAPP_GROUP_URL = process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL;

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If the trigger didn't auto-create the profile, do it from the app
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: data.user.id, username }, { onConflict: "id" });
      if (profileError && !profileError.message.includes("duplicate")) {
        console.warn("Profile creation skipped:", profileError.message);
      }
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-deep-water-light border border-surface-teal rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎣</div>
          <h1 className="text-3xl font-heading font-semibold text-bone-white mb-3">
            You&apos;re In!
          </h1>
          <p className="text-pale-water font-body mb-6">
            Your account is ready and you&apos;re signed in. Tight lines, <strong className="text-bone-white">{username}</strong> — let&apos;s get you on the water.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/forum" className="inline-block bg-cast-orange hover:bg-cast-orange-hover text-white font-mono font-semibold uppercase tracking-wider px-6 py-3 rounded transition-colors">
              Go to the Forum →
            </Link>
            {WHATSAPP_GROUP_URL && (
              <a
                href={WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border border-surface-teal hover:border-cast-orange text-bone-white font-mono font-semibold uppercase tracking-wider px-6 py-3 rounded transition-colors"
              >
                Join our WhatsApp Specials group 🎣
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1 mb-6">
            <span className="text-bone-white text-2xl font-heading font-semibold">Cast<em className="italic text-cast-orange">Zone</em></span>
          </Link>
          <h1 className="text-4xl font-heading font-semibold text-bone-white ">Join Free</h1>
          <p className="text-storm mt-2 font-body">South Africa&apos;s fishing community</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="bg-deep-water-light border border-surface-teal rounded-lg p-8 space-y-5">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 rounded px-4 py-3 text-sm font-body">
              {error}
            </div>
          )}

          <div>
            <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="e.g. BassKing_Gauteng"
              className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
            />
          </div>

          <div>
            <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
            />
          </div>

          <div>
            <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Min. 8 characters"
              className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 text-white font-mono font-semibold uppercase tracking-wider py-4 rounded text-lg transition-colors"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center text-storm text-sm font-body">
            Already a member?{" "}
            <Link href="/login" className="text-cast-orange hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}