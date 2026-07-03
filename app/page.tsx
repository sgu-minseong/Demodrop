import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="app-shell">
      <div className="app-container flex min-h-screen flex-col py-5">
        <header className="flex items-center justify-between">
          <Link href="/" className="brand-logo">
            Demodrop
          </Link>
          <Link
            href="/new"
            className="btn-primary h-10 px-4 text-sm"
          >
            Create demo
            <ArrowRight size={16} />
          </Link>
        </header>

        <section className="flex flex-1 items-center py-12 lg:py-16">
          <div className="max-w-3xl">
            <h1 className="hero-title">
              Show your product in{" "}
              <span className="accent-text">60 seconds.</span> See if people
              get it.
            </h1>
            <p className="body-copy mt-6 max-w-xl text-lg">
              Record a quick product demo, share one link, and collect real
              launch reactions.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/new"
                className="btn-primary h-12 px-5 text-base"
              >
                Create demo
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/d/sample"
                className="btn-tertiary h-12 px-1 text-sm sm:px-3"
              >
                View a sample demo
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
