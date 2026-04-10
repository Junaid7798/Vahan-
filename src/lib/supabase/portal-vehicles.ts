import "server-only";

import { createAdminClient } from "@/lib/supabase/admin-client";
import { logPortalActivity } from "@/lib/supabase/portal-activity";
import {
  buildListingPatch,
  buildVehicleRecord,
  VehiclePayload,
} from "@/lib/supabase/portal-vehicle-utils";
import { removeVehicleMedia, uploadVehicleMedia } from "@/lib/supabase/portal-storage";
import { buildVehicleMediaRows, getNewStoragePaths } from "@/lib/supabase/vehicle-media-variants";

interface VehicleMediaSnapshot {
  display_order: number;
  is_blurred: boolean;
  media_type: string;
  storage_path: string;
}

interface ListingSnapshot {
  condition_notes: string | null;
  documentation_cost: number | null;
  extra_spend: number | null;
  highlights: string | null;
  id: string;
  internal_notes: string | null;
  maintenance_cost: number | null;
  other_cost: number | null;
  procurement_price: number | null;
  published_at: string | null;
  sold_at: string | null;
  status: VehiclePayload["status"];
  target_selling_price: number | null;
  transport_cost: number | null;
  vehicle_id: string;
  vehicle_media: VehicleMediaSnapshot[] | null;
}

type AdminClient = ReturnType<typeof createAdminClient>;

function asError(error: unknown) {
  return error instanceof Error ? error : new Error("Request failed.");
}

