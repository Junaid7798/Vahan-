import { NextRequest, NextResponse } from "next/server";
import { getViewerContext } from "@/lib/auth/viewer";
import { isSupabaseConfigured } from "@/lib/auth/session";
import { createDemoResaleRequest } from "@/lib/demo/portal-workflows";
import { createResale } from "@/lib/supabase/portal-resales";

export async function POST(request: NextRequest) {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 403 });
  }

  const body = (await request.json()) as { expectedTimeline: string; listingId: string };

  try {
    if (isSupabaseConfigured()) {
      await createResale({ expectedTimeline: body.expectedTimeline, listingId: body.listingId, userId: viewer.profile.id });
    } else {
      await createDemoResaleRequest({ expectedTimeline: body.expectedTimeline, listingId: body.listingId, userId: viewer.profile.id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed." }, { status: 400 });
  }
}
