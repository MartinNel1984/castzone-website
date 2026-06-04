"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Incorrect email or password.");
    } else {
      router.push("/");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1 mb-6">
            <span className="text-cast-orange text-3xl font-heading font-bold">C</span>
            <span className="text-bone-white text-xl font-heading font-bold tracking-widest uppercase">ASTZONE</span>
          </Link>
          <h1 className="text-4xl font-heading font-bold text-bone-white uppercase">Welcome Back</h1>
          <p className="text-storm mt-2 font-body">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-deep-water-light border border-surface-teal rounded-lg p-8 space-y-5">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 rounded px-4 py-3 text-sm font-body">
              {error}
            </div>
          )}

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
              placeholder="Your password"
              className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 text-white font-heading font-bold uppercase tracking-wider py-4 rounded text-lg transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-storm text-sm font-body">
            Not a member yet?{" "}
            <Link href="/register" className="text-cast-orange hover:underline">
              Join free
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
