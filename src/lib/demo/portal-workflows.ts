import { readVehicleStore, writeVehicleStore } from "@/lib/demo/vehicle-store";
import { updatePortalStore } from "@/lib/demo/portal-store";
import { createPortalId, addActivity, nowIso, reorderWaitlistPositions } from "@/lib/demo/portal-utils";
import { canUserEditSubmission, buildSubmissionSummary, createSubmissionMedia } from "@/lib/demo/submission-utils";
import { InquiryRecord, ReservationRecord, ResaleRecord, SellerSubmissionInput, SellerSubmissionRecord, VehicleRecord, WaitlistRecord } from "@/lib/demo/portal-types";

function findListing(records: VehicleRecord[], listingId: string) {
  return records.find((record) => record.listingId === listingId) ?? null;
}

function createListingSummary(record: VehicleRecord) {
  return `${record.year} ${record.make} ${record.model}`;
}

function getNextStockId(records: VehicleRecord[]) {
  const highest = records.reduce((max, record) => {
    const numeric = Number(record.stockId.replace(/\D/g, ""));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 300);

  return `VH-${highest + 1}`;
}

function findSubmission(records: SellerSubmissionRecord[], submissionId: string) {
  return records.find((record) => record.id === submissionId) ?? null;
}

function ensureSubmissionWriteAccess(input: {
  actorId: string;
  canManageVehicles: boolean;
  submission: SellerSubmissionRecord;
}) {
  if (input.canManageVehicles) return;
  if (!canUserEditSubmission(input.submission, input.actorId)) {
    throw new Error("You can only edit your own pending uploads.");
  }
}

function validateSubmissionInput(input: SellerSubmissionInput) {
  if (!input.sellerName.trim() || !input.phone.trim() || !input.make.trim() || !input.model.trim() || !input.description.trim()) {
    throw new Error("Seller details, vehicle details, and description are required.");
  }

  if (!Number.isInteger(input.year) || input.year < 1990 || input.year > new Date().getFullYear() + 1) {
    throw new Error("A valid vehicle year is required.");
  }
}

export async function createDemoInquiry(input: {
  listingId: string;
  message: string;
  preferredContactMethod?: "phone" | "chat" | "email";
  preferredContactTime?: string;
  subject: string;
  userId: string;
}) {
  return updatePortalStore((state) => {
    const inquiry: InquiryRecord = {
      id: createPortalId("inq"),
      listingId: input.listingId,
      userId: input.userId,
      subject: input.subject,
      message: input.message,
      status: "open",
      preferredContactMethod: input.preferredContactMethod,
      preferredContactTime: input.preferredContactTime,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    return {
      ...state,
      inquiries: [inquiry, ...state.inquiries],
      activities: addActivity(state, "Inquiry created", `${input.userId} opened a new inquiry.`),
    };
  });
}

export async function updateDemoInquiryStatus(inquiryId: string, status: InquiryRecord["status"]) {
  return updatePortalStore((state) => {
    const inquiry = state.inquiries.find((item) => item.id === inquiryId);
    if (!inquiry) throw new Error("Inquiry not found.");

    inquiry.status = status;
    inquiry.updatedAt = nowIso();

    return {
      ...state,
      inquiries: [...state.inquiries],
      activities: addActivity(state, "Inquiry updated", `${inquiry.subject} is now ${status}.`),
    };
  });
}

export async function createDemoReservationIntent(input: {
  listingId: string;
  message?: string;
  preferredInspectionDate?: string;
  userId: string;
}) {
  const listings = await readVehicleStore();
  const record = findListing(listings, input.listingId);
  if (!record) throw new Error("Listing not found.");

  return updatePortalStore((state) => {
    if (record.status === "reserved") {
      const waitlistEntry: WaitlistRecord = {
        id: createPortalId("wait"),
        listingId: input.listingId,
        userId: input.userId,
        status: "active",
        position: state.waitlist.filter((item) => item.listingId === input.listingId && item.status === "active").length + 1,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      return {
        ...state,
        waitlist: [...state.waitlist, waitlistEntry],
        activities: addActivity(state, "Waitlist joined", `${input.userId} joined the waitlist for ${createListingSummary(record)}.`),
      };
    }

    const reservation: ReservationRecord = {
      id: createPortalId("res"),
      listingId: input.listingId,
      userId: input.userId,
      status: "pending",
      message: input.message,
      preferredInspectionDate: input.preferredInspectionDate,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      priority: "normal",
    };

    return {
      ...state,
      reservations: [reservation, ...state.reservations],
      activities: addActivity(state, "Reservation requested", `${input.userId} requested reserve interest on ${createListingSummary(record)}.`),
    };
  });
}

export async function updateDemoReservation(reservationId: string, status: ReservationRecord["status"]) {
  const listings = await readVehicleStore();

  return updatePortalStore(async (state) => {
    const reservation = state.reservations.find((item) => item.id === reservationId);
    if (!reservation) throw new Error("Reservation not found.");

    reservation.status = status;
    reservation.updatedAt = nowIso();

    const listing = findListing(listings, reservation.listingId);
    if (listing && status === "approved") {
      listing.status = "reserved";
      listing.updatedAt = nowIso();
      await writeVehicleStore([...listings]);
    }

    return {
      ...state,
      reservations: [...state.reservations],
      activities: addActivity(state, "Reservation updated", `${reservation.id} is now ${status}.`),
    };
  });
}

export async function updateDemoWaitlist(waitlistId: string, status: WaitlistRecord["status"]) {
  return updatePortalStore((state) => {
    const entry = state.waitlist.find((item) => item.id === waitlistId);
    if (!entry) throw new Error("Waitlist entry not found.");

    entry.status = status;
    entry.updatedAt = nowIso();
    reorderWaitlistPositions(state, entry.listingId);

    return {
      ...state,
      waitlist: [...state.waitlist],
      activities: addActivity(state, "Waitlist updated", `${entry.id} is now ${status}.`),
    };
  });
}

export async function createDemoResaleRequest(input: { expectedTimeline: string; listingId: string; userId: string }) {
  return updatePortalStore((state) => {
    const resale: ResaleRecord = {
      id: createPortalId("resale"),
      listingId: input.listingId,
      userId: input.userId,
      status: "pending",
      expectedTimeline: input.expectedTimeline,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    return {
      ...state,
      resales: [resale, ...state.resales],
      activities: addActivity(state, "Resale requested", `${input.userId} requested a relisting.`),
    };
  });
}

export async function updateDemoResale(resaleId: string, status: ResaleRecord["status"]) {
  const listings = await readVehicleStore();

  return updatePortalStore(async (state) => {
    const resale = state.resales.find((item) => item.id === resaleId);
    if (!resale) throw new Error("Resale request not found.");

    resale.status = status;
    resale.updatedAt = nowIso();

    if (status === "relisted") {
      const record = findListing(listings, resale.listingId);
      if (record) {
        const relistingId = createPortalId("listing");
        listings.unshift({
          ...record,
          listingId: relistingId,
          stockId: `${record.stockId}-R`,
          status: "draft",
          soldAt: undefined,
          publishedAt: undefined,
          updatedAt: nowIso(),
        });
        await writeVehicleStore([...listings]);
      }
    }

    return {
      ...state,
      resales: [...state.resales],
      activities: addActivity(state, "Resale updated", `${resale.id} is now ${status}.`),
    };
  });
}

export async function createDemoSellerSubmission(input: SellerSubmissionInput & { userId: string }) {
  return updatePortalStore((state) => {
    validateSubmissionInput(input);
    const timestamp = nowIso();
    const vehicleSummary = buildSubmissionSummary(input);
    const submission: SellerSubmissionRecord = {
      id: createPortalId("seller"),
      userId: input.userId,
      sellerName: input.sellerName,
      phone: input.phone,
      email: input.email,
      make: input.make,
      model: input.model,
      year: input.year,
      variant: input.variant,
      location: input.location,
      mileage: input.mileage,
      askingPrice: input.askingPrice,
      vehicleSummary,
      description: input.description,
      status: "pending",
      submittedAt: timestamp,
      updatedAt: timestamp,
      media: createSubmissionMedia(input.media, crypto.randomUUID().slice(0, 8)),
    };

    return {
      ...state,
      submissions: [submission, ...state.submissions],
      activities: addActivity(state, "Seller submission received", `${vehicleSummary} is ready for review.`),
    };
  });
}

export async function editDemoSellerSubmission(input: {
  actorId: string;
  canManageVehicles: boolean;
  data: SellerSubmissionInput;
  submissionId: string;
}) {
  return updatePortalStore((state) => {
    validateSubmissionInput(input.data);
    const submission = findSubmission(state.submissions, input.submissionId);
    if (!submission) throw new Error("Seller submission not found.");
    ensureSubmissionWriteAccess({ actorId: input.actorId, canManageVehicles: input.canManageVehicles, submission });

    submission.sellerName = input.data.sellerName;
    submission.phone = input.data.phone;
    submission.email = input.data.email;
    submission.make = input.data.make;
    submission.model = input.data.model;
    submission.year = input.data.year;
    submission.variant = input.data.variant;
    submission.location = input.data.location;
    submission.mileage = input.data.mileage;
    submission.askingPrice = input.data.askingPrice;
    submission.vehicleSummary = buildSubmissionSummary(input.data);
    submission.description = input.data.description;
    submission.media = createSubmissionMedia(input.data.media, submission.id);
    submission.updatedAt = nowIso();

    if (!input.canManageVehicles) {
      submission.status = "pending";
    }

    return {
      ...state,
      submissions: [...state.submissions],
      activities: addActivity(state, "Seller submission updated", `${submission.vehicleSummary} was updated.`),
    };
  });
}

export async function updateDemoSellerSubmissionStatus(submissionId: string, status: SellerSubmissionRecord["status"]) {
  return updatePortalStore((state) => {
    const submission = findSubmission(state.submissions, submissionId);
    if (!submission) throw new Error("Seller submission not found.");

    submission.status = status;
    submission.updatedAt = nowIso();

    return {
      ...state,
      submissions: [...state.submissions],
      activities: addActivity(state, "Seller submission updated", `${submission.vehicleSummary} is now ${status}.`),
    };
  });
}

export async function deleteDemoSellerSubmission(input: { actorId: string; canManageVehicles: boolean; submissionId: string }) {
  return updatePortalStore((state) => {
    const submission = findSubmission(state.submissions, input.submissionId);
    if (!submission) throw new Error("Seller submission not found.");
    ensureSubmissionWriteAccess({ actorId: input.actorId, canManageVehicles: input.canManageVehicles, submission });

    return {
      ...state,
      submissions: state.submissions.filter((item) => item.id !== input.submissionId),
      activities: addActivity(state, "Seller submission deleted", `${submission.vehicleSummary} was removed.`),
    };
  });
}

export async function createListingFromSubmission(submissionId: string) {
  const listings = await readVehicleStore();

  return updatePortalStore(async (state) => {
    const submission = findSubmission(state.submissions, submissionId);
    if (!submission) throw new Error("Seller submission not found.");
    if (submission.linkedListingId) throw new Error("A listing has already been created from this submission.");

    const timestamp = nowIso();
    const token = crypto.randomUUID().slice(0, 8);
    const listingId = `listing-${token}`;

    listings.unshift({
      listingId,
      vehicleId: `vehicle-${token}`,
      stockId: getNextStockId(listings),
      make: submission.make,
      model: submission.model,
      year: submission.year,
      variant: submission.variant,
      location: submission.location,
      mileage: submission.mileage,
      highlights: submission.vehicleSummary,
      conditionNotes: submission.description,
      targetSellingPrice: submission.askingPrice,
      status: "draft",
      updatedAt: timestamp,
      media: submission.media.length
        ? submission.media.map((item, index) => ({
            ...item,
            id: `media-${token}-${index + 1}`,
            displayOrder: index + 1,
          }))
        : [{ id: `media-${token}`, storagePath: "/placeholder-car.svg", mediaType: "image", isBlurred: false, displayOrder: 1 }],
    });

    submission.status = "reviewed";
    submission.updatedAt = timestamp;
    submission.linkedListingId = listingId;
    await writeVehicleStore(listings);

    return {
      ...state,
      submissions: [...state.submissions],
      activities: addActivity(state, "Listing created from submission", `${submission.vehicleSummary} was converted into draft inventory.`),
    };
  });
}
