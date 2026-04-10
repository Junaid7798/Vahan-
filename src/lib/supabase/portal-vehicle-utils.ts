import "server-only";

import { MediaInput } from "@/lib/supabase/vehicle-media-variants";

export interface VehiclePayload {
  bodyType?: string;
  color?: string;
  conditionNotes?: string;
  documentationCost?: number;
  extraSpend?: number;
  fuelType?: string;
  highlights?: string;
  internalNotes?: string;
  location?: string;
  maintenanceCost?: number;
  make: string;
  media?: MediaInput[];
  mileage?: number;
  model: string;
  otherCost?: number;
  procurementPrice?: number;
  registrationYear?: number;
  status: "archived" | "draft" | "published" | "reserved" | "sold";
  targetSellingPrice?: number;
  transmission?: string;
  transportCost?: number;
  variant?: string;
  vin?: string;
  year: number;
}

export function buildVehicleRecord(payload: VehiclePayload) {
  return {
    body_type: payload.bodyType ?? null,
    color: payload.color ?? null,
    fuel_type: payload.fuelType ?? null,
    location: payload.location ?? null,
    make: payload.make,
    mileage: payload.mileage ?? null,
    model: payload.model,
    registration_year: payload.registrationYear ?? null,
    transmission: payload.transmission ?? null,
    variant: payload.variant ?? null,
    vin: payload.vin ?? null,
    year: payload.year,
  };
}

export function buildListingPatch(payload: VehiclePayload, current?: { published_at?: string | null; sold_at?: string | null }) {
  const now = new Date().toISOString();
  return {
    condition_notes: payload.conditionNotes ?? null,
    documentation_cost: payload.documentationCost ?? null,
    extra_spend: payload.extraSpend ?? null,
    highlights: payload.highlights ?? null,
    internal_notes: payload.internalNotes ?? null,
    maintenance_cost: payload.maintenanceCost ?? null,
    other_cost: payload.otherCost ?? null,
    procurement_price: payload.procurementPrice ?? null,
    published_at: payload.status === "published" ? current?.published_at ?? now : current?.published_at ?? null,
    sold_at: payload.status === "sold" ? current?.sold_at ?? now : null,
    status: payload.status,
    target_selling_price: payload.targetSellingPrice ?? null,
    transport_cost: payload.transportCost ?? null,
  };
}
