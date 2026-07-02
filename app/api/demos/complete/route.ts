import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  createDemoUrls,
  jsonError,
  readJsonBody,
  validateCompleteInput,
} from "@/lib/demos/api";

type DemoForCompletion = {
  id: string;
  slug: string;
  owner_token: string;
};

export async function POST(request: Request) {
  const bodyResult = await readJsonBody(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const inputResult = validateCompleteInput(bodyResult.body);

  if (!inputResult.ok) {
    return inputResult.response;
  }

  const { ownerToken, videoPath } = inputResult.value;

  const { data: demo, error: lookupError } = await supabaseAdmin
    .from("demos")
    .select("id, slug, owner_token")
    .eq("owner_token", ownerToken)
    .maybeSingle<DemoForCompletion>();

  if (lookupError) {
    return jsonError(
      500,
      "database_error",
      "Failed to look up demo.",
      { supabase: lookupError.message },
    );
  }

  if (!demo) {
    return jsonError(
      404,
      "not_found",
      "No demo exists for the provided ownerToken.",
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from("demos")
    .update({
      video_path: videoPath,
      status: "ready",
    })
    .eq("id", demo.id);

  if (updateError) {
    return jsonError(
      500,
      "database_error",
      "Failed to complete demo.",
      { supabase: updateError.message },
    );
  }

  return Response.json(createDemoUrls(demo.slug, demo.owner_token));
}
