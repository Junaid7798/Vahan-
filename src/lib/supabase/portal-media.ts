import "server-only";

import { createAdminClient } from "@/lib/supabase/admin-client";

function isDirectUrl(path: string) {
  return path.startsWith("/") || path.startsWith("data:") || path.startsWith("http://") || path.startsWith("https://");
}

export async function resolveStorageUrl(bucket: "vehicle-images" | "voice-notes", path?: string | null) {
  if (!path) {
    return null;
  }

  if (isDirectUrl(path)) {
    return path;
  }

  const client = createAdminClient();
  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, 60 * 10);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? `Failed to resolve signed URL for ${bucket}.`);
  }

  return data.signedUrl;
}
