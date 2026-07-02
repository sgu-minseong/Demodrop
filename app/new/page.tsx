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
const recordingMimeTypes = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];
const maxRecordingSeconds = 60;

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

    if (!uploadVideo) {
      setError("Record a video or choose a video file before creating your demo.");
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
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) {
      setRecordingError(
        "Screen recording is not supported in this browser. Try Chrome or Edge.",
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

    setUploadVideo({
      blob: recordedPreview.blob,
      name: "screen-recording.webm",
      source: "recording",
    });
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

    setUploadVideo({ blob: file, name: file.name, source: "file" });
    setError("");
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
    : "No video selected";

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
              Record a 60-second walkthrough, then upload it as a public demo.
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

              <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-800">
                    <FileVideo size={21} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900">
                      Selected video
                    </p>
                    <p className="mt-1 break-all text-sm text-stone-500">
                      {uploadVideoLabel}
                    </p>
                  </div>
                </div>

                <label className="mt-4 block">
                  <span className="text-sm font-medium text-stone-700">
                    Or choose a video file
                  </span>
                  <input
                    type="file"
                    accept="video/webm,video/mp4,video/quicktime,.webm,.mp4,.mov"
                    className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-stone-950 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white disabled:cursor-not-allowed disabled:bg-stone-100"
                    disabled={isUploading || isRecordingBusy}
                    onChange={handleFileChange}
                  />
                </label>
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
                  <h2 className="text-lg font-semibold">Screen recording</h2>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-stone-500">
                    {recordingGuide}
                  </p>
                </div>
                <RecordingBadge
                  recordingState={recordingState}
                  remainingSeconds={remainingSeconds}
                />
              </div>

              <div className="relative flex aspect-video min-h-56 items-center justify-center overflow-hidden rounded-md border border-dashed border-stone-300 bg-stone-100">
                {recordedPreview ? (
                  <video
                    className="h-full w-full bg-stone-950 object-contain"
                    src={recordedPreview.url}
                    controls
                    playsInline
                  />
                ) : (
                  <div className="px-4 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-stone-900 shadow-sm">
                      <Video size={24} />
                    </div>
                    <p className="mt-3 font-medium">
                      Record your product tab
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      The browser picker controls which screen, window, or tab
                      is shared.
                    </p>
                  </div>
                )}

                {recordingState === "countdown" ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-stone-950/75 text-white">
                    <div className="text-center">
                      <p className="text-sm font-medium text-stone-200">
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
                <label className="inline-flex h-11 items-center gap-2 rounded-md border border-stone-200 bg-[#fbfaf7] px-3 text-sm font-medium text-stone-800">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-teal-700"
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
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
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
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:cursor-not-allowed disabled:bg-stone-100"
                  >
                    <RotateCcw size={16} />
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={useRecordedVideo}
                    disabled={isUploading}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-300"
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

            {readyDemo ? (
              <div className="rounded-lg border border-teal-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-teal-800">
                  <CheckCircle2 size={20} />
                  <h2 className="text-lg font-semibold">Your demo is ready.</h2>
                </div>

                <div className="mt-4 grid gap-4">
                  <ResultLink
                    label="Public link"
                    description="Share this link so others can watch your demo and leave feedback."
                    href={readyDemo.publicUrl}
                    onCopy={() => copyText("public", readyDemo.publicUrl)}
                    copied={copied === "public"}
                  />

                  <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-amber-900">
                          <AlertTriangle size={18} className="shrink-0" />
                          <p className="text-sm font-semibold">Manage link</p>
                        </div>
                        <p className="mt-2 text-sm font-medium text-amber-950">
                          Your private report and management link.
                        </p>
                        <div className="mt-3 rounded-md border border-red-200 bg-white p-3 text-sm font-semibold text-red-800">
                          <p>
                            Save this manage link. Anyone with this link can view
                            your report.
                          </p>
                          <p className="mt-1">
                            In this MVP, you cannot recover this link if you lose
                            it.
                          </p>
                        </div>
                        <a
                          href={readyDemo.manageUrl}
                          className="mt-3 block break-all text-sm font-medium text-amber-950 underline decoration-amber-700 underline-offset-4"
                        >
                          {readyDemo.manageUrl}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyText("manage", readyDemo.manageUrl)}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-amber-400 bg-white px-3 text-sm font-medium text-amber-950 hover:bg-amber-100"
                      >
                        <Copy size={16} />
                        {copied === "manage" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
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
      <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
        <CheckCircle2 size={15} />
        Preview ready
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-700">
      <Circle size={10} fill="currentColor" />
      Ready
    </span>
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

async function uploadToSignedUrl(
  signedUrl: string,
  blob: Blob,
  fileName: string,
) {
  const formData = new FormData();
  formData.append("cacheControl", "3600");
  formData.append("", blob, fileName);

  const response = await fetch(signedUrl, {
    method: "PUT",
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to upload video to Storage.");
  }
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
        ? "Screen or microphone access was blocked. Turn Mic off or allow access, then try again."
        : "Screen sharing was cancelled. Click Start recording again and choose your product tab when the browser asks.";
    }

    if (error.name === "NotFoundError") {
      return "No screen or window was available to record.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Recording failed. Try again and choose your product tab in the browser popup.";
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
