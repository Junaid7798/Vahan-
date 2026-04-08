import { VehicleRecord } from "@/lib/demo/portal-types";
import { readVehicleStore } from "@/lib/demo/vehicle-store";

type GridVehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  variant?: string;
  color?: string;
  mileage?: number;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  location?: string;
};

type GridListing = {
  id: string;
  vehicle_id: string;
  status: string;
  target_selling_price?: number;
  highlights?: string;
};

type GridMedia = {
  id: string;
  listing_id: string;
  storage_path: string;
  media_type: string;
  is_blurred: boolean;
  display_order: number;
};

function toVehicle(record: VehicleRecord): GridVehicle {
  return {
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
  };
}

function toListing(record: VehicleRecord): GridListing {
  return {
    id: record.listingId,
    vehicle_id: record.vehicleId,
    status: record.status,
    target_selling_price: record.targetSellingPrice,
    highlights: record.highlights,
  };
}

function toMedia(record: VehicleRecord): GridMedia[] {
  return record.media.map((item) => ({
    id: item.id,
    listing_id: record.listingId,
    storage_path: item.storagePath,
    media_type: item.mediaType,
    is_blurred: item.isBlurred,
    display_order: item.displayOrder,
  }));
}

export async function getVehicleCatalog(statuses?: string[]) {
  const records = await readVehicleStore();
  const filtered = statuses?.length
    ? records.filter((record) => statuses.includes(record.status))
    : records;

  return {
    records: filtered,
    vehicles: filtered.map(toVehicle),
    listings: filtered.map(toListing),
    media: filtered.flatMap(toMedia),
  };
}

export async function getVehicleRecord(listingId: string) {
  const records = await readVehicleStore();
  return records.find((record) => record.listingId === listingId) ?? null;
}

export function getStatusLabel(status: string): string {
  return status === "published"
    ? "Available"
    : status.charAt(0).toUpperCase() + status.slice(1);
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
