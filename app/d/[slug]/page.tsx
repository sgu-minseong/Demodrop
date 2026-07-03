import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";

import { getDemoBucketName } from "@/lib/demos/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { FeedbackForm } from "./feedback-form";
import {
  DemoViewTracker,
  TrackedProductLink,
  TrackedVideo,
} from "./event-tracking";

type PublicDemo = {
  id: string;
  product_name: string | null;
  tagline: string | null;
  product_url: string | null;
  status: string | null;
  video_path: string | null;
};

const slugPattern = /^[A-Za-z0-9_-]{6,80}$/;
const signedVideoExpiresIn = 60 * 60;

export default async function PublicDemoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();

  const { slug } = await params;

  if (!slugPattern.test(slug)) {
    notFound();
  }

  const { data: demo, error } = await supabaseAdmin
    .from("demos")
    .select("id, product_name, tagline, product_url, status, video_path")
    .eq("slug", slug)
    .maybeSingle<PublicDemo>();

  if (error) {
    throw new Error(`Failed to load public demo: ${error.message}`);
  }

  if (
    !demo ||
    demo.status !== "ready" ||
    !demo.video_path ||
    !demo.product_name ||
    !demo.tagline ||
    !demo.product_url
  ) {
    notFound();
  }

  const { data: signedVideo, error: signedVideoError } =
    await supabaseAdmin.storage
      .from(getDemoBucketName())
      .createSignedUrl(demo.video_path, signedVideoExpiresIn);

  if (signedVideoError || !signedVideo?.signedUrl) {
    throw new Error(
      `Failed to create signed video URL: ${
        signedVideoError?.message || "No signed URL returned"
      }`,
    );
  }

  return (
    <main className="app-shell">
      <DemoViewTracker demoId={demo.id} slug={slug} />
      <div className="app-container max-w-5xl">
        <header className="flex items-center justify-between">
          <Link href="/" className="brand-logo">
            Demodrop
          </Link>
          <Link
            href="/new"
            className="btn-primary h-10 px-4 text-sm"
          >
            Create demo
          </Link>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="page-eyebrow">Public demo</p>
            <h1 className="page-title mt-2">
              {demo.product_name}
            </h1>
            <p className="body-copy mt-3 max-w-2xl text-lg">
              {demo.tagline}
            </p>

            <div className="surface-card mt-6 p-3">
              <TrackedVideo
                demoId={demo.id}
                slug={slug}
                signedVideoUrl={signedVideo.signedUrl}
              />
            </div>
          </div>

          <aside className="space-y-4">
            <FeedbackForm slug={slug} />

            <TrackedProductLink
              demoId={demo.id}
              slug={slug}
              productUrl={demo.product_url}
            />

            <Link
              href="/new"
              className="surface-card flex min-h-28 flex-col justify-center p-4 hover:border-[#A3FF12]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#A3FF12] text-[#101412]">
                <Play size={18} fill="currentColor" />
              </span>
              <span className="mt-3 text-base font-bold text-[#101412]">
                Made with Demodrop
              </span>
              <span className="muted-copy mt-1">
                Create a shareable demo and collect launch feedback.
              </span>
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}
