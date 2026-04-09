import "server-only";

import { createAdminClient } from "@/lib/supabase/admin-client";
import { logPortalActivity } from "@/lib/supabase/portal-activity";

interface CreateReservationInput {
  listingId: string;
  message?: string;
  userId: string;
}

async function getActiveReservation(listingId: string, userId: string) {
  const client = createAdminClient();
  const { data, error } = await client
    .from("reservation_requests")
    .select("id, status")
    .eq("listing_id", listingId)
    .eq("user_id", userId)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getActiveWaitlistEntry(listingId: string, userId: string) {
  const client = createAdminClient();
  const { data, error } = await client
    .from("reservation_waitlist")
    .select("id, status")
    .eq("listing_id", listingId)
    .eq("user_id", userId)
    .eq("status", "waiting")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function reorderWaitlist(listingId: string) {
  const client = createAdminClient();
  const { data, error } = await client
    .from("reservation_waitlist")
    .select("id")
    .eq("listing_id", listingId)
    .eq("status", "waiting")
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  for (const [index, item] of (data ?? []).entries()) {
    const { error: updateError } = await client
      .from("reservation_waitlist")
      .update({ position: index + 1 })
      .eq("id", item.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}

export async function createReservation(input: CreateReservationInput) {
  const client = createAdminClient();
  const { data: listing, error: listingError } = await client
    .from("vehicle_listings")
    .select("id, status")
    .eq("id", input.listingId)
    .maybeSingle();

  if (listingError) {
    throw new Error(listingError.message);
  }

  if (!listing || !["published", "reserved"].includes(listing.status)) {
    throw new Error("This vehicle cannot accept reservations right now.");
  }

  const activeReservation = await getActiveReservation(input.listingId, input.userId);
  if (activeReservation) {
    throw new Error("You already have an active reservation request for this vehicle.");
  }

  if (listing.status === "reserved") {
    const activeWaitlistEntry = await getActiveWaitlistEntry(input.listingId, input.userId);
    if (activeWaitlistEntry) {
      throw new Error("You are already on the waitlist for this vehicle.");
    }

    const { count, error: countError } = await client
      .from("reservation_waitlist")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", input.listingId)
      .eq("status", "waiting");

    if (countError) {
      throw new Error(countError.message);
    }

    const { data, error } = await client
      .from("reservation_waitlist")
      .insert({
        listing_id: input.listingId,
        user_id: input.userId,
        position: (count ?? 0) + 1,
        status: "waiting",
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to join the waitlist.");
    }

    await logPortalActivity({
      action: "waitlist_joined",
      entityId: data.id,
      entityType: "reservation_waitlist",
      userId: input.userId,
    });
    return;
  }

  const { data, error } = await client
    .from("reservation_requests")
    .insert({
      listing_id: input.listingId,
      user_id: input.userId,
      message: input.message ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create reservation request.");
  }

  await logPortalActivity({
    action: "reservation_requested",
    entityId: data.id,
    entityType: "reservation_requests",
    userId: input.userId,
  });
}

export async function updateReservationStatus(reservationId: string, status: "approved" | "rejected", actorId: string) {
  const client = createAdminClient();
  const { data: reservation, error: reservationError } = await client
    .from("reservation_requests")
    .update({ status })
    .eq("id", reservationId)
    .select("id, listing_id")
    .single();

  if (reservationError || !reservation) {
    throw new Error(reservationError?.message ?? "Reservation not found.");
  }

  if (status === "approved") {
    const { error: listingError } = await client
      .from("vehicle_listings")
      .update({ sold_at: null, status: "reserved" })
      .eq("id", reservation.listing_id);

    if (listingError) {
      throw new Error(listingError.message);
    }

    const { error: competingError } = await client
      .from("reservation_requests")
      .update({ status: "rejected" })
      .eq("listing_id", reservation.listing_id)
      .neq("id", reservationId)
      .eq("status", "pending");

    if (competingError) {
      throw new Error(competingError.message);
    }
  }

  await logPortalActivity({
    action: "reservation_updated",
    details: { status },
    entityId: reservationId,
    entityType: "reservation_requests",
    userId: actorId,
  });
}

export async function updateWaitlistStatus(waitlistId: string, status: "promoted" | "removed", actorId: string) {
  const client = createAdminClient();
  const nextStatus = status === "promoted" ? "promoted" : "removed";
  const { data: waitlist, error } = await client
    .from("reservation_waitlist")
    .update({ status: nextStatus })
    .eq("id", waitlistId)
    .select("id, listing_id")
    .single();

  if (error || !waitlist) {
    throw new Error(error?.message ?? "Waitlist entry not found.");
  }

  await reorderWaitlist(waitlist.listing_id);
  await logPortalActivity({
    action: "waitlist_updated",
    details: { status: nextStatus },
    entityId: waitlistId,
    entityType: "reservation_waitlist",
    userId: actorId,
  });
}
