import { NextRequest, NextResponse } from "next/server";
import { getViewerContext } from "@/lib/auth/viewer";
import { isSupabaseConfigured } from "@/lib/auth/session";
import { createOrGetDemoThread, markDemoThreadClosed, sendDemoChatMessage } from "@/lib/demo/portal-chat";
import {
  createDemoInquiry,
  createDemoResaleRequest,
  createDemoReservationIntent,
  createDemoSellerSubmission,
  deleteDemoSellerSubmission,
  editDemoSellerSubmission,
  updateDemoInquiryStatus,
  updateDemoResale,
  updateDemoReservation,
  updateDemoSellerSubmissionStatus,
  updateDemoWaitlist,
} from "@/lib/demo/portal-workflows";
import { updateDemoProfile, updateDemoSettings, updateDemoUser } from "@/lib/demo/portal-users";
import { createInquiry, updateInquiryStatus } from "@/lib/supabase/portal-inquiries";
import { closeChatThread, createOrGetChatThread, sendChatMessage } from "@/lib/supabase/portal-chat";
import { createResale, updateResaleStatus } from "@/lib/supabase/portal-resales";
import { createReservation, updateReservationStatus, updateWaitlistStatus } from "@/lib/supabase/portal-reservations";
import {
  createListingFromSellerSubmission,
  createSellerSubmission,
  deleteSellerSubmission,
  editSellerSubmission as editSupabaseSellerSubmission,
  updateSellerSubmissionStatus,
} from "@/lib/supabase/portal-submissions";
import { updateProfile, updateSettings, updateUserAccess } from "@/lib/supabase/portal-users";

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

function getSubmissionPayload(payload: Record<string, unknown>) {
  return {
    askingPrice: typeof payload.askingPrice === "number" ? payload.askingPrice : undefined,
    description: typeof payload.description === "string" ? payload.description : "",
    email: typeof payload.email === "string" ? payload.email : undefined,
    location: typeof payload.location === "string" ? payload.location : undefined,
    make: typeof payload.make === "string" ? payload.make : "",
    media: Array.isArray(payload.media)
      ? payload.media
          .filter((item): item is { displayOrder: number; storagePath: string } => {
            if (!item || typeof item !== "object") return false;
            const candidate = item as { displayOrder?: unknown; storagePath?: unknown };
            return typeof candidate.displayOrder === "number" && typeof candidate.storagePath === "string";
          })
          .map((item) => ({ displayOrder: item.displayOrder, storagePath: item.storagePath }))
      : [],
    mileage: typeof payload.mileage === "number" ? payload.mileage : undefined,
    model: typeof payload.model === "string" ? payload.model : "",
    phone: typeof payload.phone === "string" ? payload.phone : "",
    sellerName: typeof payload.sellerName === "string" ? payload.sellerName : "",
    variant: typeof payload.variant === "string" ? payload.variant : undefined,
    year: typeof payload.year === "number" ? payload.year : 0,
  };
}

