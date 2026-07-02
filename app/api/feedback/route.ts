import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTrimmedString, jsonError, readJsonBody } from "@/lib/demos/api";

const slugPattern = /^[A-Za-z0-9_-]{6,80}$/;

const clarityOptions = [
  "Clear",
  "Somewhat unclear",
  "I don't get it",
] as const;
const tryOptions = ["Yes", "Maybe", "No"] as const;
const confusingOptions = [
  "Problem",
  "Feature",
  "Target user",
  "Differentiation",
  "Pricing",
  "Nothing",
] as const;
const objectionOptions = [
  "Already have an alternative",
  "Don't need it",
  "Too much work",
  "Don't trust it",
  "Might be expensive",
  "Other",
] as const;

type ReadyDemo = {
  id: string;
  slug: string;
  status: string | null;
};

export async function POST(request: Request) {
  const bodyResult = await readJsonBody(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const inputResult = validateFeedbackInput(bodyResult.body);

  if (!inputResult.ok) {
    return inputResult.response;
  }

  const { data: demo, error: demoError } = await supabaseAdmin
    .from("demos")
    .select("id, slug, status")
    .eq("slug", inputResult.value.slug)
    .eq("status", "ready")
    .maybeSingle<ReadyDemo>();

  if (demoError) {
    return jsonError(
      500,
      "database_error",
      "Failed to look up demo.",
      { supabase: demoError.message },
    );
  }

  if (!demo) {
    return jsonError(
      404,
      "not_found",
      "No ready demo exists for the provided slug.",
    );
  }

  const { data: feedback, error: feedbackError } = await supabaseAdmin
    .from("feedback")
    .insert({
      demo_id: demo.id,
      clarity: inputResult.value.clarity,
      interest: inputResult.value.tryIntent,
      confusing_part: inputResult.value.confusingArea,
      no_use_reason: inputResult.value.objection,
      author_name: inputResult.value.name,
      comment: inputResult.value.comment || null,
    })
    .select("id")
    .single();

  if (feedbackError) {
    return jsonError(
      500,
      "database_error",
      "Failed to save feedback.",
      { supabase: feedbackError.message },
    );
  }

  const { error: eventError } = await supabaseAdmin.from("events").insert({
    demo_id: demo.id,
    event_type: "feedback_submit",
    metadata: {
      feedbackId: feedback.id,
      slug: demo.slug,
    },
  });

  if (eventError) {
    return jsonError(
      500,
      "database_error",
      "Failed to save feedback event.",
      { supabase: eventError.message },
    );
  }

  return Response.json({ ok: true }, { status: 201 });
}

function validateFeedbackInput(body: Record<string, unknown>) {
  const slug = getTrimmedString(body, "slug");
  const clarity = getTrimmedString(body, "clarity");
  const tryIntent = getTrimmedString(body, "tryIntent");
  const confusingArea = getTrimmedString(body, "confusingArea");
  const objection = getTrimmedString(body, "objection");
  const rawName = getTrimmedString(body, "name");
  const comment = getTrimmedString(body, "comment");
  const details: Record<string, string> = {};

  if (!slugPattern.test(slug)) {
    details.slug = "slug is not valid.";
  }

  if (!isOption(clarity, clarityOptions)) {
    details.clarity = "Choose a valid clarity answer.";
  }

  if (!isOption(tryIntent, tryOptions)) {
    details.tryIntent = "Choose a valid try intent answer.";
  }

  if (!isOption(confusingArea, confusingOptions)) {
    details.confusingArea = "Choose a valid confusing area answer.";
  }

  if (!isOption(objection, objectionOptions)) {
    details.objection = "Choose a valid objection answer.";
  }

  if (rawName.length > 80) {
    details.name = "Name must be 80 characters or fewer.";
  }

  if (comment.length > 1000) {
    details.comment = "Comment must be 1000 characters or fewer.";
  }

  if (Object.keys(details).length > 0) {
    return {
      ok: false as const,
      response: jsonError(400, "invalid_input", "Invalid feedback input.", details),
    };
  }

  return {
    ok: true as const,
    value: {
      slug,
      clarity,
      tryIntent,
      confusingArea,
      objection,
      name: rawName || "Anonymous",
      comment,
    },
  };
}

function isOption<T extends readonly string[]>(
  value: string,
  options: T,
): value is T[number] {
  return options.includes(value);
}
