export default function DocsPage() {
  return (
    <div className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">Documentation</h1>
        <p className="text-xl text-zinc-400 mb-12">
          Get started with CogCommit in minutes.
        </p>

        {/* Quick Start */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">Quick Start</h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                1. Install the CLI
              </h3>
              <div className="bg-zinc-900 rounded-lg p-4 font-mono text-sm">
                <span className="text-chronicle-green">$</span>{" "}
                <span className="text-white">npm install -g cogcommit</span>
              </div>
              <p className="text-zinc-400 mt-2">
                Or use npx to run without installing:{" "}
                <code className="bg-zinc-800 px-1 rounded">
                  npx cogcommit --help
                </code>
              </p>
            </div>

            {/* Step 2 */}
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                2. Import your conversations
              </h3>
              <div className="bg-zinc-900 rounded-lg p-4 font-mono text-sm">
                <span className="text-chronicle-green">$</span>{" "}
                <span className="text-white">cogcommit import</span>
              </div>
              <p className="text-zinc-400 mt-2">
                This scans for Claude Code sessions and imports them into your
                local database as cognitive commits.
              </p>
            </div>

            {/* Step 3 */}
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                3. Browse locally
              </h3>
              <div className="bg-zinc-900 rounded-lg p-4 font-mono text-sm">
                <span className="text-chronicle-green">$</span>{" "}
                <span className="text-white">cogcommit dashboard</span>
              </div>
              <p className="text-zinc-400 mt-2">
                Opens the local dashboard in your browser at{" "}
                <code className="bg-zinc-800 px-1 rounded">
                  localhost:4747
                </code>
              </p>
            </div>

            {/* Step 4 */}
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                4. Sync to cloud (optional)
              </h3>
              <div className="bg-zinc-900 rounded-lg p-4 font-mono text-sm space-y-2">
                <p>
                  <span className="text-chronicle-green">$</span>{" "}
                  <span className="text-white">cogcommit login</span>
                </p>
                <p>
                  <span className="text-chronicle-green">$</span>{" "}
                  <span className="text-white">cogcommit push</span>
                </p>
              </div>
              <p className="text-zinc-400 mt-2">
                Login with GitHub and push your commits to access them from
                anywhere.
              </p>
            </div>
          </div>
        </section>

        {/* CLI Commands */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">
            CLI Commands
          </h2>

          <div className="space-y-6">
            <CommandDoc
              command="cogcommit import"
              description="Import Claude Code sessions from all projects"
              options={[
                { flag: "--clear", desc: "Clear existing commits before importing" },
                { flag: "--project", desc: "Import only current project" },
              ]}
            />

            <CommandDoc
              command="cogcommit dashboard"
              description="Launch the local web UI to browse your commits"
              options={[
                { flag: "--port <port>", desc: "Port to run on (default: 4747)" },
              ]}
            />

            <CommandDoc
              command="cogcommit login"
              description="Authenticate with GitHub for cloud sync"
              options={[]}
            />

            <CommandDoc
              command="cogcommit logout"
              description="Clear stored authentication tokens"
              options={[]}
            />

            <CommandDoc
              command="cogcommit push"
              description="Push local commits to the cloud"
              options={[
                { flag: "-v, --verbose", desc: "Show verbose output" },
              ]}
            />

            <CommandDoc
              command="cogcommit pull"
              description="Pull commits from the cloud"
              options={[
                { flag: "-v, --verbose", desc: "Show verbose output" },
              ]}
            />
          </div>
        </section>

        {/* Configuration */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Configuration
          </h2>

          <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
            <p className="text-zinc-300 mb-4">
              CogCommit stores its data in{" "}
              <code className="bg-zinc-800 px-1 rounded">~/.cogcommit/</code>:
            </p>

            <div className="bg-zinc-900 rounded-lg p-4 font-mono text-sm">
              <p className="text-zinc-400"># Data storage</p>
              <p className="text-white">~/.cogcommit/global/data.db</p>
              <p className="text-zinc-400 mt-4"># Authentication</p>
              <p className="text-white">~/.cogcommit/auth.json</p>
              <p className="text-zinc-400 mt-4"># Machine ID</p>
              <p className="text-white">~/.cogcommit/machine-id</p>
            </div>
          </div>
        </section>

        {/* Environment Variables */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">
            Environment Variables
          </h2>

          <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
            <p className="text-zinc-300 mb-4">
              For self-hosted Supabase instances, set these environment
              variables:
            </p>

            <div className="bg-zinc-900 rounded-lg p-4 font-mono text-sm">
              <p className="text-zinc-400"># Required for cloud sync</p>
              <p className="text-white">COGCOMMIT_SUPABASE_URL=your-url</p>
              <p className="text-white">COGCOMMIT_SUPABASE_ANON_KEY=your-key</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function CommandDoc({
  command,
  description,
  options,
}: {
  command: string;
  description: string;
  options: { flag: string; desc: string }[];
}) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
      <code className="text-chronicle-green font-mono">{command}</code>
      <p className="text-zinc-300 mt-2">{description}</p>
      {options.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-700">
          <p className="text-sm text-zinc-500 mb-2">Options:</p>
          <ul className="space-y-1">
            {options.map((opt) => (
              <li key={opt.flag} className="text-sm">
                <code className="text-chronicle-amber">{opt.flag}</code>
                <span className="text-zinc-400 ml-2">{opt.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
