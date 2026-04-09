import "server-only";

import { createAdminClient } from "@/lib/supabase/admin-client";
import { logPortalActivity } from "@/lib/supabase/portal-activity";

interface CreateInquiryInput {
  listingId: string;
  message: string;
  subject: string;
  userId: string;
}

export async function createInquiry(input: CreateInquiryInput) {
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
    throw new Error("This vehicle is not accepting inquiries.");
  }

  const { data, error } = await client
    .from("inquiries")
    .insert({
      listing_id: input.listingId,
      user_id: input.userId,
      subject: input.subject,
      message: input.message,
      status: "open",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create inquiry.");
  }

  await logPortalActivity({
    action: "inquiry_created",
    details: { subject: input.subject },
    entityId: data.id,
    entityType: "inquiries",
    userId: input.userId,
  });
}

export async function updateInquiryStatus(inquiryId: string, status: "contacted" | "closed", actorId: string) {
  const client = createAdminClient();
  const { error } = await client
    .from("inquiries")
    .update({ status })
    .eq("id", inquiryId);

  if (error) {
    throw new Error(error.message);
  }

  await logPortalActivity({
    action: "inquiry_updated",
    details: { status },
    entityId: inquiryId,
    entityType: "inquiries",
    userId: actorId,
  });
}
