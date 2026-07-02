import "server-only";

import { nanoid } from "nanoid";

export type ApiErrorCode =
  | "invalid_json"
  | "invalid_input"
  | "not_found"
  | "conflict"
  | "storage_error"
  | "database_error"
  | "server_error";

export type ApiErrorPayload = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, string>;
  };
};

type JsonRecord = Record<string, unknown>;

const nanoidAlphabet = /^[A-Za-z0-9_-]+$/;

const allowedFileTypes: Record<string, string> = {
  "video/webm": "webm",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  webm: "webm",
  mp4: "mp4",
  mov: "mov",
};

export function jsonError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: Record<string, string>,
) {
  const payload: ApiErrorPayload = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };

  return Response.json(payload, { status });
}

export async function readJsonBody(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return {
        ok: false as const,
        response: jsonError(
          400,
          "invalid_json",
          "Request body must be a JSON object.",
        ),
      };
    }

    return { ok: true as const, body: body as JsonRecord };
  } catch {
    return {
      ok: false as const,
      response: jsonError(400, "invalid_json", "Request body is not valid JSON."),
    };
  }
}

export function getTrimmedString(body: JsonRecord, key: string) {
  const value = body[key];

  return typeof value === "string" ? value.trim() : "";
}

export function validateInitInput(body: JsonRecord) {
  const productName = getTrimmedString(body, "productName");
  const tagline = getTrimmedString(body, "tagline");
  const productUrl = getTrimmedString(body, "productUrl");
  const fileType = getTrimmedString(body, "fileType").toLowerCase();
  const details: Record<string, string> = {};

  if (!productName) {
    details.productName = "productName is required.";
  } else if (productName.length > 80) {
    details.productName = "productName must be 80 characters or fewer.";
  }

  if (!tagline) {
    details.tagline = "tagline is required.";
  } else if (tagline.length > 180) {
    details.tagline = "tagline must be 180 characters or fewer.";
  }

  if (!productUrl) {
    details.productUrl = "productUrl is required.";
  } else if (productUrl.length > 2048) {
    details.productUrl = "productUrl must be 2048 characters or fewer.";
  } else {
    try {
      const parsedUrl = new URL(productUrl);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        details.productUrl = "productUrl must use http or https.";
      }
    } catch {
      details.productUrl = "productUrl must be a valid URL.";
    }
  }

  if (!fileType) {
    details.fileType = "fileType is required.";
  } else if (!allowedFileTypes[fileType]) {
    details.fileType =
      "fileType must be one of: video/webm, video/mp4, video/quicktime, webm, mp4, mov.";
  }

  if (Object.keys(details).length > 0) {
    return {
      ok: false as const,
      response: jsonError(400, "invalid_input", "Invalid demo input.", details),
    };
  }

  return {
    ok: true as const,
    value: {
      productName,
      tagline,
      productUrl,
      fileType,
      extension: allowedFileTypes[fileType],
    },
  };
}

export function validateCompleteInput(body: JsonRecord) {
  const ownerToken = getTrimmedString(body, "ownerToken");
  const videoPath = normalizeStoragePath(getTrimmedString(body, "videoPath"));
  const details: Record<string, string> = {};

  if (!ownerToken) {
    details.ownerToken = "ownerToken is required.";
  } else if (
    ownerToken.length < 24 ||
    ownerToken.length > 80 ||
    !nanoidAlphabet.test(ownerToken)
  ) {
    details.ownerToken = "ownerToken is not valid.";
  }

  if (!videoPath) {
    details.videoPath = "videoPath is required.";
  } else if (!isValidStoragePath(videoPath)) {
    details.videoPath =
      "videoPath must be a valid relative storage path without traversal.";
  }

  if (Object.keys(details).length > 0) {
    return {
      ok: false as const,
      response: jsonError(
        400,
        "invalid_input",
        "Invalid completion input.",
        details,
      ),
    };
  }

  return { ok: true as const, value: { ownerToken, videoPath } };
}

export function createDemoIdentifiers() {
  return {
    slug: nanoid(18),
    ownerToken: nanoid(32),
  };
}

export function createUploadPath(slug: string, extension: string) {
  return `demos/${slug}/${nanoid(18)}.${extension}`;
}

export function getDemoBucketName() {
  return process.env.SUPABASE_DEMO_BUCKET?.trim() || "demo-videos";
}

export function createDemoUrls(slug: string, ownerToken: string) {
  const appUrl = getAppUrl();

  return {
    publicUrl: `${appUrl}/d/${slug}`,
    manageUrl: `${appUrl}/manage/${ownerToken}`,
  };
}

export function normalizeStoragePath(path: string) {
  return path.replace(/^\/+/, "");
}

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}

function isValidStoragePath(path: string) {
  if (path.length > 512 || path.includes("\\") || path.includes("\0")) {
    return false;
  }

  const parts = path.split("/");

  return parts.every((part) => part && part !== "." && part !== "..");
}
