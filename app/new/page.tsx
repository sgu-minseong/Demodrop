"use client";

import Link from "next/link";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clipboard,
  Copy,
  FileVideo,
  LoaderCircle,
  Mic,
  MonitorUp,
  RotateCcw,
  Square,
  Timer,
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

type UploadVideo = {
  blob: Blob;
  name: string;
  source: "recording" | "file";
};

type RecordedPreview = {
  blob: Blob;
  url: string;
  mimeType: string;
};

type RecordingState =
  | "idle"
  | "requesting"
  | "countdown"
  | "recording"
  | "recorded";

const questions = [
  "What do you think this product helps you do?",
  "How interested are you in trying it?",
  "What is still unclear?",
];

const launchPostText =
  "I made a 60-sec demo of my side project. Can you tell me if it's clear?";
const recordingGuide =
  "Open your product in another tab. Click Start recording. Select that tab in the browser popup.";
const privacyRecordingWarning =
  "Check that passwords, API keys, and private user data are not visible before recording.";
const desktopRecordingGuidance =
  "Mobile browsers may limit screen recording. For best results, use desktop Chrome or Edge.";
const unsupportedRecordingMessage =
  "Screen recording works best on desktop Chrome or Edge.";
const recordingMimeTypes = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];
const maxRecordingSeconds = 60;
const maxVideoBytes = 250 * 1024 * 1024;

