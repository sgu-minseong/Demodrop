import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  createDemoIdentifiers,
  createDemoUrls,
  createUploadPath,
  getDemoBucketName,
  jsonError,
  readJsonBody,
  validateInitInput,
} from "@/lib/demos/api";

export async function POST(request: Request) {
  const bodyResult = await readJsonBody(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const inputResult = validateInitInput(bodyResult.body);

  if (!inputResult.ok) {
    return inputResult.response;
  }

  const bucketName = getDemoBucketName();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { slug, ownerToken } = createDemoIdentifiers();
    const uploadPath = createUploadPath(slug, inputResult.value.extension);
    const { publicUrl, manageUrl } = createDemoUrls(slug, ownerToken);

    const { data: demo, error: insertError } = await supabaseAdmin
      .from("demos")
      .insert({
        product_name: inputResult.value.productName,
        tagline: inputResult.value.tagline,
        product_url: inputResult.value.productUrl,
        slug,
        owner_token: ownerToken,
        status: "draft",
      })
      .select("id, slug, owner_token")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        continue;
      }

      return jsonError(
        500,
        "database_error",
        "Failed to create demo row.",
        { supabase: insertError.message },
      );
    }

    const { data: signedUpload, error: signedUploadError } =
      await supabaseAdmin.storage
        .from(bucketName)
        .createSignedUploadUrl(uploadPath);

    if (signedUploadError) {
      return jsonError(
        500,
        "storage_error",
        "Failed to create signed upload URL.",
        { supabase: signedUploadError.message },
      );
    }

    return Response.json(
      {
        demoId: demo.id,
        slug,
        ownerToken,
        uploadPath,
        signedUpload,
        publicUrl,
        manageUrl,
      },
      { status: 201 },
    );
  }

  return jsonError(
    409,
    "conflict",
    "Could not allocate a unique slug and ownerToken. Please retry.",
  );
}
