"use client";

import { useState } from "react";
import { CheckCircle2, Copy } from "lucide-react";

type ShareLinksProps = {
  publicUrl: string;
};

const shareLinks = [
  { label: "Copy Public link", source: "" },
  { label: "Copy Disquiet link", source: "disquiet" },
  { label: "Copy X link", source: "x" },
  { label: "Copy Reddit link", source: "reddit" },
];

export function ShareLinks({ publicUrl }: ShareLinksProps) {
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  async function copyLink(label: string, source: string) {
    const url = source ? withSource(publicUrl, source) : publicUrl;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(label);
      setError("");
    } catch {
      setError("Could not copy the link. Select it and copy manually.");
    }
  }

  return (
    <section className="surface-card p-4">
      <h2 className="section-title text-xl">Share links</h2>
      <p className="brand-link mt-2 break-all text-sm">
        {publicUrl}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {shareLinks.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => copyLink(item.label, item.source)}
            className="btn-secondary h-10 px-3 text-sm"
          >
            {copied === item.label ? (
              <CheckCircle2 size={15} />
            ) : (
              <Copy size={15} />
            )}
            {copied === item.label ? "Copied" : item.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}

function withSource(url: string, source: string) {
  const parsedUrl = new URL(url);
  parsedUrl.searchParams.set("src", source);

  return parsedUrl.toString();
}
