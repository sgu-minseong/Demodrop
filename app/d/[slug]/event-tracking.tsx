"use client";

import { useEffect } from "react";
import { ArrowUpRight } from "lucide-react";

type EventType = "view" | "play" | "complete" | "cta_click";

type DemoViewTrackerProps = {
  demoId: string;
  slug: string;
};

type TrackedVideoProps = DemoViewTrackerProps & {
  signedVideoUrl: string;
};

type TrackedProductLinkProps = DemoViewTrackerProps & {
  productUrl: string;
};

export function DemoViewTracker({ demoId, slug }: DemoViewTrackerProps) {
  useEffect(() => {
    trackEventOnce(demoId, "view", { slug, path: window.location.pathname });
  }, [demoId, slug]);

  return null;
}

export function TrackedVideo({
  demoId,
  slug,
  signedVideoUrl,
}: TrackedVideoProps) {
  return (
    <video
      className="aspect-video min-h-56 w-full rounded-lg bg-[#0B0F0E]"
      src={signedVideoUrl}
      controls
      playsInline
      preload="metadata"
      onPlay={() => trackEventOnce(demoId, "play", { slug })}
      onEnded={() => trackEventOnce(demoId, "complete", { slug })}
    >
      Your browser does not support the video tag.
    </video>
  );
}

export function TrackedProductLink({
  demoId,
  slug,
  productUrl,
}: TrackedProductLinkProps) {
  return (
    <a
      href={productUrl}
      target="_blank"
      rel="noreferrer"
      onClick={() => trackEvent(demoId, "cta_click", { slug, url: productUrl })}
      className="btn-primary h-12 px-4 text-sm"
    >
      Visit product
      <ArrowUpRight size={17} />
    </a>
  );
}

function trackEventOnce(
  demoId: string,
  eventType: Exclude<EventType, "cta_click">,
  metadata: Record<string, string>,
) {
  const storageKey = `demodrop.event.${demoId}.${eventType}`;

  if (readSessionValue(storageKey) === "sent") {
    return;
  }

  writeSessionValue(storageKey, "sent");
  trackEvent(demoId, eventType, metadata);
}

function trackEvent(
  demoId: string,
  eventType: EventType,
  metadata: Record<string, string>,
) {
  const payload = {
    demoId,
    eventType,
    source: getSource(),
    metadata,
  };
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/events", blob);
    return;
  }

  void fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  });
}

function getSource() {
  const querySource = new URLSearchParams(window.location.search)
    .get("src")
    ?.trim();

  if (querySource) {
    return querySource.slice(0, 200);
  }

  if (document.referrer) {
    return document.referrer.slice(0, 200);
  }

  return "unknown";
}

function readSessionValue(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionValue(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Event tracking should still work when sessionStorage is unavailable.
  }
}
