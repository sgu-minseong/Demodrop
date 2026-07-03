import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-stone-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Demodrop
          </Link>
          <Link
            href="/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Create demo
            <ArrowRight size={16} />
          </Link>
        </header>

        <section className="flex flex-1 items-center py-12 lg:py-16">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-normal text-stone-950 sm:text-6xl lg:text-7xl">
              Show your product in 60 seconds. See if people get it.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">
              Record a quick product demo, share one link, and collect real
              launch reactions.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/new"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-stone-950 px-5 text-base font-medium text-white transition hover:bg-stone-800"
              >
                Create demo
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/d/sample"
                className="inline-flex h-12 items-center justify-center rounded-md px-1 text-sm font-medium text-stone-600 underline underline-offset-4 transition hover:text-stone-950 sm:px-3"
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
