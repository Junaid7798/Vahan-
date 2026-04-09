import "server-only";

import { createAdminClient } from "@/lib/supabase/admin-client";
import { logPortalActivity } from "@/lib/supabase/portal-activity";

interface CreateResaleInput {
  expectedTimeline: string;
  listingId: string;
  userId: string;
}

async function getNextStockId() {
  const client = createAdminClient();
  const { data, error } = await client.from("vehicle_listings").select("stock_id");
  if (error) {
    throw new Error(error.message);
  }

  const highest = (data ?? []).reduce((max, item) => {
    const value = Number((item.stock_id ?? "").replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 300);

  return `VH-${highest + 1}`;
}

export async function createResale(input: CreateResaleInput) {
  const client = createAdminClient();
  const { data, error } = await client
    .from("resale_requests")
    .insert({
      listing_id: input.listingId,
      user_id: input.userId,
      expected_timeline: input.expectedTimeline,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create resale request.");
  }

  await logPortalActivity({
    action: "resale_requested",
    entityId: data.id,
    entityType: "resale_requests",
    userId: input.userId,
  });
}

export async function updateResaleStatus(resaleId: string, status: "approved" | "rejected" | "relisted", actorId: string) {
  const client = createAdminClient();
  const { data: resale, error: resaleError } = await client
    .from("resale_requests")
    .update({ status })
    .eq("id", resaleId)
    .select("id, listing_id")
    .single();

  if (resaleError || !resale) {
    throw new Error(resaleError?.message ?? "Resale request not found.");
  }

  if (status === "relisted") {
    const { data: listing, error: listingError } = await client
      .from("vehicle_listings")
      .select("vehicle_id, procurement_price, target_selling_price, extra_spend, maintenance_cost, documentation_cost, transport_cost, other_cost, internal_notes, condition_notes, highlights")
      .eq("id", resale.listing_id)
      .maybeSingle();

    if (listingError || !listing) {
      throw new Error(listingError?.message ?? "Original listing not found.");
    }

    const { data: created, error: createError } = await client
      .from("vehicle_listings")
      .insert({
        vehicle_id: listing.vehicle_id,
        stock_id: await getNextStockId(),
        status: "draft",
        procurement_price: listing.procurement_price,
        target_selling_price: listing.target_selling_price,
        extra_spend: listing.extra_spend,
        maintenance_cost: listing.maintenance_cost,
        documentation_cost: listing.documentation_cost,
        transport_cost: listing.transport_cost,
        other_cost: listing.other_cost,
        internal_notes: listing.internal_notes,
        condition_notes: listing.condition_notes,
        highlights: listing.highlights,
      })
      .select("id")
      .single();

    if (createError || !created) {
      throw new Error(createError?.message ?? "Failed to create the relisting.");
    }

    const { data: media, error: mediaError } = await client
      .from("vehicle_media")
      .select("storage_path, media_type, is_blurred, display_order")
      .eq("listing_id", resale.listing_id);

    if (mediaError) {
      throw new Error(mediaError.message);
    }

    if ((media ?? []).length) {
      const { error: insertMediaError } = await client.from("vehicle_media").insert(
        media!.map((item) => ({
          listing_id: created.id,
          storage_path: item.storage_path,
          media_type: item.media_type,
          is_blurred: item.is_blurred,
          display_order: item.display_order,
        }))
      );

      if (insertMediaError) {
        throw new Error(insertMediaError.message);
      }
    }
  }

  await logPortalActivity({
    action: "resale_updated",
    details: { status },
    entityId: resaleId,
    entityType: "resale_requests",
    userId: actorId,
  });
}
