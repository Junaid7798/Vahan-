import { SellerSubmissionInput, SellerSubmissionRecord, VehicleMediaRecord } from "@/lib/demo/portal-types";

interface LegacySellerSubmissionRecord {
  description: string;
  email?: string;
  id: string;
  linkedListingId?: string;
  media?: VehicleMediaRecord[];
  phone: string;
  sellerName: string;
  status: SellerSubmissionRecord["status"];
  submittedAt: string;
  updatedAt?: string;
  userId?: string;
  vehicleSummary?: string;
  make?: string;
  model?: string;
  variant?: string;
  year?: number;
  location?: string;
  mileage?: number;
  askingPrice?: number;
}

const EDITABLE_SUBMISSION_STATUSES: SellerSubmissionRecord["status"][] = ["pending", "changes_requested"];

export function buildSubmissionSummary(input: { make: string; model: string; variant?: string; year: number }) {
  return [input.year.toString(), input.make.trim(), input.model.trim(), input.variant?.trim()].filter(Boolean).join(" ");
}

export function createSubmissionMedia(items: SellerSubmissionInput["media"], fallbackId: string): VehicleMediaRecord[] {
  return (items ?? []).map((item, index) => ({
    id: `submission-media-${fallbackId}-${index + 1}`,
    storagePath: item.storagePath,
    mediaType: "image",
    isBlurred: false,
    displayOrder: item.displayOrder,
  }));
}

export function canUserEditSubmission(submission: SellerSubmissionRecord, userId: string) {
  return submission.userId === userId && !submission.linkedListingId && EDITABLE_SUBMISSION_STATUSES.includes(submission.status);
}

export function normalizeSellerSubmission(raw: LegacySellerSubmissionRecord): SellerSubmissionRecord {
  const summary = raw.vehicleSummary?.trim();
  const [yearToken, makeToken = "Vehicle", modelToken = "Submission", ...variantTokens] = summary?.split(/\s+/) ?? [];
  const parsedYear = Number(yearToken);
  const year = raw.year ?? (Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : new Date().getFullYear());
  const make = raw.make ?? makeToken;
  const model = raw.model ?? modelToken;
  const parsedVariant = variantTokens.join(" ").trim();
  const variant = raw.variant ?? (parsedVariant || undefined);

  return {
    id: raw.id,
    userId: raw.userId ?? raw.email ?? raw.id,
    sellerName: raw.sellerName,
    phone: raw.phone,
    email: raw.email,
    make,
    model,
    year,
    variant,
    location: raw.location,
    mileage: raw.mileage,
    askingPrice: raw.askingPrice,
    vehicleSummary: buildSubmissionSummary({ year, make, model, variant }),
    description: raw.description,
    status: raw.status,
    submittedAt: raw.submittedAt,
    updatedAt: raw.updatedAt ?? raw.submittedAt,
    linkedListingId: raw.linkedListingId,
    media: raw.media ?? [],
  };
}
