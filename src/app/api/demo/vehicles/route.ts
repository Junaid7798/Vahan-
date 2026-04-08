import { NextRequest, NextResponse } from "next/server";
import { getViewerContext } from "@/lib/auth/viewer";
import { VehicleMediaRecord, VehicleRecord } from "@/lib/demo/portal-types";
import { readVehicleStore, writeVehicleStore } from "@/lib/demo/vehicle-store";

interface VehiclePayload {
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
  media?: Array<{ displayOrder: number; storagePath: string }>;
  mileage?: number;
  model: string;
  otherCost?: number;
  procurementPrice?: number;
  registrationYear?: number;
  status: VehicleRecord["status"];
  targetSellingPrice?: number;
  transmission?: string;
  transportCost?: number;
  variant?: string;
  vin?: string;
  year: number;
}

function toMedia(items: VehiclePayload["media"], fallbackId: string): VehicleMediaRecord[] {
  if (!items?.length) {
    return [{ id: `media-${fallbackId}`, storagePath: "/placeholder-car.svg", mediaType: "image", isBlurred: false, displayOrder: 1 }];
  }

  return items.map((item, index) => ({
    id: `media-${fallbackId}-${index + 1}`,
    storagePath: item.storagePath,
    mediaType: "image",
    isBlurred: false,
    displayOrder: item.displayOrder,
  }));
}

function getNextStockId(records: VehicleRecord[]) {
  const highest = records.reduce((max, record) => {
    const numeric = Number(record.stockId.replace(/\D/g, ""));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 200);

  return `VH-${highest + 1}`;
}

export async function POST(request: NextRequest) {
  const viewer = await getViewerContext();
  if (!viewer?.permissions.canManageVehicles) {
    return NextResponse.json({ error: "Only staff can create vehicles." }, { status: 403 });
  }

  const payload = (await request.json()) as VehiclePayload;

  if (!payload.make || !payload.model || !payload.year) {
    return NextResponse.json({ error: "Make, model, and year are required." }, { status: 400 });
  }

  const records = await readVehicleStore();
  const timestamp = new Date().toISOString();
  const id = crypto.randomUUID().slice(0, 8);

  const record: VehicleRecord = {
    listingId: `listing-${id}`,
    vehicleId: `vehicle-${id}`,
    stockId: getNextStockId(records),
    make: payload.make,
    model: payload.model,
    year: payload.year,
    variant: payload.variant,
    color: payload.color,
    mileage: payload.mileage,
    fuelType: payload.fuelType,
    transmission: payload.transmission,
    bodyType: payload.bodyType,
    registrationYear: payload.registrationYear,
    location: payload.location,
    vin: payload.vin,
    highlights: payload.highlights,
    conditionNotes: payload.conditionNotes,
    procurementPrice: payload.procurementPrice,
    targetSellingPrice: payload.targetSellingPrice,
    extraSpend: payload.extraSpend,
    maintenanceCost: payload.maintenanceCost,
    documentationCost: payload.documentationCost,
    transportCost: payload.transportCost,
    otherCost: payload.otherCost,
    internalNotes: payload.internalNotes,
    status: payload.status,
    publishedAt: payload.status === "published" ? timestamp : undefined,
    updatedAt: timestamp,
    media: toMedia(payload.media, id),
  };

  await writeVehicleStore([record, ...records]);
  return NextResponse.json({ success: true, record });
}
