import "server-only";

import { buildSubmissionSummary } from "@/lib/demo/submission-utils";
import { SellerSubmissionInput, SellerSubmissionStatus } from "@/lib/demo/portal-types";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { logPortalActivity } from "@/lib/supabase/portal-activity";
import {
  getSellerSubmissionRow,
  parseSubmissionMedia,
} from "@/lib/supabase/portal-submission-records";
import {
  cloneSubmissionMediaAsListingInputs,
  getSubmissionMediaPaths,
  persistSubmissionMedia,
  removeSubmissionMedia,
  SubmissionMediaEntry,
} from "@/lib/supabase/portal-submission-media";
import { createVehicle } from "@/lib/supabase/portal-vehicles";

const EDITABLE_SUBMISSION_STATUSES: SellerSubmissionStatus[] = ["pending", "changes_requested"];

function ensureEditableSubmission(submission: Awaited<ReturnType<typeof getSellerSubmissionRow>>, actorId: string, canManageVehicles: boolean) {
  if (!submission) {
    throw new Error("Seller submission not found.");
  }

  if (canManageVehicles) {
    return submission;
  }

  const canEditOwnSubmission =
    submission.user_id === actorId &&
    !submission.linked_listing_id &&
    EDITABLE_SUBMISSION_STATUSES.includes(submission.status);

  if (!canEditOwnSubmission) {
    throw new Error("You can only edit your own pending uploads.");
  }

  return submission;
}

function validateSubmissionInput(input: SellerSubmissionInput) {
  if (!input.sellerName.trim() || !input.phone.trim() || !input.make.trim() || !input.model.trim() || !input.description.trim()) {
    throw new Error("Seller details, vehicle details, and description are required.");
  }

  const currentYear = new Date().getFullYear() + 1;
  if (!Number.isInteger(input.year) || input.year < 1990 || input.year > currentYear) {
    throw new Error("A valid vehicle year is required.");
  }
}

function buildSubmissionPatch(input: SellerSubmissionInput, media: SubmissionMediaEntry[], status?: SellerSubmissionStatus) {
  return {
    asking_price: input.askingPrice ?? null,
    description: input.description.trim(),
    location: input.location?.trim() || null,
    media_paths: media,
    mileage: input.mileage ?? null,
    seller_email: input.email?.trim() || null,
    seller_name: input.sellerName.trim(),
    seller_phone: input.phone.trim(),
    vehicle_make: input.make.trim(),
    vehicle_model: input.model.trim(),
    vehicle_variant: input.variant?.trim() || null,
    vehicle_year: input.year,
    ...(status ? { status } : {}),
  };
}

export async function createSellerSubmission(input: SellerSubmissionInput, userId: string) {
  validateSubmissionInput(input);

  const client = createAdminClient();
  const submissionId = crypto.randomUUID();
  const persistedMedia = await persistSubmissionMedia(submissionId, input.media ?? []);

  try {
    const { error } = await client.from("seller_submissions").insert({
      ...buildSubmissionPatch(input, persistedMedia.items, "pending"),
      id: submissionId,
      user_id: userId,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    await removeSubmissionMedia(persistedMedia.newPaths);
    throw error;
  }

  await logPortalActivity({
    action: "seller_submission_created",
    details: { summary: buildSubmissionSummary(input) },
    entityId: submissionId,
    entityType: "seller_submissions",
    userId,
  });
}

export async function editSellerSubmission(input: {
  actorId: string;
  canManageVehicles: boolean;
  data: SellerSubmissionInput;
  submissionId: string;
}) {
  validateSubmissionInput(input.data);

  const client = createAdminClient();
  const submission = ensureEditableSubmission(await getSellerSubmissionRow(input.submissionId), input.actorId, input.canManageVehicles);
  const existingMedia = parseSubmissionMedia(submission.media_paths);
  const nextMedia = await persistSubmissionMedia(submission.id, input.data.media ?? []);

  try {
    const { error } = await client
      .from("seller_submissions")
      .update(buildSubmissionPatch(input.data, nextMedia.items, input.canManageVehicles ? undefined : "pending"))
      .eq("id", submission.id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    await removeSubmissionMedia(nextMedia.newPaths);
    throw error;
  }

  const previousPaths = getSubmissionMediaPaths(existingMedia);
  const nextPaths = getSubmissionMediaPaths(nextMedia.items);
  await removeSubmissionMedia(previousPaths.filter((path) => !nextPaths.includes(path)));

  await logPortalActivity({
    action: "seller_submission_updated",
    details: { summary: buildSubmissionSummary(input.data) },
    entityId: submission.id,
    entityType: "seller_submissions",
    userId: input.actorId,
  });
}

export async function updateSellerSubmissionStatus(submissionId: string, status: SellerSubmissionStatus, actorId: string) {
  const client = createAdminClient();
  const { error } = await client.from("seller_submissions").update({ status }).eq("id", submissionId);
  if (error) {
    throw new Error(error.message);
  }

  await logPortalActivity({
    action: "seller_submission_status_updated",
    details: { status },
    entityId: submissionId,
    entityType: "seller_submissions",
    userId: actorId,
  });
}

export async function deleteSellerSubmission(actorId: string, canManageVehicles: boolean, submissionId: string) {
  const client = createAdminClient();
  const submission = ensureEditableSubmission(await getSellerSubmissionRow(submissionId), actorId, canManageVehicles);
  const media = parseSubmissionMedia(submission.media_paths);
  const { error } = await client.from("seller_submissions").delete().eq("id", submission.id);

  if (error) {
    throw new Error(error.message);
  }

  await removeSubmissionMedia(getSubmissionMediaPaths(media));
  await logPortalActivity({
    action: "seller_submission_deleted",
    entityId: submission.id,
    entityType: "seller_submissions",
    userId: actorId,
  });
}

export async function createListingFromSellerSubmission(submissionId: string, actorId: string) {
  const client = createAdminClient();
  const submission = await getSellerSubmissionRow(submissionId);

  if (!submission) {
    throw new Error("Seller submission not found.");
  }

  if (submission.linked_listing_id) {
    return submission.linked_listing_id;
  }

  const media = await cloneSubmissionMediaAsListingInputs(parseSubmissionMedia(submission.media_paths));
  const listingId = await createVehicle(
    {
      conditionNotes: submission.description ?? "",
      highlights: buildSubmissionSummary({
        make: submission.vehicle_make ?? "Vehicle",
        model: submission.vehicle_model ?? "Submission",
        variant: submission.vehicle_variant ?? undefined,
        year: submission.vehicle_year ?? new Date().getFullYear(),
      }),
      location: submission.location ?? undefined,
      make: submission.vehicle_make ?? "Vehicle",
      media,
      mileage: submission.mileage ?? undefined,
      model: submission.vehicle_model ?? "Submission",
      status: "draft",
      targetSellingPrice: submission.asking_price ?? undefined,
      variant: submission.vehicle_variant ?? undefined,
      year: submission.vehicle_year ?? new Date().getFullYear(),
    },
    actorId,
  );

  const { error } = await client
    .from("seller_submissions")
    .update({
      linked_listing_id: listingId,
      status: "reviewed",
    })
    .eq("id", submissionId);

  if (error) {
    throw new Error(error.message);
  }

  await logPortalActivity({
    action: "seller_submission_converted",
    entityId: submissionId,
    entityType: "seller_submissions",
    userId: actorId,
  });

  return listingId;
}
