"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
      <p className="max-w-md text-sm text-gray-500">
        An unexpected error occurred. Please try again or contact support if the
        problem persists.
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: "#C9725B" }}
      >
        Try Again
      </button>
    </div>
  );
}