async function getNextStockId(client: AdminClient) {
  const { data, error } = await client.from("vehicle_listings").select("stock_id");
  if (error) {
    throw new Error(error.message);
  }

  const highest = (data ?? []).reduce((max, item) => {
    const value = Number((item.stock_id ?? "").replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 200);

  return `VH-${highest + 1}`;
}

async function rollbackCreateVehicle(client: AdminClient, vehicleId: string | null, listingId: string | null, uploadedPaths: string[], reason: Error) {
  const cleanupErrors: string[] = [];

  if (uploadedPaths.length) {
    try {
      await removeVehicleMedia(uploadedPaths);
    } catch (error) {
      cleanupErrors.push(asError(error).message);
    }
  }

  if (listingId) {
    const { error } = await client.from("vehicle_listings").delete().eq("id", listingId);
    if (error) {
      cleanupErrors.push(error.message);
    }
  }

  if (vehicleId) {
    const { error } = await client.from("vehicles").delete().eq("id", vehicleId);
    if (error) {
      cleanupErrors.push(error.message);
    }
  }

  if (cleanupErrors.length) {
    throw new Error(`${reason.message} Cleanup failed: ${cleanupErrors.join("; ")}`);
  }

  throw reason;
}

async function replaceVehicleMediaRows(client: AdminClient, listingId: string, rows: VehicleMediaSnapshot[]) {
  const { error: deleteError } = await client.from("vehicle_media").delete().eq("listing_id", listingId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (!rows.length) {
    return;
  }

  const { error: insertError } = await client.from("vehicle_media").insert(
    rows.map((row) => ({
      ...row,
      listing_id: listingId,
    }))
  );
  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function rollbackUpdateVehicle(
  client: AdminClient,
  listingId: string,
  currentListing: ListingSnapshot,
  currentVehicle: Record<string, unknown>,
  uploadedPaths: string[],
  reason: Error
) {
  const cleanupErrors: string[] = [];

  if (uploadedPaths.length) {
    try {
      await removeVehicleMedia(uploadedPaths);
    } catch (error) {
      cleanupErrors.push(asError(error).message);
    }
  }

  const { error: vehicleError } = await client.from("vehicles").update(currentVehicle).eq("id", currentListing.vehicle_id);
  if (vehicleError) {
    cleanupErrors.push(vehicleError.message);
  }

  const { error: listingError } = await client
    .from("vehicle_listings")
    .update({
      condition_notes: currentListing.condition_notes,
      documentation_cost: currentListing.documentation_cost,
      extra_spend: currentListing.extra_spend,
      highlights: currentListing.highlights,
      internal_notes: currentListing.internal_notes,
      maintenance_cost: currentListing.maintenance_cost,
      other_cost: currentListing.other_cost,
      procurement_price: currentListing.procurement_price,
      published_at: currentListing.published_at,
      sold_at: currentListing.sold_at,
      status: currentListing.status,
      target_selling_price: currentListing.target_selling_price,
      transport_cost: currentListing.transport_cost,
    })
    .eq("id", listingId);

  if (listingError) {
    cleanupErrors.push(listingError.message);
  }

  try {
    await replaceVehicleMediaRows(client, listingId, currentListing.vehicle_media ?? []);
  } catch (error) {
    cleanupErrors.push(asError(error).message);
  }

  if (cleanupErrors.length) {
    throw new Error(`${reason.message} Rollback failed: ${cleanupErrors.join("; ")}`);
  }

  throw reason;
}

export async function createVehicle(payload: VehiclePayload, actorId: string) {
  const client = createAdminClient();
  let vehicleId: string | null = null;
  let listingId: string | null = null;
  let uploadedPaths: string[] = [];

  try {
    const { data: vehicle, error: vehicleError } = await client.from("vehicles").insert(buildVehicleRecord(payload)).select("id").single();
    if (vehicleError || !vehicle) {
      throw new Error(vehicleError?.message ?? "Failed to create vehicle.");
    }

    vehicleId = vehicle.id;
    const { data: listing, error: listingError } = await client
      .from("vehicle_listings")
      .insert({ ...buildListingPatch(payload), stock_id: await getNextStockId(client), vehicle_id: vehicle.id })
      .select("id")
      .single();

    if (listingError || !listing) {
      throw new Error(listingError?.message ?? "Failed to create listing.");
    }

    listingId = listing.id;
    const media = await uploadVehicleMedia(listing.id, payload.media ?? []);
    uploadedPaths = getNewStoragePaths(payload.media ?? [], media);

    if (media.length) {
      const { error: mediaError } = await client.from("vehicle_media").insert(buildVehicleMediaRows(listing.id, media));
      if (mediaError) {
        throw new Error(mediaError.message);
      }
    }
  } catch (error) {
    await rollbackCreateVehicle(client, vehicleId, listingId, uploadedPaths, asError(error));
  }

  await logPortalActivity({ action: "vehicle_created", entityId: listingId!, entityType: "vehicle_listings", userId: actorId });
  return listingId!;
}

export async function updateVehicle(listingId: string, payload: VehiclePayload, actorId: string) {
  const client = createAdminClient();
  const { data: currentListing, error: listingLookupError } = await client
    .from("vehicle_listings")
    .select(
      "condition_notes, documentation_cost, extra_spend, highlights, id, internal_notes, maintenance_cost, other_cost, procurement_price, published_at, sold_at, status, target_selling_price, transport_cost, vehicle_id, vehicle_media(display_order, is_blurred, media_type, storage_path)"
    )
    .eq("id", listingId)
    .maybeSingle();

  if (listingLookupError || !currentListing) {
    throw new Error(listingLookupError?.message ?? "Listing not found.");
  }

  const { data: currentVehicle, error: vehicleLookupError } = await client
    .from("vehicles")
    .select("body_type, color, fuel_type, location, make, mileage, model, registration_year, transmission, variant, vin, year")
    .eq("id", currentListing.vehicle_id)
    .maybeSingle();

  if (vehicleLookupError || !currentVehicle) {
    throw new Error(vehicleLookupError?.message ?? "Vehicle not found.");
  }

  const nextMedia = payload.media ? await uploadVehicleMedia(listingId, payload.media) : null;
  const uploadedPaths = payload.media && nextMedia ? getNewStoragePaths(payload.media, nextMedia) : [];

  try {
    const { error: vehicleError } = await client.from("vehicles").update(buildVehicleRecord(payload)).eq("id", currentListing.vehicle_id);
    if (vehicleError) {
      throw new Error(vehicleError.message);
    }

    const { error: listingError } = await client.from("vehicle_listings").update(buildListingPatch(payload, currentListing)).eq("id", listingId);
    if (listingError) {
      throw new Error(listingError.message);
    }

    if (nextMedia) {
      await replaceVehicleMediaRows(client, listingId, buildVehicleMediaRows(listingId, nextMedia));
      const previousPaths = (currentListing.vehicle_media ?? []).map((item) => item.storage_path);
      const nextPaths = nextMedia.flatMap((item) => [item.originalStoragePath, item.blurredStoragePath]);
      await removeVehicleMedia(previousPaths.filter((path) => !nextPaths.includes(path)));
    }
  } catch (error) {
    await rollbackUpdateVehicle(client, listingId, currentListing, currentVehicle, uploadedPaths, asError(error));
  }

  await logPortalActivity({ action: "vehicle_updated", entityId: listingId, entityType: "vehicle_listings", userId: actorId });
}

export async function deleteVehicle(listingId: string, actorId: string) {
  const client = createAdminClient();
  const { data: listing, error } = await client
    .from("vehicle_listings")
    .select("vehicle_id, vehicle_media(storage_path), chat_threads(id)")
    .eq("id", listingId)
    .maybeSingle();

  if (error || !listing) {
    throw new Error(error?.message ?? "Listing not found.");
  }

  const threadIds = (listing.chat_threads ?? []).map((item) => item.id);
  if (threadIds.length) {
    const { error: messageError } = await client.from("chat_messages").delete().in("thread_id", threadIds);
    if (messageError) {
      throw new Error(messageError.message);
    }

    const { error: participantError } = await client.from("chat_participants").delete().in("thread_id", threadIds);
    if (participantError) {
      throw new Error(participantError.message);
    }

    const { error: threadError } = await client.from("chat_threads").delete().in("id", threadIds);
    if (threadError) {
      throw new Error(threadError.message);
    }
  }

  await removeVehicleMedia((listing.vehicle_media ?? []).map((item) => item.storage_path));

  const { error: listingDeleteError } = await client.from("vehicle_listings").delete().eq("id", listingId);
  if (listingDeleteError) {
    throw new Error(listingDeleteError.message);
  }

  const { error: vehicleDeleteError } = await client.from("vehicles").delete().eq("id", listing.vehicle_id);
  if (vehicleDeleteError) {
    throw new Error(vehicleDeleteError.message);
  }

  await logPortalActivity({ action: "vehicle_deleted", entityId: listingId, entityType: "vehicle_listings", userId: actorId });
}
