import { NextRequest, NextResponse } from "next/server";
import { getViewerContext } from "@/lib/auth/viewer";
import { isSupabaseConfigured } from "@/lib/auth/session";
import { deleteVehicle, updateVehicle } from "@/lib/supabase/portal-vehicles";
import { MediaInput } from "@/lib/supabase/vehicle-media-variants";

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

function unavailable() {
  return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ listingId: string }> }) {
  const viewer = await getViewerContext();
  if (!viewer?.permissions.canManageVehicles) {
    return NextResponse.json({ error: "Only staff can update vehicles." }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return unavailable();
  }

  try {
    const { listingId } = await params;
    await updateVehicle(listingId, (await request.json()) as VehiclePayload, viewer.profile.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed." }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ listingId: string }> }) {
  const viewer = await getViewerContext();
  if (!viewer?.permissions.canManageVehicles) {
    return NextResponse.json({ error: "Only staff can delete vehicles." }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return unavailable();
  }

  try {
    const { listingId } = await params;
    await deleteVehicle(listingId, viewer.profile.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed." }, { status: 400 });
  }
}
