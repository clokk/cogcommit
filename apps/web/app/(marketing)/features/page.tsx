export default function FeaturesPage() {
  return (
    <div className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">Features</h1>
        <p className="text-xl text-zinc-400 mb-12">
          Everything you need to document and share your AI-assisted development
          journey.
        </p>

        {/* Feature sections */}
        <div className="space-y-16">
          {/* Automatic Import */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Automatic Import
            </h2>
            <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
              <p className="text-zinc-300 mb-4">
                The CogCommit CLI automatically discovers and imports your
                Claude Code conversation logs. Just point it at your project
                directory and it handles the rest.
              </p>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-chronicle-green mt-1">-</span>
                  Parses Claude Code JSONL log files
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-chronicle-green mt-1">-</span>
                  Groups conversations into cognitive commits
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-chronicle-green mt-1">-</span>
                  Links commits to git history automatically
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-chronicle-green mt-1">-</span>
                  Tracks files read and changed during each session
                </li>
              </ul>
            </div>
          </section>

          {/* Multiple Sources */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Multiple AI Sources
            </h2>
            <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
              <p className="text-zinc-300 mb-4">
                Import conversations from multiple AI coding assistants:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Claude Code
                </div>
                <div className="flex items-center gap-2 text-purple-400">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  Cursor
                </div>
                <div className="flex items-center gap-2 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  Antigravity
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Codex
                </div>
                <div className="flex items-center gap-2 text-orange-400">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  OpenCode
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                  More coming...
                </div>
              </div>
            </div>
          </section>

          {/* Cloud Sync */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Cloud Sync
            </h2>
            <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
              <p className="text-zinc-300 mb-4">
                Sync your cognitive commits across all your machines with secure
                cloud storage.
              </p>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-chronicle-green mt-1">-</span>
                  GitHub OAuth authentication
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-chronicle-green mt-1">-</span>
                  End-to-end encrypted data transfer
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-chronicle-green mt-1">-</span>
                  Conflict resolution for multi-machine workflows
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-chronicle-green mt-1">-</span>
                  Offline-first with automatic sync when online
                </li>
              </ul>
            </div>
          </section>

          {/* Local Dashboard */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Local Dashboard
            </h2>
            <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
              <p className="text-zinc-300 mb-4">
                Browse and search your conversations locally with the built-in
                dashboard interface.
              </p>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-chronicle-green mt-1">-</span>
                  Run {`\`cogcommit dashboard\``} to launch locally
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-chronicle-green mt-1">-</span>
                  Full-text search across all conversations
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-chronicle-green mt-1">-</span>
                  Export conversations as Markdown or plain text
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-chronicle-green mt-1">-</span>
                  Keyboard shortcuts for efficient navigation
                </li>
              </ul>
            </div>
          </section>

          {/* Web Dashboard */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Web Dashboard
            </h2>
            <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
              <p className="text-zinc-300 mb-4">
                Access your synced commits from anywhere with the web dashboard.
              </p>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-chronicle-green mt-1">-</span>
                  View all your cloud-synced commits
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-chronicle-green mt-1">-</span>
                  Filter by project, source, or date
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-chronicle-green mt-1">-</span>
                  Same GitHub account as CLI
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-chronicle-green mt-1">-</span>
                  Coming soon: public profiles and sharing
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
