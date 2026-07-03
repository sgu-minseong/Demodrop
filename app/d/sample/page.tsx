import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";

export default function SampleDemoPage() {
  return (
    <main className="app-shell">
      <div className="app-container max-w-5xl">
        <header className="flex items-center justify-between">
          <Link href="/" className="brand-logo">
            Demodrop
          </Link>
          <Link
            href="/manage/sample"
            className="btn-secondary h-10 px-4 text-sm"
          >
            Manage sample
          </Link>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="page-eyebrow">Public demo</p>
            <h1 className="page-title mt-2">
              InboxPilot
            </h1>
            <p className="body-copy mt-3 max-w-2xl text-lg">
              AI triage for busy support inboxes.
            </p>

            <div className="surface-card mt-6 p-3">
              <div className="flex aspect-video min-h-56 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#0B0F0E,#243028)] text-white">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#A3FF12] text-[#101412] shadow-lg">
                    <Play size={26} fill="currentColor" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[#DDE6D8]">
                    Video placeholder
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="surface-card p-4">
              <h2 className="section-title">Quick feedback</h2>
              <div className="mt-4 space-y-4">
                <FeedbackScale label="How clear was the demo?" />
                <FeedbackScale label="How interested are you?" />
                <label className="block">
                  <span className="label-text">
                    What is still unclear?
                  </span>
                  <textarea
                    className="input-control mt-2 min-h-28 resize-none p-3 text-sm"
                    placeholder="Write a short reaction..."
                  />
                </label>
                <button
                  type="button"
                  className="btn-primary h-11 w-full px-4 text-sm"
                >
                  Send feedback
                </button>
              </div>
            </div>

            <a
              href="https://example.com"
              className="btn-primary h-12 px-4 text-sm"
            >
              Visit product
              <ArrowUpRight size={17} />
            </a>
          </aside>
        </section>

        <footer className="py-10 text-center text-sm text-[#C7CEC5]">
          Made with Demodrop
        </footer>
      </div>
    </main>
  );
}

function FeedbackScale({ label }: { label: string }) {
  return (
    <fieldset>
      <legend className="label-text">{label}</legend>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className="choice-button h-10"
          >
            {value}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
