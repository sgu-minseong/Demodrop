import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, MousePointerClick, Play, Send } from "lucide-react";

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

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1fr_0.92fr] lg:py-16">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex rounded-full border border-stone-300 bg-white px-3 py-1 text-sm text-stone-600">
              One link for early product reactions
            </p>
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
                className="inline-flex h-12 items-center justify-center rounded-md border border-stone-300 bg-white px-5 text-base font-medium text-stone-900 transition hover:bg-stone-50"
              >
                View sample
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-[0_24px_80px_rgba(41,37,36,0.12)]">
            <div className="rounded-md border border-stone-200 bg-stone-950 p-4 text-white">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-400">Demo preview</p>
                  <h2 className="text-xl font-semibold">InboxPilot</h2>
                </div>
                <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-stone-950">
                  0:58
                </span>
              </div>
              <div className="flex aspect-video items-center justify-center rounded-md bg-[linear-gradient(135deg,#292524,#0f766e)]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-stone-950 shadow-lg">
                  <Play size={26} fill="currentColor" />
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <PreviewStat label="Understood" value="72%" />
                <PreviewStat label="Interested" value="41%" />
                <PreviewStat label="Visited" value="19%" />
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <PreviewAction icon={<MousePointerClick size={17} />} text="Watch" />
              <PreviewAction icon={<Send size={17} />} text="React" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/10 p-3">
      <p className="text-xs text-stone-400">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function PreviewAction({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="flex h-12 items-center justify-center gap-2 rounded-md bg-[#f3efe7] text-sm font-medium text-stone-800">
      {icon}
      {text}
    </div>
  );
}
