import { NextRequest, NextResponse } from "next/server";
import { getViewerContext } from "@/lib/auth/viewer";
import { VehicleMediaRecord, VehicleRecord } from "@/lib/demo/portal-types";
import { updatePortalStore } from "@/lib/demo/portal-store";
import { addActivity } from "@/lib/demo/portal-utils";
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
  make?: string;
  media?: Array<{ displayOrder: number; storagePath: string }>;
  mileage?: number;
  model?: string;
  otherCost?: number;
  procurementPrice?: number;
  registrationYear?: number;
  status?: VehicleRecord["status"];
  targetSellingPrice?: number;
  transmission?: string;
  transportCost?: number;
  variant?: string;
  vin?: string;
  year?: number;
}

function toMedia(items: VehiclePayload["media"], record: VehicleRecord): VehicleMediaRecord[] {
  if (!items?.length) {
    return [{ id: `media-${record.vehicleId}`, storagePath: "/placeholder-car.svg", mediaType: "image", isBlurred: false, displayOrder: 1 }];
  }

  return items.map((item, index) => ({
    id: `media-${record.vehicleId}-${index + 1}`,
    storagePath: item.storagePath,
    mediaType: "image",
    isBlurred: false,
    displayOrder: item.displayOrder,
  }));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const viewer = await getViewerContext();
  if (!viewer?.permissions.canManageVehicles) {
    return NextResponse.json({ error: "Only staff can update vehicles." }, { status: 403 });
  }

  const { listingId } = await params;
  const payload = (await request.json()) as VehiclePayload;
  const records = await readVehicleStore();
  const index = records.findIndex((record) => record.listingId === listingId);

  if (index === -1) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const currentRecord = records[index];
  records[index] = {
    ...currentRecord,
    ...payload,
    updatedAt: new Date().toISOString(),
    media: payload.media ? toMedia(payload.media, currentRecord) : currentRecord.media,
    publishedAt: payload.status === "published" ? currentRecord.publishedAt ?? new Date().toISOString() : currentRecord.publishedAt,
    soldAt: payload.status === "sold" ? currentRecord.soldAt ?? new Date().toISOString() : undefined,
  };

  await writeVehicleStore(records);
  return NextResponse.json({ success: true, record: records[index] });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const viewer = await getViewerContext();
  if (!viewer?.permissions.canManageVehicles) {
    return NextResponse.json({ error: "Only staff can delete vehicles." }, { status: 403 });
  }

  const { listingId } = await params;
  const records = await readVehicleStore();
  const record = records.find((item) => item.listingId === listingId);

  if (!record) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const timestamp = new Date().toISOString();
  await writeVehicleStore(records.filter((item) => item.listingId !== listingId));
  await updatePortalStore((state) => {
    const removedThreadIds = new Set(state.threads.filter((item) => item.listingId === listingId).map((item) => item.id));

    return {
      ...state,
      inquiries: state.inquiries.filter((item) => item.listingId !== listingId),
      reservations: state.reservations.filter((item) => item.listingId !== listingId),
      waitlist: state.waitlist.filter((item) => item.listingId !== listingId),
      resales: state.resales.filter((item) => item.listingId !== listingId),
      threads: state.threads.filter((item) => item.listingId !== listingId),
      messages: state.messages.filter((item) => !removedThreadIds.has(item.threadId)),
      submissions: state.submissions.map((item) =>
        item.linkedListingId === listingId
          ? { ...item, linkedListingId: undefined, updatedAt: timestamp }
          : item
      ),
      activities: addActivity(state, "Listing deleted", `${record.year} ${record.make} ${record.model} was removed from inventory.`),
    };
  });

  return NextResponse.json({ success: true });
}
