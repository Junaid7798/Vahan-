import "server-only";

import { blurPlateRegion } from "@/lib/media/plate-blur";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { MediaInput, PersistedVehicleMedia } from "@/lib/supabase/vehicle-media-variants";

function getExtension(mimeType: string) {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("gif")) return "gif";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("ogg")) return "ogg";
  return "bin";
}

function parseDataUrl(value: string) {
  const match = value.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid data URL payload.");
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

function isDataUrl(value: string) {
  return value.startsWith("data:");
}

function canRemoveObject(path: string) {
  return !path.startsWith("/") && !path.startsWith("http://") && !path.startsWith("https://");
}

function buildBlurredPath(path: string) {
  const lastDot = path.lastIndexOf(".");
  if (lastDot === -1) {
    return `${path}-blurred.webp`;
  }

  return `${path.slice(0, lastDot)}-blurred.webp`;
}

async function readStoredVehicleImage(path: string) {
  const client = createAdminClient();
  const { data, error } = await client.storage.from("vehicle-images").download(path);

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to download vehicle image.");
  }

  const buffer = Buffer.from(await data.arrayBuffer());

  return {
    buffer,
    mimeType: data.type || "image/webp",
  };
}

async function uploadVehicleImage(path: string, buffer: Buffer, contentType: string) {
  const client = createAdminClient();
  const { error } = await client.storage.from("vehicle-images").upload(path, buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function createBlurredVariant(
  source: { buffer: Buffer; mimeType: string },
  originalStoragePath: string,
) {
  const blurred = await blurPlateRegion(source.buffer);
  const blurredStoragePath = buildBlurredPath(originalStoragePath);
  await uploadVehicleImage(blurredStoragePath, blurred.buffer, blurred.contentType);
  return blurredStoragePath;
}

export async function uploadVehicleMedia(listingId: string, media: MediaInput[]) {
  const client = createAdminClient();
  const uploadedPaths: string[] = [];
  const uploaded: PersistedVehicleMedia[] = [];

  try {
    for (const item of media) {
      if (!isDataUrl(item.storagePath)) {
        const originalStoragePath = item.originalStoragePath ?? item.storagePath;
        if (item.blurredStoragePath) {
          uploaded.push({
            blurredStoragePath: item.blurredStoragePath,
            displayOrder: item.displayOrder,
            originalStoragePath,
          });
          continue;
        }

        const source = await readStoredVehicleImage(originalStoragePath);
        const blurredStoragePath = await createBlurredVariant(source, originalStoragePath);
        uploadedPaths.push(blurredStoragePath);
        uploaded.push({
          blurredStoragePath,
          displayOrder: item.displayOrder,
          originalStoragePath,
        });
        continue;
      }

      const parsed = parseDataUrl(item.storagePath);
      const originalStoragePath = `${listingId}/${crypto.randomUUID()}.${getExtension(parsed.mimeType)}`;
      const { error } = await client.storage.from("vehicle-images").upload(originalStoragePath, parsed.buffer, {
        contentType: parsed.mimeType,
        upsert: false,
      });
      if (error) {
        throw new Error(error.message);
      }
      uploadedPaths.push(originalStoragePath);

      const blurredStoragePath = await createBlurredVariant(parsed, originalStoragePath);
      uploadedPaths.push(blurredStoragePath);
      uploaded.push({
        blurredStoragePath,
        displayOrder: item.displayOrder,
        originalStoragePath,
      });
    }

    return uploaded.sort((left, right) => left.displayOrder - right.displayOrder);
  } catch (error) {
    if (uploadedPaths.length) {
      await removeVehicleMedia(uploadedPaths);
    }

    throw error;
  }
}

export async function uploadVoiceNote(senderId: string, value: string) {
  if (!isDataUrl(value)) {
    return value;
  }

  const parsed = parseDataUrl(value);
  const path = `${senderId}/${Date.now()}-${crypto.randomUUID()}.${getExtension(parsed.mimeType)}`;
  const client = createAdminClient();
  const { error } = await client.storage.from("voice-notes").upload(path, parsed.buffer, {
    contentType: parsed.mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export async function removeVehicleMedia(paths: string[]) {
  const removable = paths.filter(canRemoveObject);
  if (!removable.length) {
    return;
  }

  const client = createAdminClient();
  const { error } = await client.storage.from("vehicle-images").remove(removable);
  if (error) {
    throw new Error(error.message);
  }
}

export async function removeVoiceNote(path?: string | null) {
  if (!path || !canRemoveObject(path)) {
    return;
  }

  const client = createAdminClient();
  const { error } = await client.storage.from("voice-notes").remove([path]);
  if (error) {
    throw new Error(error.message);
  }
}
