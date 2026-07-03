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
    <main className="app-shell px-5 py-10">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center">
        <section className="surface-card w-full p-6">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle size={22} />
            <h1 className="section-title text-2xl">
              Something went wrong.
            </h1>
          </div>
          <p className="muted-copy mt-4">
            We could not load this page. Check your connection and try again. If
            the issue continues, the server may be having trouble reaching
            Supabase.
          </p>
          {error.digest ? (
            <p className="mt-3 text-xs text-[#6B7280]">Error ID: {error.digest}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={unstable_retry}
              className="btn-primary h-11 px-4 text-sm"
            >
              <RotateCcw size={16} />
              Try again
            </button>
            <Link
              href="/"
              className="btn-secondary h-11 px-4 text-sm"
            >
              Go home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
