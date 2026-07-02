import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";

export default function SampleDemoPage() {
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-stone-950">
      <div className="mx-auto w-full max-w-5xl px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Demodrop
          </Link>
          <Link
            href="/manage/sample"
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Manage sample
          </Link>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-sm font-medium text-teal-700">Public demo</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal sm:text-5xl">
              InboxPilot
            </h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-stone-600">
              AI triage for busy support inboxes.
            </p>

            <div className="mt-6 rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
              <div className="flex aspect-video min-h-56 items-center justify-center rounded-md bg-[linear-gradient(135deg,#292524,#0f766e)] text-white">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-stone-950 shadow-lg">
                    <Play size={26} fill="currentColor" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-stone-200">
                    Video placeholder
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold">Quick feedback</h2>
              <div className="mt-4 space-y-4">
                <FeedbackScale label="How clear was the demo?" />
                <FeedbackScale label="How interested are you?" />
                <label className="block">
                  <span className="text-sm font-medium text-stone-700">
                    What is still unclear?
                  </span>
                  <textarea
                    className="mt-2 min-h-28 w-full resize-none rounded-md border border-stone-300 bg-white p-3 text-sm outline-none placeholder:text-stone-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                    placeholder="Write a short reaction..."
                  />
                </label>
                <button
                  type="button"
                  className="h-11 w-full rounded-md bg-stone-950 px-4 text-sm font-medium text-white hover:bg-stone-800"
                >
                  Send feedback
                </button>
              </div>
            </div>

            <a
              href="https://example.com"
              className="flex h-12 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-medium text-white hover:bg-teal-800"
            >
              Visit product
              <ArrowUpRight size={17} />
            </a>
          </aside>
        </section>

        <footer className="py-10 text-center text-sm text-stone-500">
          Made with Demodrop
        </footer>
      </div>
    </main>
  );
}

function FeedbackScale({ label }: { label: string }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-stone-700">{label}</legend>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className="h-10 rounded-md border border-stone-200 bg-[#fbfaf7] text-sm font-medium text-stone-800 hover:border-teal-700"
          >
            {value}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
