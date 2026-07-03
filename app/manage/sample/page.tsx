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
    <main className="app-shell">
      <div className="app-container">
        <header className="flex items-center justify-between">
          <Link href="/" className="brand-logo">
            Demodrop
          </Link>
          <Link
            href="/d/sample"
            className="btn-secondary h-10 px-4 text-sm"
          >
            <ArrowLeft size={16} />
            Public page
          </Link>
        </header>

        <section className="mt-10">
          <p className="page-eyebrow">Demo analytics</p>
          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="page-title">
                InboxPilot
              </h1>
              <p className="body-copy mt-3">
                AI triage for busy support inboxes.
              </p>
            </div>
            <span className="rounded-full border border-[#A3FF12]/60 bg-[#A3FF12]/10 px-3 py-1 text-sm font-semibold text-[#E8FFD0]">
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
                className="metric-card p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#6B7280]">
                    {metric.label}
                  </p>
                  <Icon size={18} className="text-[#101412]" />
                </div>
                <p className="metric-value mt-3 text-3xl">{metric.value}</p>
                <p className="muted-copy mt-1">{metric.detail}</p>
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

        <section className="surface-card mt-6 p-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="section-title text-xl">Feedback</h2>
              <p className="muted-copy">
                Recent reactions from the sample demo page.
              </p>
            </div>
          </div>
          <div className="mt-4 divide-y divide-[#D9DDD2]">
            {feedback.map((item) => (
              <article key={item.note} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <p className="font-semibold text-[#101412]">{item.name}</p>
                  <div className="flex flex-wrap gap-2">
                    <Tag>{item.clear}</Tag>
                    <Tag>{item.interest} interest</Tag>
                  </div>
                </div>
                <p className="muted-copy mt-3">
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
    <div className="surface-card p-4">
      <h2 className="section-title text-xl">{title} distribution</h2>
      <div className="mt-4 space-y-4">
        {data.map(([label, value]) => (
          <div key={label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-[#101412]">{label}</span>
              <span className="text-[#6B7280]">{value}%</span>
            </div>
            <div className="progress-track h-3">
              <div
                className="progress-fill h-3"
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
    <span className="rounded-full border border-[#D9DDD2] bg-white px-3 py-1 text-xs font-semibold text-[#101412]">
      {children}
    </span>
  );
}
