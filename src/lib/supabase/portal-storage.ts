import "server-only";

import { createAdminClient } from "@/lib/supabase/admin-client";

interface MediaInput {
  displayOrder: number;
  storagePath: string;
}

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

export async function uploadVehicleMedia(listingId: string, media: MediaInput[]) {
  const client = createAdminClient();
  const uploaded = await Promise.all(
    media.map(async (item) => {
      if (!isDataUrl(item.storagePath)) {
        return item;
      }

      const parsed = parseDataUrl(item.storagePath);
      const path = `${listingId}/${crypto.randomUUID()}.${getExtension(parsed.mimeType)}`;
      const { error } = await client.storage.from("vehicle-images").upload(path, parsed.buffer, {
        contentType: parsed.mimeType,
        upsert: false,
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        displayOrder: item.displayOrder,
        storagePath: path,
      };
    })
  );

  return uploaded.sort((left, right) => left.displayOrder - right.displayOrder);
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
