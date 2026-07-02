import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTrimmedString, jsonError, readJsonBody } from "@/lib/demos/api";

const eventTypes = ["view", "play", "complete", "cta_click"] as const;

type ReadyDemo = {
  id: string;
  status: string | null;
};

export async function POST(request: Request) {
  const bodyResult = await readJsonBody(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const inputResult = validateEventInput(bodyResult.body);

  if (!inputResult.ok) {
    return inputResult.response;
  }

  const { data: demo, error: demoError } = await supabaseAdmin
    .from("demos")
    .select("id, status")
    .eq("id", inputResult.value.demoId)
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
      "No ready demo exists for the provided demoId.",
    );
  }

  const { error: eventError } = await supabaseAdmin.from("events").insert({
    demo_id: demo.id,
    event_type: inputResult.value.eventType,
    source: inputResult.value.source,
    metadata: inputResult.value.metadata,
  });

  if (eventError) {
    return jsonError(
      500,
      "database_error",
      "Failed to save event.",
      { supabase: eventError.message },
    );
  }

  return Response.json({ ok: true }, { status: 201 });
}

function validateEventInput(body: Record<string, unknown>) {
  const demoId = getTrimmedString(body, "demoId");
  const eventType = getTrimmedString(body, "eventType");
  const source = getTrimmedString(body, "source") || "unknown";
  const metadata = body.metadata;
  const details: Record<string, string> = {};

  if (!demoId || demoId.length > 120) {
    details.demoId = "demoId is required.";
  }

  if (!isEventType(eventType)) {
    details.eventType = "eventType must be one of: view, play, complete, cta_click.";
  }

  if (source.length > 200) {
    details.source = "source must be 200 characters or fewer.";
  }

  if (
    metadata !== undefined &&
    (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
  ) {
    details.metadata = "metadata must be a JSON object.";
  }

  if (Object.keys(details).length > 0) {
    return {
      ok: false as const,
      response: jsonError(400, "invalid_input", "Invalid event input.", details),
    };
  }

  return {
    ok: true as const,
    value: {
      demoId,
      eventType,
      source,
      metadata:
        metadata && typeof metadata === "object" && !Array.isArray(metadata)
          ? metadata
          : {},
    },
  };
}

function isEventType(value: string): value is (typeof eventTypes)[number] {
  return eventTypes.includes(value as (typeof eventTypes)[number]);
}
