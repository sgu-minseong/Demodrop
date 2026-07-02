"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#f7f5f0] px-5 py-10 text-stone-950">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center">
        <section className="w-full rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle size={22} />
            <h1 className="text-2xl font-semibold tracking-normal">
              Something went wrong.
            </h1>
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-600">
            We could not load this page. Check your connection and try again. If
            the issue continues, the server may be having trouble reaching
            Supabase.
          </p>
          {error.digest ? (
            <p className="mt-3 text-xs text-stone-400">Error ID: {error.digest}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={unstable_retry}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-medium text-white hover:bg-stone-800"
            >
              <RotateCcw size={16} />
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              Go home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
