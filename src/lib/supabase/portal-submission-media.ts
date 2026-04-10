import "server-only";

import { createAdminClient } from "@/lib/supabase/admin-client";
import { MediaInput } from "@/lib/supabase/vehicle-media-variants";

export interface SubmissionMediaEntry {
  displayOrder: number;
  storagePath: string;
}

interface PersistSubmissionMediaResult {
  items: SubmissionMediaEntry[];
  newPaths: string[];
}

function getExtension(mimeType: string) {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "bin";
}

function isDataUrl(value: string) {
  return value.startsWith("data:");
}

function isManagedStoragePath(path: string) {
  return !path.startsWith("/") && !path.startsWith("http://") && !path.startsWith("https://");
}

function parseDataUrl(value: string) {
  const match = value.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid data URL payload.");
  }

  return {
    buffer: Buffer.from(match[2], "base64"),
    mimeType: match[1],
  };
}

async function readStoredFileAsDataUrl(path: string) {
  const client = createAdminClient();
  const { data, error } = await client.storage.from("vehicle-images").download(path);

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to read submission media.");
  }

  const mimeType = data.type || "image/jpeg";
  const base64 = Buffer.from(await data.arrayBuffer()).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

export async function persistSubmissionMedia(submissionId: string, media: SubmissionMediaEntry[] = []): Promise<PersistSubmissionMediaResult> {
  const client = createAdminClient();
  const items: SubmissionMediaEntry[] = [];
  const newPaths: string[] = [];

  try {
    for (const item of media) {
      if (!isDataUrl(item.storagePath)) {
        items.push(item);
        continue;
      }

      const parsed = parseDataUrl(item.storagePath);
      const storagePath = `submissions/${submissionId}/${crypto.randomUUID()}.${getExtension(parsed.mimeType)}`;
      const { error } = await client.storage.from("vehicle-images").upload(storagePath, parsed.buffer, {
        contentType: parsed.mimeType,
        upsert: false,
      });

      if (error) {
        throw new Error(error.message);
      }

      newPaths.push(storagePath);
      items.push({
        displayOrder: item.displayOrder,
        storagePath,
      });
    }
  } catch (error) {
    await removeSubmissionMedia(newPaths);
    throw error;
  }

  return {
    items: items.sort((left, right) => left.displayOrder - right.displayOrder),
    newPaths,
  };
}

export async function cloneSubmissionMediaAsListingInputs(media: SubmissionMediaEntry[]): Promise<MediaInput[]> {
  const cloned = await Promise.all(
    media.map(async (item) => ({
      displayOrder: item.displayOrder,
      storagePath: isDataUrl(item.storagePath) ? item.storagePath : await readStoredFileAsDataUrl(item.storagePath),
    })),
  );

  return cloned.sort((left, right) => left.displayOrder - right.displayOrder);
}

export function getSubmissionMediaPaths(media: SubmissionMediaEntry[]) {
  return media.map((item) => item.storagePath);
}

export async function removeSubmissionMedia(paths: string[]) {
  const removable = paths.filter(isManagedStoragePath);
  if (!removable.length) {
    return;
  }

  const client = createAdminClient();
  const { error } = await client.storage.from("vehicle-images").remove(removable);
  if (error) {
    throw new Error(error.message);
  }
}
