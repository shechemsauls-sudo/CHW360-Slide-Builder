import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-amber-100 via-yellow-200 to-amber-400 dark:from-amber-950 dark:via-yellow-900 dark:to-amber-800">
      <header className="flex items-center justify-between border-b border-amber-300/40 px-6 py-4 dark:border-amber-700/40">
        <h1 className="text-lg font-semibold text-amber-950 dark:text-amber-100">CHW360 Slide Builder</h1>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 dark:bg-amber-100 dark:text-amber-900 dark:hover:bg-amber-200"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-amber-950 sm:text-5xl dark:text-amber-50">
            Build Slides, Effortlessly
          </h2>
          <p className="mt-4 text-lg text-amber-800 dark:text-amber-200">
            CHW360 Slide Builder helps you create professional presentations with ease.
            Built for Shechem.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-amber-900 px-6 py-3 text-sm font-medium text-white hover:bg-amber-800 dark:bg-amber-100 dark:text-amber-900 dark:hover:bg-amber-200"
            >
              Get Started
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-amber-400 px-6 py-3 text-sm font-medium text-amber-900 hover:bg-amber-200/50 dark:border-amber-600 dark:text-amber-100 dark:hover:bg-amber-800/50"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-amber-300/40 px-6 py-4 text-center text-sm text-amber-700 dark:border-amber-700/40 dark:text-amber-300">
        CHW360 Slide Builder &mdash; Built for Shechem
      </footer>
    </div>
  );
}
