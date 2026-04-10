import "server-only";

import { VehicleRecord } from "@/lib/demo/portal-types";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { resolveStorageUrl } from "@/lib/supabase/portal-media";
import { PortalCatalogResult } from "@/lib/supabase/portal-types";
import { selectVehicleMediaVariants } from "@/lib/supabase/vehicle-media-variants";

type ListingRow = {
  condition_notes?: string | null;
  documentation_cost?: number | null;
  extra_spend?: number | null;
  highlights?: string | null;
  id: string;
  internal_notes?: string | null;
  maintenance_cost?: number | null;
  other_cost?: number | null;
  procurement_price?: number | null;
  published_at?: string | null;
  sold_at?: string | null;
  status: string;
  stock_id?: string | null;
  target_selling_price?: number | null;
  transport_cost?: number | null;
  updated_at?: string | null;
  vehicle_id: string;
  vehicle_media?: Array<{
    display_order?: number | null;
    id: string;
    is_blurred?: boolean | null;
    media_type?: string | null;
    storage_path: string;
  }>;
  vehicles?: Array<{
    body_type?: string | null;
    color?: string | null;
    fuel_type?: string | null;
    id: string;
    location?: string | null;
    make: string;
    mileage?: number | null;
    model: string;
    registration_year?: number | null;
    transmission?: string | null;
    variant?: string | null;
    vin?: string | null;
    year: number;
  }> | null;
};

function createStockId(listingId: string) {
  return `VH-${listingId.slice(0, 6).toUpperCase()}`;
}

async function fetchListingRows(statuses?: string[]) {
  const client = createAdminClient();
  let query = client
    .from("vehicle_listings")
    .select(`
      id,
      vehicle_id,
      stock_id,
      status,
      procurement_price,
      target_selling_price,
      extra_spend,
      maintenance_cost,
      documentation_cost,
      transport_cost,
      other_cost,
      internal_notes,
      condition_notes,
      highlights,
      updated_at,
      published_at,
      sold_at,
      vehicles!inner(
        id,
        vin,
        make,
        model,
        year,
        variant,
        color,
        mileage,
        fuel_type,
        transmission,
        body_type,
        registration_year,
        location
      ),
      vehicle_media(
        id,
        storage_path,
        media_type,
        is_blurred,
        display_order
      )
    `)
    .order("updated_at", { ascending: false });

  if (statuses?.length) {
    query = query.in("status", statuses);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as ListingRow[];
}

async function toVehicleRecord(row: ListingRow, canViewOriginalMedia: boolean): Promise<VehicleRecord> {
  const vehicle = Array.isArray(row.vehicles) ? row.vehicles[0] : null;
  if (!vehicle) {
    throw new Error(`Vehicle row missing for listing ${row.id}.`);
  }

  const media = await Promise.all(
    selectVehicleMediaVariants(row.vehicle_media ?? [], canViewOriginalMedia).map(async (item) => ({
      blurredStoragePath: item.blurredStoragePath,
      displayOrder: item.displayOrder,
      id: item.id,
      isBlurred: Boolean(item.isBlurred),
      mediaType: "image" as const,
      originalStoragePath: item.originalStoragePath,
      previewUrl: (await resolveStorageUrl("vehicle-images", item.storagePath)) ?? undefined,
      storagePath: item.storagePath,
    }))
  );

  return {
    listingId: row.id,
    vehicleId: vehicle.id,
    stockId: row.stock_id ?? createStockId(row.id),
    status: row.status as VehicleRecord["status"],
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    variant: vehicle.variant ?? undefined,
    color: vehicle.color ?? undefined,
    mileage: vehicle.mileage ?? undefined,
    fuelType: vehicle.fuel_type ?? undefined,
    transmission: vehicle.transmission ?? undefined,
    bodyType: vehicle.body_type ?? undefined,
    registrationYear: vehicle.registration_year ?? undefined,
    location: vehicle.location ?? undefined,
    vin: vehicle.vin ?? undefined,
    highlights: row.highlights ?? undefined,
    conditionNotes: row.condition_notes ?? undefined,
    procurementPrice: row.procurement_price ?? undefined,
    targetSellingPrice: row.target_selling_price ?? undefined,
    extraSpend: row.extra_spend ?? undefined,
    maintenanceCost: row.maintenance_cost ?? undefined,
    documentationCost: row.documentation_cost ?? undefined,
    transportCost: row.transport_cost ?? undefined,
    otherCost: row.other_cost ?? undefined,
    internalNotes: row.internal_notes ?? undefined,
    publishedAt: row.published_at ?? undefined,
    soldAt: row.sold_at ?? undefined,
    updatedAt: row.updated_at ?? new Date().toISOString(),
    media: media.length
      ? media
      : [
          {
            id: `placeholder-${row.id}`,
            storagePath: "/placeholder-car.svg",
            originalStoragePath: "/placeholder-car.svg",
            previewUrl: "/placeholder-car.svg",
            blurredStoragePath: "/placeholder-car.svg",
            mediaType: "image",
            isBlurred: false,
            displayOrder: 1,
          },
        ],
  };
}

function toCatalog(records: VehicleRecord[], showFinancials: boolean): PortalCatalogResult {
  return {
    records,
    vehicles: records.map((record) => ({
      id: record.vehicleId,
      make: record.make,
      model: record.model,
      year: record.year,
      variant: record.variant,
      color: record.color,
      mileage: record.mileage,
      fuel_type: record.fuelType,
      transmission: record.transmission,
      body_type: record.bodyType,
      location: record.location,
    })),
    listings: records.map((record) => ({
      id: record.listingId,
      vehicle_id: record.vehicleId,
      status: record.status,
      target_selling_price: showFinancials ? record.targetSellingPrice : undefined,
      highlights: record.highlights,
    })),
    media: records.flatMap((record) =>
      record.media.map((item) => ({
        id: item.id,
        listing_id: record.listingId,
        storage_path: item.previewUrl ?? item.storagePath,
        media_type: item.mediaType,
        is_blurred: item.isBlurred,
        display_order: item.displayOrder,
      }))
    ),
  };
}

export async function getVehicleCatalog(statuses?: string[], showFinancials = false, canViewOriginalMedia = false) {
  const rows = await fetchListingRows(statuses);
  const records = await Promise.all(rows.map((row) => toVehicleRecord(row, canViewOriginalMedia)));
  return toCatalog(records, showFinancials);
}

export async function getVehicleRecord(listingId: string, showFinancials = false, canViewOriginalMedia = false) {
  const rows = await fetchListingRows();
  const row = rows.find((item) => item.id === listingId);

  if (!row) {
    return null;
  }

  const record = await toVehicleRecord(row, canViewOriginalMedia);

  if (showFinancials) {
    return record;
  }

  return {
    ...record,
    vin: undefined,
    procurementPrice: undefined,
    targetSellingPrice: undefined,
    extraSpend: undefined,
    maintenanceCost: undefined,
    documentationCost: undefined,
    transportCost: undefined,
    otherCost: undefined,
    internalNotes: undefined,
  };
}

export function getStatusLabel(status: string): string {
  return status === "published" ? "Available" : status.charAt(0).toUpperCase() + status.slice(1);
}

export function sumVehicleCosts(record: VehicleRecord): number {
  return (
    (record.procurementPrice ?? 0) +
    (record.extraSpend ?? 0) +
    (record.maintenanceCost ?? 0) +
    (record.documentationCost ?? 0) +
    (record.transportCost ?? 0) +
    (record.otherCost ?? 0)
  );
}
