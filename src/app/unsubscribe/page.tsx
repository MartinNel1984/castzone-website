"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Status = "checking" | "done" | "error";

function UnsubscribeContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const u = params.get("u");
    const t = params.get("t");
    if (!u || !t) {
      setStatus("error");
      return;
    }
    const supabase = createClient();
    supabase
      .rpc("unsubscribe_deal_email", { p_user: u, p_sig: t })
      .then(({ data, error }) => {
        setStatus(!error && data ? "done" : "error");
      });
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-deep-water-light border border-surface-teal rounded-lg p-8 max-w-md w-full text-center">
        {status === "checking" && (
          <>
            <div className="text-5xl mb-4">⏳</div>
            <h1 className="text-2xl font-heading font-semibold text-bone-white mb-3">One moment…</h1>
            <p className="text-pale-water font-body">Unsubscribing you from Specials deal emails.</p>
          </>
        )}
        {status === "done" && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-heading font-semibold text-bone-white mb-3">You&apos;re Unsubscribed</h1>
            <p className="text-pale-water font-body mb-6">
              You won&apos;t get any more Specials deal emails. Your CastZone account, bell notifications and the
              WhatsApp group are unaffected — this only turns off email.
            </p>
            <Link href="/specials" className="text-cast-orange-text hover:underline font-body text-sm">
              Back to Specials →
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-heading font-semibold text-bone-white mb-3">Link Didn&apos;t Work</h1>
            <p className="text-pale-water font-body mb-6">
              This unsubscribe link is invalid or expired. Email{" "}
              <a href="mailto:unsubscribe@castzone.co.za?subject=unsubscribe" className="text-cast-orange-text hover:underline">
                unsubscribe@castzone.co.za
              </a>{" "}
              and we&apos;ll turn off deal emails for you manually.
            </p>
            <Link href="/" className="text-cast-orange-text hover:underline font-body text-sm">
              Back to CastZone →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-20 text-center"><p className="text-storm-text font-body">Loading…</p></div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
