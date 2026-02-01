import Link from "next/link";

export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Document Your AI-Assisted Development
          </h1>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Track, visualize, and share your AI coding conversations. Build a
            portfolio of how you solve problems with Claude, Cursor, and other
            AI tools.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-3 bg-chronicle-blue text-black rounded-lg font-medium hover:bg-chronicle-blue/90 transition-colors"
            >
              Get Started Free
            </Link>
            <a
              href="https://github.com/clokk/cogcommit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Import */}
            <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
              <div className="w-12 h-12 rounded-lg bg-chronicle-blue/20 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-chronicle-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Import</h3>
              <p className="text-zinc-400">
                Automatically import your Claude Code conversations. The CLI
                watches your development sessions and captures everything.
              </p>
            </div>

            {/* Sync */}
            <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
              <div className="w-12 h-12 rounded-lg bg-chronicle-green/20 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-chronicle-green"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Sync</h3>
              <p className="text-zinc-400">
                Push your cognitive commits to the cloud. Access your
                development history from anywhere, across all your machines.
              </p>
            </div>

            {/* Share */}
            <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
              <div className="w-12 h-12 rounded-lg bg-chronicle-purple/20 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-chronicle-purple"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Share</h3>
              <p className="text-zinc-400">
                Build a portfolio of your AI-assisted problem solving. Show how
                you work with AI to build amazing software.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CLI Demo */}
      <section className="py-20 px-6 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Simple CLI, Powerful Results
          </h2>

          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 font-mono text-sm">
            <div className="flex items-center gap-2 mb-4 text-zinc-500">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="ml-2">Terminal</span>
            </div>

            <div className="space-y-2">
              <p>
                <span className="text-chronicle-green">$</span>{" "}
                <span className="text-white">npm install -g cogcommit</span>
              </p>
              <p className="text-zinc-500">Installing cogcommit...</p>
              <p className="text-chronicle-green">
                Installed cogcommit v0.1.0
              </p>
              <p className="mt-4">
                <span className="text-chronicle-green">$</span>{" "}
                <span className="text-white">cogcommit import</span>
              </p>
              <p className="text-zinc-500">Scanning for Claude Code sessions...</p>
              <p className="text-chronicle-green">
                Found 42 sessions in 12 cognitive commits
              </p>
              <p className="mt-4">
                <span className="text-chronicle-green">$</span>{" "}
                <span className="text-white">cogcommit login</span>
              </p>
              <p className="text-zinc-500">
                Opening browser for GitHub authentication...
              </p>
              <p className="text-chronicle-green">
                Authenticated as @your-username
              </p>
              <p className="mt-4">
                <span className="text-chronicle-green">$</span>{" "}
                <span className="text-white">cogcommit push</span>
              </p>
              <p className="text-chronicle-green">
                Pushed 12 commits to cloud
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-zinc-800 bg-zinc-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start Building Your AI Portfolio Today
          </h2>
          <p className="text-zinc-400 mb-8">
            Free and open source. Your data stays yours.
          </p>
          <Link
            href="/login"
            className="inline-flex px-8 py-4 bg-chronicle-blue text-black rounded-lg font-medium text-lg hover:bg-chronicle-blue/90 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}
