import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="app-shell px-5 py-10">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center">
        <section className="surface-card w-full p-6">
          <div className="flex items-center gap-3 text-[#101412]">
            <AlertTriangle size={22} />
            <h1 className="section-title text-2xl">
              Demo not found.
            </h1>
          </div>
          <p className="muted-copy mt-4">
            This demo may not exist, may not be ready yet, or the link may be
            incorrect. Check the URL or ask the creator for a fresh link.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/new"
              className="btn-primary h-11 px-4 text-sm"
            >
              Create a demo
            </Link>
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
