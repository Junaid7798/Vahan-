import { NextRequest, NextResponse } from "next/server";
import { getViewerContext } from "@/lib/auth/viewer";
import { createOrGetDemoThread, markDemoThreadClosed, sendDemoChatMessage } from "@/lib/demo/portal-chat";
import {
  createListingFromSubmission,
  createDemoInquiry,
  createDemoResaleRequest,
  createDemoReservationIntent,
  createDemoSellerSubmission,
  deleteDemoSellerSubmission,
  editDemoSellerSubmission,
  updateDemoInquiryStatus,
  updateDemoReservation,
  updateDemoResale,
  updateDemoSellerSubmissionStatus,
  updateDemoWaitlist,
} from "@/lib/demo/portal-workflows";
import { updateDemoProfile, updateDemoSettings, updateDemoUser } from "@/lib/demo/portal-users";

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
  if (!viewer) {
    return forbidden("You must be logged in.");
  }

  const body = await request.json();

  try {
    switch (body.action) {
      case "create_chat_thread": {
        await createOrGetDemoThread({
          listingId: body.payload.listingId,
          threadType: body.payload.threadType,
          title: body.payload.title,
          userId: viewer.profile.id,
        });
        return NextResponse.json({ success: true });
      }
      case "create_inquiry": {
        await createDemoInquiry({
          listingId: body.payload.listingId,
          message: body.payload.message,
          preferredContactMethod: body.payload.preferredContactMethod,
          preferredContactTime: body.payload.preferredContactTime,
          subject: body.payload.subject,
          userId: viewer.profile.id,
        });
        return NextResponse.json({ success: true });
      }
      case "create_resale": {
        await createDemoResaleRequest({
          expectedTimeline: body.payload.expectedTimeline,
          listingId: body.payload.listingId,
          userId: viewer.profile.id,
        });
        return NextResponse.json({ success: true });
      }
      case "create_reservation": {
        await createDemoReservationIntent({
          listingId: body.payload.listingId,
          message: body.payload.message,
          preferredInspectionDate: body.payload.preferredInspectionDate,
          userId: viewer.profile.id,
        });
        return NextResponse.json({ success: true });
      }
      case "create_submission": {
        await createDemoSellerSubmission({
          ...getSubmissionPayload(body.payload),
          userId: viewer.profile.id,
        });
        return NextResponse.json({ success: true });
      }
      case "send_chat_message": {
        await sendDemoChatMessage({
          content: body.payload.content,
          messageType: body.payload.messageType,
          senderId: viewer.profile.id,
          senderName: viewer.profile.full_name ?? viewer.user.email ?? "User",
          threadId: body.payload.threadId,
          voiceDuration: body.payload.voiceDuration,
        });
        return NextResponse.json({ success: true });
      }
      case "update_profile": {
        await updateDemoProfile({
          city: body.payload.city,
          email: viewer.user.email ?? viewer.profile.id,
          fullName: body.payload.fullName,
          phone: body.payload.phone,
          preferredLocale: body.payload.preferredLocale,
        });
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: `Unsupported action ${body.action}` }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const viewer = await getViewerContext();
  if (!viewer) {
    return forbidden("You must be logged in.");
  }

  const body = await request.json();

  try {
    switch (body.action) {
      case "close_chat_thread": {
        if (!viewer.permissions.canViewAllChats) {
          return forbidden("Only staff can close chat threads.");
        }
        await markDemoThreadClosed(body.payload.threadId);
        return NextResponse.json({ success: true });
      }
      case "create_listing_from_submission": {
        if (!viewer.permissions.canManageVehicles) {
          return forbidden("Only staff can create listings from submissions.");
        }
        await createListingFromSubmission(body.payload.submissionId);
        return NextResponse.json({ success: true });
      }
      case "delete_submission": {
        await deleteDemoSellerSubmission({
          actorId: viewer.profile.id,
          canManageVehicles: viewer.permissions.canManageVehicles,
          submissionId: body.payload.submissionId,
        });
        return NextResponse.json({ success: true });
      }
      case "edit_submission": {
        await editDemoSellerSubmission({
          actorId: viewer.profile.id,
          canManageVehicles: viewer.permissions.canManageVehicles,
          data: getSubmissionPayload(body.payload),
          submissionId: body.payload.submissionId,
        });
        return NextResponse.json({ success: true });
      }
      case "update_inquiry": {
        if (!viewer.permissions.canViewAllInquiries) {
          return forbidden("Only staff can update inquiries.");
        }
        await updateDemoInquiryStatus(body.payload.inquiryId, body.payload.status);
        return NextResponse.json({ success: true });
      }
      case "update_resale": {
        if (!viewer.permissions.canManageVehicles) {
          return forbidden("Only staff can update resale requests.");
        }
        await updateDemoResale(body.payload.resaleId, body.payload.status);
        return NextResponse.json({ success: true });
      }
      case "update_reservation": {
        if (!viewer.permissions.canManageReservations) {
          return forbidden("Only staff can update reservations.");
        }
        await updateDemoReservation(body.payload.reservationId, body.payload.status);
        return NextResponse.json({ success: true });
      }
      case "update_settings": {
        if (!viewer.permissions.canManageUsers) {
          return forbidden("Only admins can update settings.");
        }
        await updateDemoSettings(body.payload);
        return NextResponse.json({ success: true });
      }
      case "update_submission": {
        if (!viewer.permissions.canManageVehicles) {
          return forbidden("Only staff can update seller submissions.");
        }
        await updateDemoSellerSubmissionStatus(body.payload.submissionId, body.payload.status);
        return NextResponse.json({ success: true });
      }
      case "update_user": {
        if (!viewer.permissions.canManageUsers) {
          return forbidden("Only admins can update users.");
        }
        await updateDemoUser({
          actorEmail: viewer.user.email ?? viewer.profile.id,
          approvalStatus: body.payload.approvalStatus,
          canViewFinancials: body.payload.canViewFinancials,
          role: body.payload.role,
          userId: body.payload.userId,
        });
        return NextResponse.json({ success: true });
      }
      case "update_waitlist": {
        if (!viewer.permissions.canManageReservations) {
          return forbidden("Only staff can update waitlist entries.");
        }
        await updateDemoWaitlist(body.payload.waitlistId, body.payload.status);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: `Unsupported action ${body.action}` }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed." }, { status: 400 });
  }
}
