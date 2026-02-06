import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { api } from "~/trpc/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const slides = await api.slide.getAll();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-500">{user.email}</span>
          <a
            href="/settings"
            className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Settings
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your Slides</h2>
        </div>

        {slides.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
            <p className="text-neutral-500">No slides yet. Create your first slide to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
              >
                <h3 className="font-medium">{slide.title}</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {new Date(slide.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
