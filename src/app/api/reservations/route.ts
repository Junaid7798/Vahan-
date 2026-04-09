import { NextRequest, NextResponse } from "next/server";
import { getViewerContext } from "@/lib/auth/viewer";
import { isSupabaseConfigured } from "@/lib/auth/session";
import { createDemoReservationIntent } from "@/lib/demo/portal-workflows";
import { createReservation } from "@/lib/supabase/portal-reservations";

export async function POST(request: NextRequest) {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 403 });
  }

  const body = (await request.json()) as { listingId: string; message?: string };

  try {
    if (isSupabaseConfigured()) {
      await createReservation({ listingId: body.listingId, message: body.message, userId: viewer.profile.id });
    } else {
      await createDemoReservationIntent({ listingId: body.listingId, message: body.message, userId: viewer.profile.id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed." }, { status: 400 });
  }
}
