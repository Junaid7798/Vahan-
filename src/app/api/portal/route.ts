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
import { addActivity } from "@/lib/demo/portal-utils";
import { readPortalStore, updatePortalStore } from "@/lib/demo/portal-store";
import { createInquiry, updateInquiryStatus } from "@/lib/supabase/portal-inquiries";
import { closeChatThread, createOrGetChatThread, sendChatMessage } from "@/lib/supabase/portal-chat";
import { createResale, updateResaleStatus } from "@/lib/supabase/portal-resales";
import { createReservation, updateReservationStatus, updateWaitlistStatus } from "@/lib/supabase/portal-reservations";
import { updateProfile, updateSettings, updateUserAccess } from "@/lib/supabase/portal-users";
import { createVehicle } from "@/lib/supabase/portal-vehicles";

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
    media: Array.isArray(payload.media) ? payload.media.filter((item) => item && typeof item === "object") as Array<{ displayOrder: number; storagePath: string }> : [],
    mileage: typeof payload.mileage === "number" ? payload.mileage : undefined,
    model: typeof payload.model === "string" ? payload.model : "",
    phone: typeof payload.phone === "string" ? payload.phone : "",
    sellerName: typeof payload.sellerName === "string" ? payload.sellerName : "",
    variant: typeof payload.variant === "string" ? payload.variant : undefined,
    year: typeof payload.year === "number" ? payload.year : 0,
  };
}

async function createListingFromSubmission(submissionId: string, actorId: string) {
  const state = await readPortalStore();
  const submission = state.submissions.find((item) => item.id === submissionId);
  if (!submission) {
    throw new Error("Seller submission not found.");
  }

  if (submission.linkedListingId) {
    return submission.linkedListingId;
  }

  const listingId = await createVehicle(
    {
      make: submission.make,
      model: submission.model,
      year: submission.year,
      variant: submission.variant,
      location: submission.location,
      mileage: submission.mileage,
      highlights: submission.description,
      status: "draft",
      targetSellingPrice: submission.askingPrice,
      media: submission.media.map((item) => ({ displayOrder: item.displayOrder, storagePath: item.storagePath })),
    },
    actorId
  );

  await updatePortalStore((current) => ({
    ...current,
    submissions: current.submissions.map((item) =>
      item.id === submissionId ? { ...item, linkedListingId: listingId, status: "reviewed", updatedAt: new Date().toISOString() } : item
    ),
    activities: addActivity(current, "Seller submission linked", `${submission.vehicleSummary} now has a Supabase listing.`),
  }));

  return listingId;
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
    else if (body.action === "create_submission") await createDemoSellerSubmission({ ...getSubmissionPayload(body.payload), userId: viewer.profile.id });
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
      if (isSupabaseConfigured()) await createListingFromSubmission(body.payload.submissionId as string, viewer.profile.id);
      else return NextResponse.json({ error: "Seller submissions require Supabase inventory in this mode." }, { status: 400 });
    } else if (body.action === "delete_submission") {
      await deleteDemoSellerSubmission({ actorId: viewer.profile.id, canManageVehicles: viewer.permissions.canManageVehicles, submissionId: body.payload.submissionId as string });
    } else if (body.action === "edit_submission") {
      await editDemoSellerSubmission({ actorId: viewer.profile.id, canManageVehicles: viewer.permissions.canManageVehicles, data: getSubmissionPayload(body.payload), submissionId: body.payload.submissionId as string });
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
      await updateDemoSellerSubmissionStatus(body.payload.submissionId as string, body.payload.status as "changes_requested" | "pending" | "rejected" | "reviewed");
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
