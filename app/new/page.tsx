"use client";

import Link from "next/link";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clipboard,
  Copy,
  FileVideo,
  Mic,
  MonitorUp,
  Upload,
  Video,
} from "lucide-react";

type SignedUpload = {
  signedUrl: string;
  path: string;
  token: string;
};

type InitResponse = {
  demoId: string;
  slug: string;
  ownerToken: string;
  uploadPath: string;
  signedUpload: SignedUpload;
  publicUrl: string;
  manageUrl: string;
};

type CompleteResponse = {
  publicUrl: string;
  manageUrl: string;
};

type ReadyDemo = InitResponse & CompleteResponse;

const questions = [
  "What do you think this product helps you do?",
  "How interested are you in trying it?",
  "What is still unclear?",
];

const launchPostText =
  "I made a 60-sec demo of my side project. Can you tell me if it's clear?";

export default function NewDemoPage() {
  const [productName, setProductName] = useState("");
  const [tagline, setTagline] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "ready">("idle");
  const [error, setError] = useState("");
  const [readyDemo, setReadyDemo] = useState<ReadyDemo | null>(null);
  const [copied, setCopied] = useState("");

  const launchPost = useMemo(() => {
    if (!readyDemo) {
      return "";
    }

    return `${launchPostText} ${readyDemo.publicUrl}`;
  }, [readyDemo]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!videoFile) {
      setError("Choose a video file before creating your demo.");
      return;
    }

    setStatus("uploading");
    setError("");
    setCopied("");
    setReadyDemo(null);

    try {
      const initData = await postJson<InitResponse>("/api/demos/init", {
        productName,
        tagline,
        productUrl,
        fileType: getFileType(videoFile),
      });

      await uploadToSignedUrl(initData.signedUpload.signedUrl, videoFile);

      const completeData = await postJson<CompleteResponse>(
        "/api/demos/complete",
        {
          ownerToken: initData.ownerToken,
          videoPath: initData.uploadPath,
        },
      );

      setReadyDemo({ ...initData, ...completeData });
      setStatus("ready");
    } catch (caughtError) {
      setStatus("idle");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to upload your demo.",
      );
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setVideoFile(file);
  }

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
    } catch {
      setError("Could not copy to clipboard. Select the link and copy it manually.");
    }
  }

  const isUploading = status === "uploading";

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
              Upload a temporary video file for now. Screen recording will come
              later.
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <Field
                label="Product name"
                name="productName"
                placeholder="InboxPilot"
                value={productName}
                onChange={setProductName}
                disabled={isUploading}
              />
              <Field
                label="One-line description"
                name="tagline"
                placeholder="AI triage for busy support inboxes"
                value={tagline}
                onChange={setTagline}
                disabled={isUploading}
              />
              <Field
                label="Product URL"
                name="productUrl"
                placeholder="https://example.com"
                type="url"
                value={productUrl}
                onChange={setProductUrl}
                disabled={isUploading}
              />

              <label className="block">
                <span className="text-sm font-medium text-stone-700">
                  Demo video file
                </span>
                <span className="mt-2 flex min-h-24 cursor-pointer items-center gap-3 rounded-md border border-dashed border-stone-300 bg-white px-4 py-3 text-sm text-stone-600 transition hover:border-teal-700">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-800">
                    <FileVideo size={21} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-stone-900">
                      {videoFile ? videoFile.name : "Choose a video file"}
                    </span>
                    <span className="mt-1 block text-stone-500">
                      WebM, MP4, or MOV
                    </span>
                  </span>
                  <input
                    type="file"
                    accept="video/webm,video/mp4,video/quicktime,.webm,.mp4,.mov"
                    className="sr-only"
                    disabled={isUploading}
                    onChange={handleFileChange}
                    required
                  />
                </span>
              </label>

              {error ? (
                <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isUploading}
                className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-5 text-base font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400 sm:w-auto"
              >
                <Upload size={18} />
                {isUploading ? "Uploading your demo..." : "Create demo"}
              </button>
            </form>
          </section>

          <section className="space-y-4">
            <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Recording area</h2>
                  <p className="text-sm text-stone-500">
                    Temporary file upload is enabled. Recording controls are not
                    connected yet.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                  <Circle size={10} fill="currentColor" />
                  Ready
                </span>
              </div>
              <div className="flex aspect-video min-h-56 items-center justify-center rounded-md border border-dashed border-stone-300 bg-stone-100">
                <div className="px-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-stone-900 shadow-sm">
                    <Video size={24} />
                  </div>
                  <p className="mt-3 font-medium">Demo recording placeholder</p>
                  <p className="mt-1 text-sm text-stone-500">
                    Choose a video file to upload while recording is not
                    available.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ToolButton icon={<MonitorUp size={18} />} label="Screen" />
                <ToolButton icon={<Mic size={18} />} label="Mic" />
                <ToolButton icon={<Video size={18} />} label="Camera" />
              </div>
            </div>

            {readyDemo ? (
              <div className="rounded-lg border border-teal-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-teal-800">
                  <CheckCircle2 size={20} />
                  <h2 className="text-lg font-semibold">Your demo is ready.</h2>
                </div>

                <div className="mt-4 space-y-3">
                  <ResultLink
                    label="Public link"
                    description="Share this with other people."
                    href={readyDemo.publicUrl}
                    onCopy={() => copyText("public", readyDemo.publicUrl)}
                    copied={copied === "public"}
                  />
                  <ResultLink
                    label="Manage link"
                    description="Use this to view your report."
                    href={readyDemo.manageUrl}
                    onCopy={() => copyText("manage", readyDemo.manageUrl)}
                    copied={copied === "manage"}
                  />
                </div>

                <div className="mt-4 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                  <p>
                    Save your manage link. Anyone with this link can view your
                    report.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => copyText("launch", launchPost)}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-medium text-white hover:bg-teal-800 sm:w-auto"
                >
                  <Clipboard size={17} />
                  {copied === "launch" ? "Launch post copied" : "Copy launch post"}
                </button>
              </div>
            ) : (
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
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  value,
  onChange,
  disabled,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: "text" | "url";
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-stone-100"
        placeholder={placeholder}
        disabled={disabled}
        required
      />
    </label>
  );
}

function ToolButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex h-11 items-center justify-center gap-2 rounded-md border border-stone-200 bg-[#fbfaf7] text-sm font-medium text-stone-800"
      disabled
    >
      {icon}
      {label}
    </button>
  );
}

function ResultLink({
  label,
  description,
  href,
  onCopy,
  copied,
}: {
  label: string;
  description: string;
  href: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-[#fbfaf7] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900">{label}</p>
          <p className="mt-1 text-xs text-stone-500">{description}</p>
          <a
            href={href}
            className="mt-2 block break-all text-sm font-medium text-teal-800 hover:text-teal-900"
          >
            {href}
          </a>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-stone-800 hover:bg-stone-50"
        >
          <Copy size={16} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

async function postJson<T>(url: string, payload: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data));
  }

  return data as T;
}

async function uploadToSignedUrl(signedUrl: string, file: File) {
  const formData = new FormData();
  formData.append("cacheControl", "3600");
  formData.append("", file);

  const response = await fetch(signedUrl, {
    method: "PUT",
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to upload video to Storage.");
  }
}

function getFileType(file: File) {
  if (file.type) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "webm" || extension === "mp4" || extension === "mov") {
    return extension;
  }

  return "";
}

function getApiErrorMessage(data: unknown) {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    data.error &&
    typeof data.error === "object" &&
    "message" in data.error &&
    typeof data.error.message === "string"
  ) {
    return data.error.message;
  }

  return "Request failed.";
}
