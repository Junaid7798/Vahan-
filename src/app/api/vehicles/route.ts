import { NextRequest, NextResponse } from "next/server";
import { getViewerContext } from "@/lib/auth/viewer";
import { isSupabaseConfigured } from "@/lib/auth/session";
import { createVehicle } from "@/lib/supabase/portal-vehicles";

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
  status: "archived" | "draft" | "published" | "reserved" | "sold";
  targetSellingPrice?: number;
  transmission?: string;
  transportCost?: number;
  variant?: string;
  vin?: string;
  year: number;
}

export async function POST(request: NextRequest) {
  const viewer = await getViewerContext();
  if (!viewer?.permissions.canManageVehicles) {
    return NextResponse.json({ error: "Only staff can create vehicles." }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const payload = (await request.json()) as VehiclePayload;
  if (!payload.make || !payload.model || !payload.year) {
    return NextResponse.json({ error: "Make, model, and year are required." }, { status: 400 });
  }

  try {
    const listingId = await createVehicle(payload, viewer.profile.id);
    return NextResponse.json({ listingId, success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed." }, { status: 400 });
  }
}
