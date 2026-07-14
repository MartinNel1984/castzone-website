import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🎣</div>
        <h1 className="text-6xl font-heading font-semibold text-cast-orange mb-2">404</h1>
        <h2 className="text-2xl font-heading font-semibold text-bone-white mb-4">
          Nothing on the line
        </h2>
        <p className="text-pale-water font-body mb-8">
          That page doesn&apos;t exist — the fish got away, or the link is broken.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/"
            className="bg-cast-orange hover:bg-cast-orange-hover text-white font-mono font-semibold uppercase tracking-wider px-6 py-3 rounded transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/forum"
            className="border border-surface-teal text-pale-water hover:text-bone-white font-heading font-semibold px-6 py-3 rounded transition-colors"
          >
            Go to Forum
          </Link>
        </div>
      </div>
    </div>
  );
}
