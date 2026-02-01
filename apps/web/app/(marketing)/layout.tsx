import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="border-b border-zinc-800">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            CogCommit
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/features"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Features
            </Link>
            <Link
              href="/docs"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-chronicle-blue text-black rounded-lg font-medium hover:bg-chronicle-blue/90 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-sm">
              Built for AI-assisted developers
            </p>
            <div className="flex items-center gap-4 text-zinc-500 text-sm">
              <a
                href="https://github.com/connorleisz/cogcommit"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                GitHub
              </a>
              <span className="text-zinc-700">|</span>
              <span>MIT License</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
