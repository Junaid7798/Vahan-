import "server-only";

import { buildSubmissionSummary } from "@/lib/demo/submission-utils";
import { SellerSubmissionRecord, SellerSubmissionStatus, VehicleMediaRecord } from "@/lib/demo/portal-types";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { resolveStorageUrl } from "@/lib/supabase/portal-media";
import { SubmissionMediaEntry } from "@/lib/supabase/portal-submission-media";

export interface SellerSubmissionRow {
  asking_price: number | null;
  created_at: string;
  description: string | null;
  id: string;
  linked_listing_id: string | null;
  location: string | null;
  media_paths: unknown;
  mileage: number | null;
  seller_email: string | null;
  seller_name: string;
  seller_phone: string;
  status: SellerSubmissionStatus;
  updated_at: string;
  user_id: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_variant: string | null;
  vehicle_year: number | null;
}

function toVehicleMediaRecord(submissionId: string, media: SubmissionMediaEntry[], previews: Array<string | null>): VehicleMediaRecord[] {
  return media.map((item, index) => ({
    displayOrder: item.displayOrder,
    id: `submission-media-${submissionId}-${index + 1}`,
    isBlurred: false,
    mediaType: "image",
    previewUrl: previews[index] ?? undefined,
    storagePath: item.storagePath,
  }));
}

export function parseSubmissionMedia(value: unknown): SubmissionMediaEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .flatMap((item) => {
      if (typeof item === "string") {
        return [{ displayOrder: 0, storagePath: item }];
      }

      if (!item || typeof item !== "object") {
        return [];
      }

      const candidate = item as { displayOrder?: unknown; storagePath?: unknown };
      if (typeof candidate.storagePath !== "string") {
        return [];
      }

      return [{
        displayOrder: typeof candidate.displayOrder === "number" ? candidate.displayOrder : 0,
        storagePath: candidate.storagePath,
      }];
    })
    .sort((left, right) => left.displayOrder - right.displayOrder);
}

export async function mapSellerSubmissionRow(row: SellerSubmissionRow): Promise<SellerSubmissionRecord> {
  const make = row.vehicle_make ?? "Vehicle";
  const model = row.vehicle_model ?? "Submission";
  const year = row.vehicle_year ?? new Date().getFullYear();
  const media = parseSubmissionMedia(row.media_paths);
  const previews = await Promise.all(media.map((item) => resolveStorageUrl("vehicle-images", item.storagePath)));

  return {
    askingPrice: row.asking_price ?? undefined,
    description: row.description ?? "",
    email: row.seller_email ?? undefined,
    id: row.id,
    linkedListingId: row.linked_listing_id ?? undefined,
    location: row.location ?? undefined,
    make,
    media: toVehicleMediaRecord(row.id, media, previews),
    mileage: row.mileage ?? undefined,
    model,
    phone: row.seller_phone,
    sellerName: row.seller_name,
    status: row.status,
    submittedAt: row.created_at,
    updatedAt: row.updated_at,
    userId: row.user_id ?? row.seller_email ?? row.id,
    variant: row.vehicle_variant ?? undefined,
    vehicleSummary: buildSubmissionSummary({ make, model, variant: row.vehicle_variant ?? undefined, year }),
    year,
  };
}

async function listSellerSubmissionRows(userId?: string) {
  const client = createAdminClient();
  let query = client
    .from("seller_submissions")
    .select("asking_price, created_at, description, id, linked_listing_id, location, media_paths, mileage, seller_email, seller_name, seller_phone, status, updated_at, user_id, vehicle_make, vehicle_model, vehicle_variant, vehicle_year")
    .order("updated_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SellerSubmissionRow[];
}

export async function getSellerSubmissionRow(submissionId: string) {
  const client = createAdminClient();
  const { data, error } = await client
    .from("seller_submissions")
    .select("asking_price, created_at, description, id, linked_listing_id, location, media_paths, mileage, seller_email, seller_name, seller_phone, status, updated_at, user_id, vehicle_make, vehicle_model, vehicle_variant, vehicle_year")
    .eq("id", submissionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as SellerSubmissionRow | null;
}

export async function getSellerSubmissions(userId?: string) {
  const rows = await listSellerSubmissionRows(userId);
  return Promise.all(rows.map(mapSellerSubmissionRow));
}
