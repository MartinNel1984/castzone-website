"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function ForgotPasswordContent() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError("Something went wrong. Please check the email address and try again.");
    } else {
      setDone(true);
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-deep-water-light border border-surface-teal rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-heading font-semibold text-bone-white mb-3">
            Check Your Inbox
          </h1>
          <p className="text-pale-water font-body mb-2">
            We&apos;ve sent a password reset link to <strong className="text-bone-white">{email}</strong>.
          </p>
          <p className="text-storm text-sm font-body mb-6">
            Click the link in the email to choose a new password. Check your spam folder if it doesn&apos;t arrive within a few minutes.
          </p>
          <Link href="/login" className="text-cast-orange hover:underline font-body text-sm">
            ← Back to Sign In
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
          <h1 className="text-4xl font-heading font-semibold text-bone-white ">Reset Password</h1>
          <p className="text-storm mt-2 font-body">Enter your email and we&apos;ll send a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-deep-water-light border border-surface-teal rounded-lg p-8 space-y-5">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 rounded px-4 py-3 text-sm font-body">
              {error}
            </div>
          )}

          <div>
            <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="you@example.com"
              className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 text-white font-mono font-semibold uppercase tracking-wider py-4 rounded text-lg transition-colors"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <p className="text-center text-storm text-sm font-body">
            Remembered it?{" "}
            <Link href="/login" className="text-cast-orange hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
