import Link from "next/link";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  MessageSquareText,
  MousePointerClick,
  Play,
  Users,
} from "lucide-react";

import { createDemoUrls } from "@/lib/demos/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ShareLinks } from "./share-links";

type Demo = {
  id: string;
  slug: string;
  owner_token: string;
  product_name: string | null;
  tagline: string | null;
};

type EventRow = {
  event_type: string | null;
};

type FeedbackRow = {
  author_name: string | null;
  comment: string | null;
  clarity: string | null;
  interest: string | null;
  confusing_part: string | null;
  no_use_reason: string | null;
  created_at: string | null;
};

const ownerTokenPattern = /^[A-Za-z0-9_-]{24,80}$/;

export default async function ManageDemoPage({
  params,
}: {
  params: Promise<{ ownerToken: string }>;
}) {
  await connection();

  const { ownerToken } = await params;

  if (!ownerTokenPattern.test(ownerToken)) {
    notFound();
  }

  const { data: demo, error: demoError } = await supabaseAdmin
    .from("demos")
    .select("id, slug, owner_token, product_name, tagline")
    .eq("owner_token", ownerToken)
    .maybeSingle<Demo>();

  if (demoError) {
    throw new Error(`Failed to load demo report: ${demoError.message}`);
  }

  if (!demo) {
    notFound();
  }

  const [{ data: events, error: eventsError }, { data: feedback, error: feedbackError }] =
    await Promise.all([
      supabaseAdmin.from("events").select("event_type").eq("demo_id", demo.id),
      supabaseAdmin
        .from("feedback")
        .select(
          "author_name, comment, clarity, interest, confusing_part, no_use_reason, created_at",
        )
        .eq("demo_id", demo.id)
        .order("created_at", { ascending: false }),
    ]);

  if (eventsError) {
    throw new Error(`Failed to load events: ${eventsError.message}`);
  }

  if (feedbackError) {
    throw new Error(`Failed to load feedback: ${feedbackError.message}`);
  }

  const eventRows = (events ?? []) as EventRow[];
  const feedbackRows = (feedback ?? []) as FeedbackRow[];
  const eventCounts = countBy(eventRows, (event) => event.event_type || "");
  const views = eventCounts.view || 0;
  const plays = eventCounts.play || 0;
  const completions = eventCounts.complete || 0;
  const productClicks = eventCounts.cta_click || 0;
  const feedbackCount = feedbackRows.length;
  const ctaClickRate = percentage(productClicks, views);
  const completionRate = percentage(completions, plays);
  const clarityDistribution = distribution(feedbackRows, "clarity");
  const interestDistribution = distribution(feedbackRows, "interest");
  const confusingDistribution = distribution(feedbackRows, "confusing_part");
  const noUseDistribution = distribution(feedbackRows, "no_use_reason");
  const mostConfusingPart = topLabel(confusingDistribution);
  const mainNoUseReason = topLabel(noUseDistribution);
  const { publicUrl } = createDemoUrls(demo.slug, demo.owner_token);

  const metrics = [
    { label: "Views", value: formatNumber(views), icon: Users },
    { label: "Plays", value: formatNumber(plays), icon: Play },
    { label: "Completions", value: formatNumber(completions), icon: Play },
    {
      label: "Product clicks",
      value: formatNumber(productClicks),
      icon: MousePointerClick,
    },
    {
      label: "Feedback count",
      value: formatNumber(feedbackCount),
      icon: MessageSquareText,
    },
    { label: "CTA click rate", value: `${ctaClickRate}%`, icon: BarChart3 },
    { label: "Completion rate", value: `${completionRate}%`, icon: BarChart3 },
  ];

  return (
    <main className="app-shell">
      <div className="app-container">
        <header className="flex items-center justify-between">
          <Link href="/" className="brand-logo">
            Demodrop
          </Link>
          <Link
            href={`/d/${demo.slug}`}
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
                {demo.product_name || "Untitled demo"}
              </h1>
              <p className="body-copy mt-3">
                {demo.tagline || "No tagline yet."}
              </p>
            </div>
            <span className="rounded-full border border-[#A3FF12]/60 bg-[#A3FF12]/10 px-3 py-1 text-sm font-semibold text-[#E8FFD0]">
              Anyone with this manage link can view this report.
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
              </div>
            );
          })}
        </section>

        <section className="mt-6">
          <ShareLinks publicUrl={publicUrl} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <DistributionCard
            title="Clarity distribution"
            data={clarityDistribution}
          />
          <DistributionCard
            title="Interest distribution"
            data={interestDistribution}
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <SummaryCard title="Most confusing part" value={mostConfusingPart} />
          <SummaryCard title="Main no-use reason" value={mainNoUseReason} />
        </section>

        <section className="surface-card mt-6 p-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="section-title text-xl">Feedback and comments</h2>
              <p className="muted-copy">
                Private report data from the public demo page.
              </p>
            </div>
          </div>
          {feedbackRows.length > 0 ? (
            <div className="mt-4 divide-y divide-[#D9DDD2]">
              {feedbackRows.map((item, index) => (
                <article
                  key={`${item.created_at || "feedback"}-${index}`}
                  className="py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row">
                    <div>
                      <p className="font-semibold text-[#101412]">
                        {item.author_name?.trim() || "Anonymous"}
                      </p>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Tag>{item.clarity || "No clarity answer"}</Tag>
                      <Tag>{item.interest || "No interest answer"}</Tag>
                    </div>
                  </div>
                  <p className="muted-copy mt-3">
                    {item.comment?.trim() || "No comment."}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="surface-panel muted-copy mt-4 border-dashed p-4">
              No feedback yet.
            </p>
          )}
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
  const total = data.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="surface-card p-4">
      <h2 className="section-title text-xl">{title}</h2>
      {data.length > 0 ? (
        <div className="mt-4 space-y-4">
          {data.map(([label, count]) => {
            const value = percentage(count, total);

            return (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-[#101412]">{label}</span>
                  <span className="text-[#6B7280]">
                    {count} - {value}%
                  </span>
                </div>
                <div className="progress-track h-3">
                  <div
                    className="progress-fill h-3"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="muted-copy mt-4">No feedback yet.</p>
      )}
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="surface-card p-4">
      <p className="text-sm font-semibold text-[#6B7280]">{title}</p>
      <p className="metric-value mt-3 text-2xl">{value}</p>
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

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);

    if (!key) {
      return counts;
    }

    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function distribution<T extends keyof FeedbackRow>(
  rows: FeedbackRow[],
  key: T,
) {
  return Object.entries(
    countBy(rows, (row) => String(row[key] || "").trim()),
  ).sort((a, b) => b[1] - a[1]);
}

function topLabel(data: [string, number][]) {
  return data[0]?.[0] || "No feedback yet";
}

function percentage(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
