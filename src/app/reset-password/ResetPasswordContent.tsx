"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordContent() {
  const router = useRouter();
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [ready, setReady]         = useState(false);
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("Could not update password. The reset link may have expired — request a new one.");
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-deep-water-light border border-surface-teal rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-heading font-semibold text-bone-white mb-3">Password Updated</h1>
          <p className="text-pale-water font-body mb-6">
            Your password has been changed. Redirecting you to sign in...
          </p>
          <Link href="/login" className="text-cast-orange hover:underline font-body text-sm">
            Sign In Now →
          </Link>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-deep-water-light border border-surface-teal rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-2xl font-heading font-semibold text-bone-white mb-3">Checking Reset Link</h1>
          <p className="text-pale-water font-body mb-6">
            Waiting for the reset link to be verified. If this takes more than a few seconds, your link may have expired.
          </p>
          <Link href="/forgot-password" className="text-cast-orange hover:underline font-body text-sm">
            Request a new reset link →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1 mb-6">
            <span className="text-bone-white text-2xl font-heading font-semibold">Cast<em className="italic text-cast-orange">Zone</em></span>
          </Link>
          <h1 className="text-4xl font-heading font-semibold text-bone-white ">New Password</h1>
          <p className="text-storm mt-2 font-body">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-deep-water-light border border-surface-teal rounded-lg p-8 space-y-5">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 rounded px-4 py-3 text-sm font-body">
              {error}
            </div>
          )}

          <div>
            <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              placeholder="Min. 8 characters"
              className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
            />
          </div>

          <div>
            <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="Repeat your password"
              className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 text-white font-mono font-semibold uppercase tracking-wider py-4 rounded text-lg transition-colors"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
