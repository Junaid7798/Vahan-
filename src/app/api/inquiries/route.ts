import { NextRequest, NextResponse } from "next/server";
import { getViewerContext } from "@/lib/auth/viewer";
import { isSupabaseConfigured } from "@/lib/auth/session";
import { createDemoInquiry } from "@/lib/demo/portal-workflows";
import { createInquiry } from "@/lib/supabase/portal-inquiries";

export async function POST(request: NextRequest) {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 403 });
  }

  const body = (await request.json()) as { listingId: string; message: string; subject: string };

  try {
    if (isSupabaseConfigured()) {
      await createInquiry({ listingId: body.listingId, message: body.message, subject: body.subject, userId: viewer.profile.id });
    } else {
      await createDemoInquiry({ listingId: body.listingId, message: body.message, subject: body.subject, userId: viewer.profile.id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed." }, { status: 400 });
  }
}
