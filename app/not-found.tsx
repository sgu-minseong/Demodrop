import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#f7f5f0] px-5 py-10 text-stone-950">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center">
        <section className="w-full rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-stone-900">
            <AlertTriangle size={22} />
            <h1 className="text-2xl font-semibold tracking-normal">
              Demo not found.
            </h1>
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-600">
            This demo may not exist, may not be ready yet, or the link may be
            incorrect. Check the URL or ask the creator for a fresh link.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/new"
              className="inline-flex h-11 items-center justify-center rounded-md bg-stone-950 px-4 text-sm font-medium text-white hover:bg-stone-800"
            >
              Create a demo
            </Link>
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
