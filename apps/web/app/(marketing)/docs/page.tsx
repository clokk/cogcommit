export default function DocsPage() {
  return (
    <div className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-primary mb-4">Documentation</h1>
        <p className="text-xl text-muted mb-12">
          Get started with CogCommit in minutes.
        </p>

        {/* Quick Start */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-primary mb-6">Quick Start</h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div>
              <h3 className="text-lg font-medium text-primary mb-2">
                1. Install the CLI
              </h3>
              <div className="bg-bg rounded-lg p-4 font-mono text-sm">
                <span className="text-chronicle-green">$</span>{" "}
                <span className="text-primary">npm install -g cogcommit</span>
              </div>
              <p className="text-muted mt-2">
                Or use npx to run without installing:{" "}
                <code className="bg-panel px-1 rounded">
                  npx cogcommit --help
                </code>
              </p>
            </div>

            {/* Step 2 */}
            <div>
              <h3 className="text-lg font-medium text-primary mb-2">
                2. Import your conversations
              </h3>
              <div className="bg-bg rounded-lg p-4 font-mono text-sm">
                <span className="text-chronicle-green">$</span>{" "}
                <span className="text-primary">cogcommit import</span>
              </div>
              <p className="text-muted mt-2">
                This scans for Claude Code sessions and imports them into your
                local database as cognitive commits.
              </p>
            </div>

            {/* Step 3 */}
            <div>
              <h3 className="text-lg font-medium text-primary mb-2">
                3. Browse locally
              </h3>
              <div className="bg-bg rounded-lg p-4 font-mono text-sm">
                <span className="text-chronicle-green">$</span>{" "}
                <span className="text-primary">cogcommit dashboard</span>
              </div>
              <p className="text-muted mt-2">
                Opens the local dashboard in your browser at{" "}
                <code className="bg-panel px-1 rounded">
                  localhost:4747
                </code>
              </p>
            </div>

            {/* Step 4 */}
            <div>
              <h3 className="text-lg font-medium text-primary mb-2">
                4. Sync to cloud (optional)
              </h3>
              <div className="bg-bg rounded-lg p-4 font-mono text-sm space-y-2">
                <p>
                  <span className="text-chronicle-green">$</span>{" "}
                  <span className="text-primary">cogcommit login</span>
                </p>
                <p>
                  <span className="text-chronicle-green">$</span>{" "}
                  <span className="text-primary">cogcommit push</span>
                </p>
              </div>
              <p className="text-muted mt-2">
                Login with GitHub and push your commits to access them from
                anywhere.
              </p>
            </div>
          </div>
        </section>

        {/* CLI Commands */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-primary mb-6">
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
                { flag: "--dry-run", desc: "Preview what would be pushed" },
                { flag: "--force", desc: "Re-push all commits (resets sync status)" },
                { flag: "--retry", desc: "Retry previously failed commits" },
              ]}
            />

            <CommandDoc
              command="cogcommit pull"
              description="Pull commits from the cloud"
              options={[
                { flag: "-v, --verbose", desc: "Show verbose output" },
              ]}
            />

            <CommandDoc
              command="cogcommit stats"
              description="View commit statistics"
              options={[
                { flag: "--project <name>", desc: "Filter by project" },
                { flag: "--json", desc: "Output as JSON" },
              ]}
            />

            <CommandDoc
              command="cogcommit search <query>"
              description="Search through your conversations"
              options={[
                { flag: "--project <name>", desc: "Filter by project" },
                { flag: "--limit <n>", desc: "Limit results (default: 20)" },
              ]}
            />

            <CommandDoc
              command="cogcommit export"
              description="Export commits to JSON or Markdown"
              options={[
                { flag: "-o, --output <file>", desc: "Output file path" },
                { flag: "--format <type>", desc: "json or markdown" },
                { flag: "--project <name>", desc: "Filter by project" },
              ]}
            />
          </div>
        </section>

        {/* Free Tier */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-primary mb-6">
            Free Tier Limits
          </h2>

          <div className="bg-panel/50 rounded-lg p-6 border border-border">
            <p className="text-primary mb-4">
              Cloud sync has usage limits on the free tier:
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-bg rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-chronicle-blue">250</div>
                <div className="text-muted">commits</div>
              </div>
              <div className="bg-bg rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-chronicle-blue">50 MB</div>
                <div className="text-muted">storage</div>
              </div>
            </div>

            <p className="text-muted mb-4">
              <strong className="text-primary">Local usage is unlimited.</strong>{" "}
              When pushing, only the most recent commits sync up to the limit.
            </p>

            <p className="text-muted">
              <strong className="text-primary">Automatically filtered:</strong>{" "}
              Warmup sessions and empty commits don&apos;t count against your limit.
            </p>
          </div>
        </section>

        {/* Configuration */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-primary mb-6">
            Configuration
          </h2>

          <div className="bg-panel/50 rounded-lg p-6 border border-border">
            <p className="text-primary mb-4">
              CogCommit stores its data in{" "}
              <code className="bg-panel px-1 rounded">~/.cogcommit/</code>:
            </p>

            <div className="bg-bg rounded-lg p-4 font-mono text-sm">
              <p className="text-muted"># Data storage</p>
              <p className="text-primary">~/.cogcommit/global/data.db</p>
              <p className="text-muted mt-4"># Authentication</p>
              <p className="text-primary">~/.cogcommit/auth.json</p>
              <p className="text-muted mt-4"># Machine ID</p>
              <p className="text-primary">~/.cogcommit/machine-id</p>
            </div>
          </div>
        </section>

        {/* Environment Variables */}
        <section>
          <h2 className="text-2xl font-semibold text-primary mb-6">
            Environment Variables
          </h2>

          <div className="bg-panel/50 rounded-lg p-6 border border-border">
            <p className="text-primary mb-4">
              For self-hosted Supabase instances, set these environment
              variables:
            </p>

            <div className="bg-bg rounded-lg p-4 font-mono text-sm">
              <p className="text-muted"># Required for cloud sync</p>
              <p className="text-primary">COGCOMMIT_SUPABASE_URL=your-url</p>
              <p className="text-primary">COGCOMMIT_SUPABASE_ANON_KEY=your-key</p>
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
    <div className="bg-panel/50 rounded-lg p-4 border border-border">
      <code className="text-chronicle-green font-mono">{command}</code>
      <p className="text-primary mt-2">{description}</p>
      {options.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-sm text-muted mb-2">Options:</p>
          <ul className="space-y-1">
            {options.map((opt) => (
              <li key={opt.flag} className="text-sm">
                <code className="text-chronicle-amber">{opt.flag}</code>
                <span className="text-muted ml-2">{opt.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
