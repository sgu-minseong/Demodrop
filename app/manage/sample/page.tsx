import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, MousePointerClick, Play, Users } from "lucide-react";

const metrics = [
  { label: "Views", value: "248", detail: "+36 today", icon: Users },
  { label: "Play rate", value: "68%", detail: "169 plays", icon: Play },
  { label: "Completion", value: "44%", detail: "74 completed", icon: Play },
  { label: "Click rate", value: "18%", detail: "45 visits", icon: MousePointerClick },
];

const feedback = [
  {
    name: "Founder, B2B SaaS",
    clear: "Clear",
    interest: "High",
    note: "I understood the inbox triage flow quickly. Pricing and setup time are the two missing details.",
  },
  {
    name: "Support lead",
    clear: "Mostly clear",
    interest: "Medium",
    note: "The promise is useful, but I want to see how it handles edge cases before trying it.",
  },
  {
    name: "Solo builder",
    clear: "Very clear",
    interest: "High",
    note: "The demo made the value obvious in under a minute. I clicked through to the product.",
  },
];

export default function ManageSamplePage() {
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-stone-950">
      <div className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Demodrop
          </Link>
          <Link
            href="/d/sample"
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            <ArrowLeft size={16} />
            Public page
          </Link>
        </header>

        <section className="mt-10">
          <p className="text-sm font-medium text-teal-700">Demo analytics</p>
          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
                InboxPilot
              </h1>
              <p className="mt-3 text-base text-stone-600">
                AI triage for busy support inboxes.
              </p>
            </div>
            <span className="rounded-full border border-stone-300 bg-white px-3 py-1 text-sm text-stone-600">
              Sample data
            </span>
          </div>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-stone-500">
                    {metric.label}
                  </p>
                  <Icon size={18} className="text-teal-700" />
                </div>
                <p className="mt-3 text-3xl font-semibold">{metric.value}</p>
                <p className="mt-1 text-sm text-stone-500">{metric.detail}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <DistributionCard
            title="Understanding"
            data={[
              ["Very clear", 46],
              ["Mostly clear", 32],
              ["Unclear", 14],
              ["Confused", 8],
            ]}
          />
          <DistributionCard
            title="Interest"
            data={[
              ["High", 41],
              ["Medium", 37],
              ["Low", 16],
              ["Not now", 6],
            ]}
          />
        </section>

        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold">Feedback</h2>
              <p className="text-sm text-stone-500">
                Recent reactions from the sample demo page.
              </p>
            </div>
          </div>
          <div className="mt-4 divide-y divide-stone-200">
            {feedback.map((item) => (
              <article key={item.note} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <p className="font-medium">{item.name}</p>
                  <div className="flex flex-wrap gap-2">
                    <Tag>{item.clear}</Tag>
                    <Tag>{item.interest} interest</Tag>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  {item.note}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function DistributionCard({
  title,
  data,
}: {
  title: string;
  data: [string, number][];
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-xl font-semibold">{title} distribution</h2>
      <div className="mt-4 space-y-4">
        {data.map(([label, value]) => (
          <div key={label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-stone-700">{label}</span>
              <span className="text-stone-500">{value}%</span>
            </div>
            <div className="h-3 rounded-full bg-stone-100">
              <div
                className="h-3 rounded-full bg-teal-700"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-[#f3efe7] px-3 py-1 text-xs font-medium text-stone-700">
      {children}
    </span>
  );
}
