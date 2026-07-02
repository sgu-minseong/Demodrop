"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

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

  async function submitFeedback() {
    setError("");

    if (!clarity || !tryIntent || !confusingArea || !objection) {
      setError("Please answer the four quick questions before submitting.");
      return;
    }

    if (status === "submitted") {
      return;
    }

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
          confusingArea,
          objection,
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
    }
  }

  if (status === "submitted") {
    return (
      <div className="rounded-lg border border-teal-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-teal-800">
          <CheckCircle2 size={20} />
          <h2 className="text-lg font-semibold">Thanks for the feedback</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Quick feedback</h2>
      <div className="mt-4 space-y-5">
        <ChoiceGroup
          label="What does this product do?"
          options={clarityOptions}
          value={clarity}
          onChange={setClarity}
        />
        <ChoiceGroup
          label="Would you try this product?"
          options={tryOptions}
          value={tryIntent}
          onChange={setTryIntent}
        />
        <ChoiceGroup
          label="What was confusing?"
          options={confusingOptions}
          value={confusingArea}
          onChange={setConfusingArea}
        />
        <ChoiceGroup
          label="Why might you not use it?"
          options={objectionOptions}
          value={objection}
          onChange={setObjection}
        />

        <label className="block">
          <span className="text-sm font-medium text-stone-700">
            Name, optional
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            className="mt-2 h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none placeholder:text-stone-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
            placeholder="Anonymous"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">
            Leave a comment or suggestion, optional
          </span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={1000}
            className="mt-2 min-h-28 w-full resize-none rounded-md border border-stone-300 bg-white p-3 text-sm outline-none placeholder:text-stone-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
            placeholder="Write a short reaction..."
          />
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <button
          type="button"
          onClick={submitFeedback}
          disabled={status === "submitting"}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          <Send size={16} />
          {status === "submitting" ? "Submitting..." : "Send feedback"}
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
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-stone-700">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option === value;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`min-h-10 rounded-md border px-3 py-2 text-sm font-medium transition ${
                selected
                  ? "border-teal-700 bg-teal-50 text-teal-900"
                  : "border-stone-200 bg-[#fbfaf7] text-stone-800 hover:border-teal-700"
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
