import { ApprovalStatus, UserRole } from "@/lib/supabase/permissions";

export type ListingStatus = "draft" | "published" | "reserved" | "sold" | "archived";
export type InquiryStatus = "open" | "contacted" | "closed";
export type ReservationStatus = "pending" | "approved" | "rejected";
export type WaitlistStatus = "active" | "promoted" | "removed";
export type ResaleStatus = "pending" | "approved" | "rejected" | "relisted";
export type ChatThreadStatus = "open" | "closed";
export type ChatThreadType = "support" | "vehicle";
export type ChatMessageType = "text" | "voice" | "image";
export type PortalLocale = "en" | "hi";
export type SellerSubmissionStatus = "pending" | "reviewed" | "changes_requested" | "rejected";

export interface DemoUserAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  canViewFinancials: boolean;
  preferredLocale: PortalLocale;
  createdAt: string;
}

export interface VehicleMediaRecord {
  id: string;
  storagePath: string;
  mediaType: "image";
  isBlurred: boolean;
  displayOrder: number;
}

export interface VehicleRecord {
  listingId: string;
  vehicleId: string;
  stockId: string;
  status: ListingStatus;
  make: string;
  model: string;
  year: number;
  variant?: string;
  color?: string;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  registrationYear?: number;
  location?: string;
  vin?: string;
  highlights?: string;
  conditionNotes?: string;
  procurementPrice?: number;
  targetSellingPrice?: number;
  extraSpend?: number;
  maintenanceCost?: number;
  documentationCost?: number;
  transportCost?: number;
  otherCost?: number;
  internalNotes?: string;
  publishedAt?: string;
  soldAt?: string;
  updatedAt: string;
  media: VehicleMediaRecord[];
}

export interface InquiryRecord {
  id: string;
  listingId: string;
  userId: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  preferredContactMethod?: "phone" | "chat" | "email";
  preferredContactTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationRecord {
  id: string;
  listingId: string;
  userId: string;
  status: ReservationStatus;
  message?: string;
  preferredInspectionDate?: string;
  createdAt: string;
  updatedAt: string;
  priority: "high" | "normal";
}

export interface WaitlistRecord {
  id: string;
  listingId: string;
  userId: string;
  status: WaitlistStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResaleRecord {
  id: string;
  listingId: string;
  userId: string;
  status: ResaleStatus;
  expectedTimeline: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerSubmissionMediaInput {
  displayOrder: number;
  storagePath: string;
}

export interface SellerSubmissionInput {
  askingPrice?: number;
  description: string;
  email?: string;
  location?: string;
  make: string;
  media?: SellerSubmissionMediaInput[];
  mileage?: number;
  model: string;
  phone: string;
  sellerName: string;
  variant?: string;
  year: number;
}

export interface SellerSubmissionRecord {
  askingPrice?: number;
  id: string;
  linkedListingId?: string;
  location?: string;
  make: string;
  media: VehicleMediaRecord[];
  mileage?: number;
  model: string;
  sellerName: string;
  phone: string;
  email?: string;
  updatedAt: string;
  userId: string;
  variant?: string;
  vehicleSummary: string;
  description: string;
  status: SellerSubmissionStatus;
  submittedAt: string;
  year: number;
}

export interface ChatThreadRecord {
  id: string;
  userId: string;
  threadType: ChatThreadType;
  status: ChatThreadStatus;
  title: string;
  listingId?: string;
  updatedAt: string;
  unreadCount: number;
  assignedTo?: string;
}

export interface ChatMessageRecord {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  messageType: ChatMessageType;
  content?: string;
  voiceDuration?: number;
  imageUrl?: string;
  createdAt: string;
}

export interface DemoPortalSettings {
  defaultLocale: PortalLocale;
  managerFinancialAccess: boolean;
  notifications: {
    inquiries: boolean;
    reservations: boolean;
    sellerSubmissions: boolean;
    resaleRequests: boolean;
    chats: boolean;
  };
}

export interface DemoPortalActivityRecord {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface DemoPortalState {
  users: DemoUserAccount[];
  inquiries: InquiryRecord[];
  reservations: ReservationRecord[];
  waitlist: WaitlistRecord[];
  resales: ResaleRecord[];
  submissions: SellerSubmissionRecord[];
  threads: ChatThreadRecord[];
  messages: ChatMessageRecord[];
  activities: DemoPortalActivityRecord[];
  settings: DemoPortalSettings;
}
