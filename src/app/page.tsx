import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <h1 className="text-lg font-semibold">CHW360 Slide Builder</h1>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Build Slides, Effortlessly
          </h2>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
            CHW360 Slide Builder helps you create professional presentations with ease.
            Built for Shechem.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Get Started
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-neutral-300 px-6 py-3 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-neutral-200 px-6 py-4 text-center text-sm text-neutral-500 dark:border-neutral-800">
        CHW360 Slide Builder &mdash; Built for Shechem
      </footer>
    </div>
  );
}