export default function NewDemoPage() {
  const [productName, setProductName] = useState("");
  const [tagline, setTagline] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [uploadVideo, setUploadVideo] = useState<UploadVideo | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "ready">("idle");
  const [error, setError] = useState("");
  const [recordingError, setRecordingError] = useState("");
  const [readyDemo, setReadyDemo] = useState<ReadyDemo | null>(null);
  const [copied, setCopied] = useState("");
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [recordingState, setRecordingState] =
    useState<RecordingState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [remainingSeconds, setRemainingSeconds] = useState(maxRecordingSeconds);
  const [recordedPreview, setRecordedPreview] =
    useState<RecordedPreview | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInFlightRef = useRef(false);
  const recordingSessionRef = useRef(0);
  const finalizingRecordingRef = useRef(false);
  const countdownRejectRef = useRef<((error: Error) => void) | null>(null);

  const launchPost = useMemo(() => {
    if (!readyDemo) {
      return "";
    }

    return `${launchPostText} ${readyDemo.publicUrl}`;
  }, [readyDemo]);

  const isUploading = status === "uploading";
  const isRecordingBusy =
    recordingState === "requesting" ||
    recordingState === "countdown" ||
    recordingState === "recording";

  useEffect(() => {
    return () => {
      cancelCountdown("Recording page was closed before recording started.");
      clearRecordingTimers();
      stopMediaTracks();

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (uploadInFlightRef.current) {
      return;
    }

    const productNameError = getRequiredFieldError(
      productName,
      "Enter a product name.",
    );

    if (productNameError) {
      setError(productNameError);
      return;
    }

    const taglineError = getRequiredFieldError(
      tagline,
      "Enter a one-line description.",
    );

    if (taglineError) {
      setError(taglineError);
      return;
    }

    const productUrlError = getProductUrlError(productUrl);

    if (productUrlError) {
      setError(productUrlError);
      return;
    }

    if (!uploadVideo) {
      setError("Record a video or choose a video file before creating your demo.");
      return;
    }

    const videoError = getUploadVideoError(uploadVideo);

    if (videoError) {
      setError(videoError);
      return;
    }

    uploadInFlightRef.current = true;
    setStatus("uploading");
    setError("");
    setCopied("");
    setReadyDemo(null);

    try {
      const initData = await postJson<InitResponse>("/api/demos/init", {
        productName,
        tagline,
        productUrl,
        fileType: getVideoType(uploadVideo.blob, uploadVideo.name),
      });

      await uploadToSignedUrl(
        initData.signedUpload.signedUrl,
        uploadVideo.blob,
        uploadVideo.name,
      );

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
    } finally {
      uploadInFlightRef.current = false;
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) {
      setRecordingError(
        `${unsupportedRecordingMessage} ${desktopRecordingGuidance}`,
      );
      return;
    }

    setError("");
    setRecordingError("");
    setReadyDemo(null);
    resetRecordedPreview();
    setRecordingState("requesting");
    setCountdown(3);
    setRemainingSeconds(maxRecordingSeconds);
    chunksRef.current = [];
    const sessionId = recordingSessionRef.current + 1;
    recordingSessionRef.current = sessionId;

    let displayStream: MediaStream | null = null;
    let micStream: MediaStream | null = null;
    let combinedStream: MediaStream | null = null;

    try {
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      micStream = microphoneEnabled
        ? await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          })
        : null;

      combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...(micStream?.getAudioTracks() ?? []),
      ]);
      mediaStreamRef.current = combinedStream;

      const [screenTrack] = displayStream.getVideoTracks();
      screenTrack?.addEventListener("ended", handleScreenTrackEnded);

      await runCountdown(sessionId);

      if (
        !combinedStream
          .getVideoTracks()
          .some((track) => track.readyState === "live")
      ) {
        throw new Error("Screen sharing ended before recording started.");
      }

      beginMediaRecorder(combinedStream);
    } catch (caughtError) {
      clearRecordingTimers();
      stopMediaTracks(combinedStream);
      stopMediaTracks(displayStream);
      stopMediaTracks(micStream);
      setRecordingState("idle");
      setRecordingError(getRecordingErrorMessage(caughtError, microphoneEnabled));
    }
  }

  function beginMediaRecorder(stream: MediaStream) {
    const mimeType = getSupportedRecordingMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      clearRecordingTimers();

      const recordedMimeType = recorder.mimeType || mimeType || "video/webm";
      const blob = new Blob(chunksRef.current, { type: recordedMimeType });

      finalizingRecordingRef.current = true;
      stopMediaTracks();
      finalizingRecordingRef.current = false;
      mediaRecorderRef.current = null;

      if (blob.size === 0) {
        setRecordingState("idle");
        setRecordingError("Recording ended before any video data was captured.");
        return;
      }

      const url = URL.createObjectURL(blob);

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      previewUrlRef.current = url;
      setRecordedPreview({ blob, url, mimeType: recordedMimeType });
      setRecordingState("recorded");
      setRemainingSeconds(maxRecordingSeconds);
    };

    recorder.start();
    setRecordingState("recording");
    setRemainingSeconds(maxRecordingSeconds);

    recordingTimerRef.current = setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    autoStopTimerRef.current = setTimeout(() => {
      stopRecording();
    }, maxRecordingSeconds * 1000);
  }

  function stopRecording() {
    recordingSessionRef.current += 1;
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    cancelCountdown("Recording was cancelled before it started.");
    clearRecordingTimers();
    stopMediaTracks();
    setRecordingState("idle");
  }

  function handleScreenTrackEnded() {
    if (finalizingRecordingRef.current) {
      return;
    }

    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      stopRecording();
      return;
    }

    recordingSessionRef.current += 1;
    cancelCountdown("Screen sharing stopped before recording started.");
    clearRecordingTimers();
    stopMediaTracks();
    setRecordingState("idle");
    setRecordingError("Screen sharing stopped before recording finished.");
  }

  function useRecordedVideo() {
    if (!recordedPreview) {
      return;
    }

    const recordedVideo = {
      blob: recordedPreview.blob,
      name: "screen-recording.webm",
      source: "recording" as const,
    };
    const videoError = getUploadVideoError(recordedVideo);

    if (videoError) {
      setError(videoError);
      return;
    }

    setUploadVideo(recordedVideo);
    setError("");
  }

  function retakeRecording() {
    resetRecordedPreview();

    if (uploadVideo?.source === "recording") {
      setUploadVideo(null);
    }

    setRecordingState("idle");
    setRecordingError("");
    setRemainingSeconds(maxRecordingSeconds);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    const selectedVideo = { blob: file, name: file.name, source: "file" as const };
    const videoError = getUploadVideoError(selectedVideo);

    if (videoError) {
      setUploadVideo(null);
      setError(videoError);
      event.target.value = "";
      return;
    }

    setUploadVideo(selectedVideo);
    setError("");
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function createAnotherDemo() {
    setProductName("");
    setTagline("");
    setProductUrl("");
    setUploadVideo(null);
    setStatus("idle");
    setError("");
    setRecordingError("");
    setReadyDemo(null);
    setCopied("");
    resetRecordedPreview();
    setRecordingState("idle");
    setCountdown(3);
    setRemainingSeconds(maxRecordingSeconds);
    chunksRef.current = [];

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    window.scrollTo({ top: 0 });
  }

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
    } catch {
      setError("Could not copy to clipboard. Select the link and copy it manually.");
    }
  }

  function resetRecordedPreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setRecordedPreview(null);
  }

  function runCountdown(sessionId: number) {
    return new Promise<void>((resolve, reject) => {
      let nextValue = 3;
      countdownRejectRef.current = reject;

      const tick = () => {
        if (recordingSessionRef.current !== sessionId) {
          countdownRejectRef.current = null;
          reject(new Error("Recording was cancelled before it started."));
          return;
        }

        if (nextValue === 0) {
          setCountdown(0);
          countdownRejectRef.current = null;
          resolve();
          return;
        }

        setCountdown(nextValue);
        nextValue -= 1;
        countdownTimerRef.current = setTimeout(tick, 1000);
      };

      tick();
    });
  }

  function cancelCountdown(message: string) {
    const reject = countdownRejectRef.current;

    if (!reject) {
      return;
    }

    countdownRejectRef.current = null;
    reject(new Error(message));
  }

  function clearRecordingTimers() {
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  }

  function stopMediaTracks(stream = mediaStreamRef.current) {
    stream?.getTracks().forEach((track) => {
      if (track.readyState !== "ended") {
        track.stop();
      }
    });

    if (!stream || stream === mediaStreamRef.current) {
      mediaStreamRef.current = null;
    }
  }

  const uploadVideoLabel = uploadVideo
    ? uploadVideo.source === "recording"
      ? "Screen recording selected"
      : uploadVideo.name
    : "No file selected";
  const selectedFileLabel =
    uploadVideo?.source === "file" ? uploadVideo.name : "No file selected";

  if (readyDemo) {
    return (
      <main className="app-shell">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-5 py-10 sm:px-8">
          <section className="w-full">
            <div className="flex items-center gap-3 text-white">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#A3FF12] text-[#101412]">
                <CheckCircle2 size={26} />
              </span>
              <h1 className="page-title">
                Your demo is ready.
              </h1>
            </div>

            <div className="mt-8 space-y-4">
              <CopyableLinkBox
                label="Public link"
                value={readyDemo.publicUrl}
                copied={copied === "public"}
                onCopy={() => copyText("public", readyDemo.publicUrl)}
                emphasized
              />

              <CopyableLinkBox
                label="Manage link"
                value={readyDemo.manageUrl}
                copied={copied === "manage"}
                onCopy={() => copyText("manage", readyDemo.manageUrl)}
                warning="Save this link. If you lose it, it cannot be recovered."
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => copyText("launch", launchPost)}
                className="btn-primary h-12 px-5 text-base"
              >
                <Clipboard size={18} />
                {copied === "launch" ? "Launch post copied" : "Copy launch post"}
              </button>
              <button
                type="button"
                onClick={createAnotherDemo}
                className="btn-secondary h-12 px-5 text-base"
              >
                <RotateCcw size={18} />
                Create another demo
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

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
            Sample
          </Link>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section>
            <p className="page-eyebrow">New demo</p>
            <h1 className="page-title mt-2">
              Create a shareable product demo.
            </h1>
            <p className="body-copy mt-4 max-w-xl">
              Record a 60-second walkthrough, then upload it as a public demo.
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
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
                value={productUrl}
                onChange={setProductUrl}
                disabled={isUploading}
              />

              <div className="surface-card p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#A3FF12] text-[#101412]">
                    <FileVideo size={21} />
                  </span>
                  <div className="min-w-0">
                    <p className="section-title text-sm">
                      Selected video
                    </p>
                    <p className="muted-copy mt-1 break-all">
                      {uploadVideoLabel}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="label-text">
                    Or choose a video file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/webm,video/mp4,video/quicktime,.webm,.mp4,.mov"
                    className="sr-only"
                    disabled={isUploading || isRecordingBusy}
                    onChange={handleFileChange}
                    aria-label="Choose video file"
                  />
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={openFilePicker}
                      disabled={isUploading || isRecordingBusy}
                      className="btn-secondary h-11 px-4 text-sm"
                    >
                      <FileVideo size={17} />
                      Choose video file
                    </button>
                    <p className="muted-copy min-w-0 break-all">
                      {selectedFileLabel}
                    </p>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isUploading || isRecordingBusy}
                className="btn-primary mt-2 h-12 w-full px-5 text-base sm:w-auto"
              >
                {isUploading ? (
                  <LoaderCircle size={18} className="spin-loading" />
                ) : (
                  <Upload size={18} />
                )}
                {isUploading ? "Uploading your demo..." : "Create demo"}
              </button>
            </form>
          </section>

          <section className="space-y-4">
            <div className="surface-card p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="section-title">Screen recording</h2>
                  <p className="muted-copy mt-1 max-w-xl">
                    {recordingGuide}
                  </p>
                  <div className="mt-3 max-w-xl rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
                    <p className="font-semibold">{privacyRecordingWarning}</p>
                    <p className="mt-1">{desktopRecordingGuidance}</p>
                  </div>
                </div>
                <RecordingBadge
                  recordingState={recordingState}
                  remainingSeconds={remainingSeconds}
                />
              </div>

              <div className="relative flex aspect-video min-h-56 items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#B9C1B0] bg-white">
                {recordedPreview ? (
                  <video
                    className="h-full w-full bg-[#0B0F0E] object-contain"
                    src={recordedPreview.url}
                    controls
                    playsInline
                  />
                ) : (
                  <div className="px-4 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#A3FF12] text-[#101412] shadow-sm">
                      <Video size={24} />
                    </div>
                    <p className="mt-3 font-semibold text-[#101412]">
                      Record your product tab
                    </p>
                    <p className="muted-copy mt-1">
                      The browser picker controls which screen, window, or tab
                      is shared.
                    </p>
                  </div>
                )}

                {recordingState === "countdown" ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0B0F0E]/80 text-white">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[#DDE6D8]">
                        Recording starts in
                      </p>
                      <p className="mt-2 text-7xl font-semibold">{countdown}</p>
                    </div>
                  </div>
                ) : null}

                {recordingState === "recording" ? (
                  <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-white">
                    <Circle size={10} fill="currentColor" />
                    {remainingSeconds}s left
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="inline-flex h-11 items-center gap-2 rounded-md border border-[#D9DDD2] bg-white px-3 text-sm font-semibold text-[#101412]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#A3FF12]"
                    checked={microphoneEnabled}
                    disabled={isRecordingBusy || isUploading}
                    onChange={(event) => setMicrophoneEnabled(event.target.checked)}
                  />
                  <Mic size={17} />
                  Mic {microphoneEnabled ? "On" : "Off"}
                </label>

                {recordingState === "recording" ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700"
                  >
                    <Square size={16} fill="currentColor" />
                    Stop recording
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={isUploading || isRecordingBusy}
                    className="btn-primary h-11 px-4 text-sm"
                  >
                    <MonitorUp size={17} />
                    {recordingState === "requesting"
                      ? "Opening picker..."
                      : "Start recording"}
                  </button>
                )}
              </div>

              {recordedPreview ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={retakeRecording}
                    disabled={isUploading}
                    className="btn-secondary h-11 px-4 text-sm"
                  >
                    <RotateCcw size={16} />
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={useRecordedVideo}
                    disabled={isUploading}
                    className="btn-primary h-11 px-4 text-sm"
                  >
                    <CheckCircle2 size={17} />
                    Use this video
                  </button>
                </div>
              ) : null}

              {recordingError ? (
                <div className="mt-4 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                  <p>{recordingError}</p>
                </div>
              ) : null}
            </div>

            <div className="surface-card p-4">
              <h2 className="section-title">Feedback preview</h2>
              <div className="mt-4 space-y-3">
                {questions.map((question, index) => (
                  <div
                    key={question}
                    className="surface-panel p-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                      Question {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#101412]">
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

function CopyableLinkBox({
  label,
  value,
  copied,
  onCopy,
  emphasized = false,
  warning,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  emphasized?: boolean;
  warning?: string;
}) {
  return (
    <div
      className={
        emphasized
          ? "rounded-xl border-2 border-[#A3FF12] bg-[#F7F8F4] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
          : "surface-card p-4"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p
            className={
              emphasized
                ? "text-base font-bold text-[#101412]"
                : "text-sm font-bold text-[#101412]"
            }
          >
            {label}
          </p>
          {warning ? (
            <div className="mt-2 flex gap-2 text-sm font-semibold leading-6 text-[#6B4E00]">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              <p>{warning}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={
          emphasized
            ? "code-link-box mt-4 flex flex-col gap-3 border border-[#A3FF12] p-4 sm:flex-row sm:items-center"
            : "code-link-box mt-3 flex flex-col gap-3 border border-[#D9DDD2] p-3 sm:flex-row sm:items-center"
        }
      >
        <code
          className={
            emphasized
              ? "min-w-0 flex-1 break-all font-mono text-base font-bold text-[#101412]"
              : "min-w-0 flex-1 break-all font-mono text-sm font-semibold text-[#101412]"
          }
        >
          {value}
        </code>
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Copy ${label.toLowerCase()}`}
          title={`Copy ${label.toLowerCase()}`}
          className={
            emphasized
              ? "icon-button h-11 w-11 shrink-0 bg-[#A3FF12] text-[#101412] hover:bg-[#8BE600]"
              : "icon-button h-10 w-10 shrink-0"
          }
        >
          {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  value,
  onChange,
  disabled,
}: {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="label-text">{label}</span>
      <input
        name={name}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-control mt-2 h-12 px-3 text-base"
        placeholder={placeholder}
        disabled={disabled}
      />
    </label>
  );
}

function RecordingBadge({
  recordingState,
  remainingSeconds,
}: {
  recordingState: RecordingState;
  remainingSeconds: number;
}) {
  if (recordingState === "recording") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
        <Circle size={10} fill="currentColor" />
        {remainingSeconds}s left
      </span>
    );
  }

  if (recordingState === "countdown") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
        <Timer size={15} />
        Countdown
      </span>
    );
  }

  if (recordingState === "recorded") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[#A3FF12] bg-[#A3FF12]/20 px-3 py-1 text-sm font-semibold text-[#101412]">
        <CheckCircle2 size={15} />
        Preview ready
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#D9DDD2] bg-white px-3 py-1 text-sm font-semibold text-[#101412]">
      <Circle size={10} fill="currentColor" className="text-[#A3FF12]" />
      Ready
    </span>
  );
}

async function postJson<T>(url: string, payload: Record<string, string>) {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }

  const data = await readJsonSafely(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, response.status));
  }

  return data as T;
}

async function uploadToSignedUrl(
  signedUrl: string,
  blob: Blob,
  fileName: string,
) {
  const formData = new FormData();
  formData.append("cacheControl", "3600");
  formData.append("", blob, fileName);

  let response: Response;

  try {
    response = await fetch(signedUrl, {
      method: "PUT",
      body: formData,
    });
  } catch {
    throw new Error(
      "Network error while uploading. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    throw new Error(
      response.status === 413
        ? `This video is too large. Keep it under ${formatFileSize(
            maxVideoBytes,
          )} by recording a shorter demo or compressing the file.`
        : "Video upload failed. Try again, or choose a smaller video file.",
    );
  }
}

async function readJsonSafely(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getProductUrlError(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "Enter a valid product URL, including https://.";
  }

  try {
    const url = new URL(trimmedValue);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Enter a valid product URL, including https://.";
    }
  } catch {
    return "Enter a valid product URL, including https://.";
  }

  return "";
}

function getRequiredFieldError(value: string, message: string) {
  return value.trim() ? "" : message;
}

function getUploadVideoError(video: UploadVideo) {
  if (video.blob.size > maxVideoBytes) {
    return `This video is too large (${formatFileSize(
      video.blob.size,
    )}). Keep it under ${formatFileSize(
      maxVideoBytes,
    )} by recording a shorter demo or compressing the file.`;
  }

  if (!getVideoType(video.blob, video.name)) {
    return "Choose a WebM, MP4, or MOV video file.";
  }

  return "";
}

function formatFileSize(bytes: number) {
  const megabytes = bytes / (1024 * 1024);

  if (megabytes >= 10) {
    return `${Math.round(megabytes)} MB`;
  }

  return `${megabytes.toFixed(1)} MB`;
}

function getVideoType(blob: Blob, fileName: string) {
  if (blob.type.startsWith("video/webm")) {
    return "video/webm";
  }

  if (blob.type === "video/mp4" || blob.type === "video/quicktime") {
    return blob.type;
  }

  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "webm" || extension === "mp4" || extension === "mov") {
    return extension;
  }

  return "";
}

function getSupportedRecordingMimeType() {
  return (
    recordingMimeTypes.find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType),
    ) || ""
  );
}

function getRecordingErrorMessage(error: unknown, microphoneEnabled: boolean) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return microphoneEnabled
        ? "Screen or microphone access was blocked. Turn Mic off or allow access, then try again. Screen recording works best on desktop Chrome or Edge."
        : "Screen sharing was cancelled. Click Start recording again and choose your product tab in the browser popup. Screen recording works best on desktop Chrome or Edge.";
    }

    if (error.name === "NotFoundError") {
      return "No screen or window was available to record. Open your product in another tab and try again on desktop Chrome or Edge.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Recording failed. Try again and choose your product tab in the browser popup. Screen recording works best on desktop Chrome or Edge.";
}

function getApiErrorMessage(data: unknown, status: number) {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    data.error &&
    typeof data.error === "object" &&
    "message" in data.error &&
    typeof data.error.message === "string"
  ) {
    if ("code" in data.error && data.error.code === "storage_error") {
      return "Storage could not prepare the upload. Try again in a moment.";
    }

    if ("code" in data.error && data.error.code === "database_error") {
      return "Supabase could not save your demo. Try again in a moment.";
    }

    if (status >= 500) {
      return "Supabase or the server did not respond correctly. Try again in a moment.";
    }

    return data.error.message;
  }

  if (status >= 500) {
    return "Supabase or the server did not respond correctly. Try again in a moment.";
  }

  return "Request failed. Check your inputs and try again.";
}
