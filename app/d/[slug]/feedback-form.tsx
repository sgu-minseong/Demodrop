"use client";

import { useMemo, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";

type FeedbackFormProps = {
  slug: string;
};

const clarityOptions = ["Clear", "Somewhat unclear", "I don't get it"];
const tryOptions = ["Yes", "Maybe", "No"];
const confusingOptions = [
  "Problem",
  "Feature",
  "Target user",
  "Differentiation",
  "Pricing",
  "Nothing",
];
const objectionOptions = [
  "Already have an alternative",
  "Don't need it",
  "Too much work",
  "Don't trust it",
  "Might be expensive",
  "Other",
];

export function FeedbackForm({ slug }: FeedbackFormProps) {
  const storageKey = useMemo(() => `demodrop.feedback.${slug}`, [slug]);
  const submitInFlightRef = useRef(false);
  const [clarity, setClarity] = useState("");
  const [tryIntent, setTryIntent] = useState("");
  const [confusingArea, setConfusingArea] = useState("");
  const [objection, setObjection] = useState("");
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted">(
    () =>
      typeof window !== "undefined" &&
      sessionStorage.getItem(`demodrop.feedback.${slug}`) === "submitted"
        ? "submitted"
        : "idle",
  );
  const [error, setError] = useState("");
  const shouldAskConfusingArea =
    clarity === "Somewhat unclear" || clarity === "I don't get it";
  const shouldAskObjection = tryIntent === "Maybe" || tryIntent === "No";

  async function submitFeedback() {
    if (submitInFlightRef.current || status !== "idle") {
      return;
    }

    setError("");

    if (!clarity || !tryIntent) {
      setError("Please answer the first two questions before submitting.");
      return;
    }

    if (shouldAskConfusingArea && !confusingArea) {
      setError("Please tell us what was confusing.");
      return;
    }

    if (shouldAskObjection && !objection) {
      setError("Please tell us why you might not use it.");
      return;
    }

    const resolvedConfusingArea = shouldAskConfusingArea
      ? confusingArea
      : "Nothing";
    const resolvedObjection = shouldAskObjection ? objection : "Other";

    submitInFlightRef.current = true;
    setStatus("submitting");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          clarity,
          tryIntent,
          confusingArea: resolvedConfusingArea,
          objection: resolvedObjection,
          name,
          comment,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data));
      }

      sessionStorage.setItem(storageKey, "submitted");
      setStatus("submitted");
    } catch (caughtError) {
      setStatus("idle");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not submit feedback.",
      );
    } finally {
      submitInFlightRef.current = false;
    }
  }

  if (status === "submitted") {
    return (
      <div className="surface-card p-4">
        <div className="flex items-center gap-2 text-[#101412]">
          <CheckCircle2 size={20} />
          <h2 className="section-title">Thanks for the feedback</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-card p-4">
      <h2 className="section-title">Quick feedback</h2>
      <div className="mt-4 space-y-5">
        <ChoiceGroup
          label="What does this product do?"
          options={clarityOptions}
          value={clarity}
          onChange={(nextValue) => {
            setClarity(nextValue);
            if (nextValue === "Clear") {
              setConfusingArea("");
            }
            setError("");
          }}
          size="large"
        />
        <ChoiceGroup
          label="Would you try this product?"
          options={tryOptions}
          value={tryIntent}
          onChange={(nextValue) => {
            setTryIntent(nextValue);
            if (nextValue === "Yes") {
              setObjection("");
            }
            setError("");
          }}
          size="large"
        />

        {shouldAskConfusingArea ? (
          <div className="feedback-step">
            <ChoiceGroup
              label="What was confusing?"
              options={confusingOptions}
              value={confusingArea}
              onChange={(nextValue) => {
                setConfusingArea(nextValue);
                setError("");
              }}
            />
          </div>
        ) : null}

        {shouldAskObjection ? (
          <div className="feedback-step">
            <ChoiceGroup
              label="Why might you not use it?"
              options={objectionOptions}
              value={objection}
              onChange={(nextValue) => {
                setObjection(nextValue);
                setError("");
              }}
            />
          </div>
        ) : null}

        <label className="feedback-step block">
          <span className="label-text">
            Name, optional
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            className="input-control mt-2 h-11 px-3 text-sm"
            placeholder="Anonymous"
          />
        </label>

        <label className="feedback-step block">
          <span className="label-text">
            Leave a comment or suggestion, optional
          </span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={1000}
            className="input-control mt-2 min-h-28 resize-none p-3 text-sm"
            placeholder="Write a short reaction..."
          />
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <button
          type="button"
          onClick={submitFeedback}
          disabled={status === "submitting"}
          className="btn-primary h-11 w-full px-4 text-sm"
        >
          {status === "submitting" ? (
            <LoaderCircle size={16} className="spin-loading" />
          ) : (
            <Send size={16} />
          )}
          {status === "submitting" ? "Sending..." : "Send feedback"}
        </button>
      </div>
    </div>
  );
}

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
  size = "normal",
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  size?: "normal" | "large";
}) {
  return (
    <fieldset>
      <legend className="label-text">{label}</legend>
      <div
        className={
          size === "large"
            ? "mt-2 grid gap-2 sm:grid-cols-3"
            : "mt-2 flex flex-wrap gap-2"
        }
      >
        {options.map((option) => {
          const selected = option === value;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`choice-button ${getChoiceToneClass(option)} ${
                size === "large" ? "px-3 py-3 text-left" : "px-3 py-2"
              } transition ${
                selected
                  ? "choice-button-selected"
                  : ""
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function getChoiceToneClass(option: string) {
  if (
    option === "Clear" ||
    option === "Yes" ||
    option === "Nothing"
  ) {
    return "choice-positive";
  }

  if (
    option === "Somewhat unclear" ||
    option === "Maybe" ||
    option === "Other" ||
    option === "Might be expensive"
  ) {
    return "choice-neutral";
  }

  return "choice-negative";
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

  return "Could not submit feedback.";
}