export async function POST(request: NextRequest) {
  const viewer = await getViewerContext();
  if (!viewer) return forbidden("You must be logged in.");
  const body = (await request.json()) as { action: string; payload: Record<string, unknown> };

  try {
    if (!isSupabaseConfigured()) {
      if (body.action === "create_chat_thread") await createOrGetDemoThread({ listingId: body.payload.listingId as string | undefined, threadType: body.payload.threadType as "support" | "vehicle", title: body.payload.title as string | undefined, userId: viewer.profile.id });
      else if (body.action === "create_inquiry") await createDemoInquiry({ listingId: body.payload.listingId as string, message: body.payload.message as string, preferredContactMethod: body.payload.preferredContactMethod as "phone" | "chat" | "email" | undefined, preferredContactTime: body.payload.preferredContactTime as string | undefined, subject: body.payload.subject as string, userId: viewer.profile.id });
      else if (body.action === "create_resale") await createDemoResaleRequest({ expectedTimeline: body.payload.expectedTimeline as string, listingId: body.payload.listingId as string, userId: viewer.profile.id });
      else if (body.action === "create_reservation") await createDemoReservationIntent({ listingId: body.payload.listingId as string, message: body.payload.message as string | undefined, preferredInspectionDate: body.payload.preferredInspectionDate as string | undefined, userId: viewer.profile.id });
      else if (body.action === "create_submission") await createDemoSellerSubmission({ ...getSubmissionPayload(body.payload), userId: viewer.profile.id });
      else if (body.action === "send_chat_message") await sendDemoChatMessage({ content: body.payload.content as string | undefined, messageType: body.payload.messageType as "image" | "text" | "voice", senderId: viewer.profile.id, senderName: viewer.profile.full_name ?? viewer.user.email ?? "User", threadId: body.payload.threadId as string, voiceDuration: body.payload.voiceDuration as number | undefined });
      else if (body.action === "update_profile") await updateDemoProfile({ city: body.payload.city as string, email: viewer.user.email ?? viewer.profile.id, fullName: body.payload.fullName as string, phone: body.payload.phone as string, preferredLocale: body.payload.preferredLocale as "en" | "hi" });
      else return NextResponse.json({ error: `Unsupported action ${body.action}` }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (body.action === "create_chat_thread") await createOrGetChatThread({ listingId: body.payload.listingId as string | undefined, threadType: body.payload.threadType as "support" | "vehicle", title: body.payload.title as string | undefined, userId: viewer.profile.id });
    else if (body.action === "create_inquiry") await createInquiry({ listingId: body.payload.listingId as string, message: body.payload.message as string, subject: body.payload.subject as string, userId: viewer.profile.id });
    else if (body.action === "create_resale") await createResale({ expectedTimeline: body.payload.expectedTimeline as string, listingId: body.payload.listingId as string, userId: viewer.profile.id });
    else if (body.action === "create_reservation") await createReservation({ listingId: body.payload.listingId as string, message: body.payload.message as string | undefined, userId: viewer.profile.id });
    else if (body.action === "create_submission") await createSellerSubmission(getSubmissionPayload(body.payload), viewer.profile.id);
    else if (body.action === "send_chat_message") await sendChatMessage({ content: body.payload.content as string | undefined, messageType: body.payload.messageType as "image" | "text" | "voice", senderId: viewer.profile.id, threadId: body.payload.threadId as string, voiceDuration: body.payload.voiceDuration as number | undefined });
    else if (body.action === "update_profile") await updateProfile(viewer.profile.id, { city: body.payload.city as string, fullName: body.payload.fullName as string, phone: body.payload.phone as string, preferredLocale: body.payload.preferredLocale as "en" | "hi" });
    else return NextResponse.json({ error: `Unsupported action ${body.action}` }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const viewer = await getViewerContext();
  if (!viewer) return forbidden("You must be logged in.");
  const body = (await request.json()) as { action: string; payload: Record<string, unknown> };

  try {
    if (body.action === "close_chat_thread") {
      if (!viewer.permissions.canViewAllChats) return forbidden("Only staff can close chat threads.");
      await (isSupabaseConfigured() ? closeChatThread(body.payload.threadId as string, viewer.profile.id) : markDemoThreadClosed(body.payload.threadId as string));
    } else if (body.action === "create_listing_from_submission") {
      if (!viewer.permissions.canManageVehicles) return forbidden("Only staff can create listings from submissions.");
      if (isSupabaseConfigured()) await createListingFromSellerSubmission(body.payload.submissionId as string, viewer.profile.id);
      else return NextResponse.json({ error: "Seller submissions require Supabase inventory in this mode." }, { status: 400 });
    } else if (body.action === "delete_submission") {
      await (isSupabaseConfigured()
        ? deleteSellerSubmission(viewer.profile.id, viewer.permissions.canManageVehicles, body.payload.submissionId as string)
        : deleteDemoSellerSubmission({ actorId: viewer.profile.id, canManageVehicles: viewer.permissions.canManageVehicles, submissionId: body.payload.submissionId as string }));
    } else if (body.action === "edit_submission") {
      await (isSupabaseConfigured()
        ? editSupabaseSellerSubmission({ actorId: viewer.profile.id, canManageVehicles: viewer.permissions.canManageVehicles, data: getSubmissionPayload(body.payload), submissionId: body.payload.submissionId as string })
        : editDemoSellerSubmission({ actorId: viewer.profile.id, canManageVehicles: viewer.permissions.canManageVehicles, data: getSubmissionPayload(body.payload), submissionId: body.payload.submissionId as string }));
    } else if (body.action === "update_inquiry") {
      if (!viewer.permissions.canViewAllInquiries) return forbidden("Only staff can update inquiries.");
      await (isSupabaseConfigured() ? updateInquiryStatus(body.payload.inquiryId as string, body.payload.status as "contacted" | "closed", viewer.profile.id) : updateDemoInquiryStatus(body.payload.inquiryId as string, body.payload.status as "contacted" | "closed"));
    } else if (body.action === "update_resale") {
      if (!viewer.permissions.canManageVehicles) return forbidden("Only staff can update resale requests.");
      await (isSupabaseConfigured() ? updateResaleStatus(body.payload.resaleId as string, body.payload.status as "approved" | "rejected" | "relisted", viewer.profile.id) : updateDemoResale(body.payload.resaleId as string, body.payload.status as "approved" | "rejected" | "relisted"));
    } else if (body.action === "update_reservation") {
      if (!viewer.permissions.canManageReservations) return forbidden("Only staff can update reservations.");
      await (isSupabaseConfigured() ? updateReservationStatus(body.payload.reservationId as string, body.payload.status as "approved" | "rejected", viewer.profile.id) : updateDemoReservation(body.payload.reservationId as string, body.payload.status as "approved" | "rejected"));
    } else if (body.action === "update_settings") {
      if (!viewer.permissions.canManageUsers) return forbidden("Only admins can update settings.");
      await (isSupabaseConfigured() ? updateSettings(body.payload as never, viewer.profile.id) : updateDemoSettings(body.payload as never));
    } else if (body.action === "update_submission") {
      if (!viewer.permissions.canManageVehicles) return forbidden("Only staff can update seller submissions.");
      await (isSupabaseConfigured()
        ? updateSellerSubmissionStatus(body.payload.submissionId as string, body.payload.status as "changes_requested" | "pending" | "rejected" | "reviewed", viewer.profile.id)
        : updateDemoSellerSubmissionStatus(body.payload.submissionId as string, body.payload.status as "changes_requested" | "pending" | "rejected" | "reviewed"));
    } else if (body.action === "update_user") {
      if (!viewer.permissions.canManageUsers) return forbidden("Only admins can update users.");
      await (isSupabaseConfigured() ? updateUserAccess(viewer.profile.id, viewer.user.email, { approvalStatus: body.payload.approvalStatus as never, canViewFinancials: Boolean(body.payload.canViewFinancials), role: body.payload.role as never, userId: body.payload.userId as string }) : updateDemoUser({ actorEmail: viewer.user.email ?? viewer.profile.id, approvalStatus: body.payload.approvalStatus as never, canViewFinancials: Boolean(body.payload.canViewFinancials), role: body.payload.role as never, userId: body.payload.userId as string }));
    } else if (body.action === "update_waitlist") {
      if (!viewer.permissions.canManageReservations) return forbidden("Only staff can update waitlist entries.");
      await (isSupabaseConfigured() ? updateWaitlistStatus(body.payload.waitlistId as string, body.payload.status as "promoted" | "removed", viewer.profile.id) : updateDemoWaitlist(body.payload.waitlistId as string, body.payload.status as "promoted" | "removed"));
    } else {
      return NextResponse.json({ error: `Unsupported action ${body.action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed." }, { status: 400 });
  }
}
