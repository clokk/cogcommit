import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function signOut() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const githubUsername =
    user.user_metadata?.user_name ||
    user.user_metadata?.preferred_username ||
    user.email?.split("@")[0] ||
    "Unknown";

  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

        {/* Profile section */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-white mb-4">Profile</h2>
          <div className="bg-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={githubUsername}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center text-2xl font-medium">
                  {githubUsername[0].toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-lg font-medium text-white">
                  {githubUsername}
                </h3>
                <p className="text-sm text-zinc-400">{user.email}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-700">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-zinc-400">GitHub Username</dt>
                  <dd className="text-white">{githubUsername}</dd>
                </div>
                <div>
                  <dt className="text-sm text-zinc-400">User ID</dt>
                  <dd className="text-white font-mono text-sm">{user.id}</dd>
                </div>
                <div>
                  <dt className="text-sm text-zinc-400">Account Created</dt>
                  <dd className="text-white">
                    {new Date(user.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* CLI section */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-white mb-4">CLI Setup</h2>
          <div className="bg-zinc-800 rounded-lg p-6">
            <p className="text-zinc-300 mb-4">
              Use the CogCommit CLI to sync your local cognitive commits
              to the cloud.
            </p>

            <div className="bg-zinc-900 rounded-lg p-4 font-mono text-sm">
              <p className="text-zinc-400 mb-2"># Install the CLI</p>
              <p className="text-chronicle-green">
                npm install -g cogcommit
              </p>
              <p className="text-zinc-400 mt-4 mb-2"># Login with GitHub</p>
              <p className="text-chronicle-green">cogcommit login</p>
              <p className="text-zinc-400 mt-4 mb-2"># Push your commits</p>
              <p className="text-chronicle-green">cogcommit push</p>
            </div>
          </div>
        </section>

        {/* Sign out section */}
        <section>
          <h2 className="text-lg font-medium text-white mb-4">Account</h2>
          <div className="bg-zinc-800 rounded-lg p-6">
            <form action={signOut}>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
