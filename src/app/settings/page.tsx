import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <h1 className="text-lg font-semibold">Settings</h1>
        <a
          href="/dashboard"
          className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          Back to Dashboard
        </a>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold">Account</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-neutral-500">
                  Email
                </label>
                <p className="mt-1">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-500">
                  User ID
                </label>
                <p className="mt-1 font-mono text-sm">{user.id}</p>
              </div>
            </div>
          </section>

          <section className="border-t border-neutral-200 pt-8 dark:border-neutral-800">
            <h2 className="text-lg font-semibold">Session</h2>
            <div className="mt-4">
              <SignOutButton />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
