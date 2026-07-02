import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ArrowUpRight, Play } from "lucide-react";

import { getDemoBucketName } from "@/lib/demos/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { FeedbackForm } from "./feedback-form";

type PublicDemo = {
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
    .select("product_name, tagline, product_url, status, video_path")
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
    <main className="min-h-screen bg-[#f7f5f0] text-stone-950">
      <div className="mx-auto w-full max-w-5xl px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Demodrop
          </Link>
          <Link
            href="/new"
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Create demo
          </Link>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-sm font-medium text-teal-700">Public demo</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal sm:text-5xl">
              {demo.product_name}
            </h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-stone-600">
              {demo.tagline}
            </p>

            <div className="mt-6 rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
              <video
                className="aspect-video min-h-56 w-full rounded-md bg-stone-950"
                src={signedVideo.signedUrl}
                controls
                playsInline
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <aside className="space-y-4">
            <FeedbackForm slug={slug} />

            <a
              href={demo.product_url}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-medium text-white hover:bg-teal-800"
            >
              Visit product
              <ArrowUpRight size={17} />
            </a>

            <Link
              href="/new"
              className="flex min-h-28 flex-col justify-center rounded-lg border border-stone-200 bg-white p-4 shadow-sm hover:border-teal-700"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-stone-950 text-white">
                <Play size={18} fill="currentColor" />
              </span>
              <span className="mt-3 text-base font-semibold">
                Made with Demodrop
              </span>
              <span className="mt-1 text-sm leading-6 text-stone-500">
                Create a shareable demo and collect launch feedback.
              </span>
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}
