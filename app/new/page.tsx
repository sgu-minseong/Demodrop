import Link from "next/link";
import type { ReactNode } from "react";
import { Circle, Mic, MonitorUp, Video } from "lucide-react";

const questions = [
  "What do you think this product helps you do?",
  "How interested are you in trying it?",
  "What is still unclear?",
];

export default function NewDemoPage() {
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-stone-950">
      <div className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Demodrop
          </Link>
          <Link
            href="/d/sample"
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Sample
          </Link>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section>
            <p className="text-sm font-medium text-teal-700">New demo</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal sm:text-5xl">
              Create a shareable product demo.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-stone-600">
              Keep it short, direct, and easy to react to. This screen is static
              for now, so the button does not create a real demo yet.
            </p>

            <form className="mt-8 space-y-4">
              <Field label="Product name" placeholder="InboxPilot" />
              <Field
                label="One-line description"
                placeholder="AI triage for busy support inboxes"
              />
              <Field label="Product URL" placeholder="https://example.com" />
              <button
                type="button"
                className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-5 text-base font-medium text-white hover:bg-stone-800 sm:w-auto"
              >
                Create demo
              </button>
            </form>
          </section>

          <section className="space-y-4">
            <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Recording area</h2>
                  <p className="text-sm text-stone-500">
                    Screen, mic, and camera controls will live here.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                  <Circle size={10} fill="currentColor" />
                  Ready
                </span>
              </div>
              <div className="flex aspect-video min-h-56 items-center justify-center rounded-md border border-dashed border-stone-300 bg-stone-100">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-stone-900 shadow-sm">
                    <Video size={24} />
                  </div>
                  <p className="mt-3 font-medium">Demo recording placeholder</p>
                  <p className="mt-1 text-sm text-stone-500">
                    No recording logic is connected yet.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ToolButton icon={<MonitorUp size={18} />} label="Screen" />
                <ToolButton icon={<Mic size={18} />} label="Mic" />
                <ToolButton icon={<Video size={18} />} label="Camera" />
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold">Feedback preview</h2>
              <div className="mt-4 space-y-3">
                {questions.map((question, index) => (
                  <div
                    key={question}
                    className="rounded-md border border-stone-200 bg-[#fbfaf7] p-3"
                  >
                    <p className="text-xs font-medium text-stone-500">
                      Question {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-medium text-stone-900">
                      {question}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="mt-2 h-12 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
        placeholder={placeholder}
      />
    </label>
  );
}

function ToolButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex h-11 items-center justify-center gap-2 rounded-md border border-stone-200 bg-[#fbfaf7] text-sm font-medium text-stone-800"
    >
      {icon}
      {label}
    </button>
  );
}
