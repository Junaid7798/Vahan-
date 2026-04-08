import {
  ChatMessageRecord,
  ChatThreadRecord,
  DemoUserAccount,
  InquiryRecord,
  ResaleRecord,
  ReservationRecord,
  SellerSubmissionRecord,
  WaitlistRecord,
} from "@/lib/demo/portal-types";

export const demoUsers: DemoUserAccount[] = [
  { id: "admin-demo@example.com", fullName: "Aarav Admin", email: "admin-demo@example.com", phone: "9876500001", city: "Mumbai", role: "admin", approvalStatus: "approved", canViewFinancials: true, preferredLocale: "en", createdAt: "2026-04-01T09:00:00.000Z" },
  { id: "manager-demo@example.com", fullName: "Meera Manager", email: "manager-demo@example.com", phone: "9876500002", city: "Delhi", role: "manager", approvalStatus: "approved", canViewFinancials: true, preferredLocale: "en", createdAt: "2026-04-02T09:00:00.000Z" },
  { id: "demo@example.com", fullName: "Dev User", email: "demo@example.com", phone: "9876500003", city: "Pune", role: "user", approvalStatus: "approved", canViewFinancials: false, preferredLocale: "en", createdAt: "2026-04-03T09:00:00.000Z" },
  { id: "review-demo@example.com", fullName: "Priya Pending", email: "review-demo@example.com", phone: "9876500004", city: "Jaipur", role: "user", approvalStatus: "pending_approval", canViewFinancials: false, preferredLocale: "hi", createdAt: "2026-04-05T09:00:00.000Z" },
  { id: "blocked-demo@example.com", fullName: "Rajat Rejected", email: "blocked-demo@example.com", phone: "9876500005", city: "Indore", role: "user", approvalStatus: "rejected", canViewFinancials: false, preferredLocale: "en", createdAt: "2026-04-05T11:00:00.000Z" },
  { id: "paused-demo@example.com", fullName: "Naina Disabled", email: "paused-demo@example.com", phone: "9876500006", city: "Lucknow", role: "user", approvalStatus: "disabled", canViewFinancials: false, preferredLocale: "en", createdAt: "2026-04-05T12:00:00.000Z" },
];

export const demoInquiries: InquiryRecord[] = [
  { id: "inq-001", listingId: "listing-swift", userId: "demo@example.com", subject: "Service history", message: "Please share service records and tyre condition.", status: "open", createdAt: "2026-04-07T05:30:00.000Z", updatedAt: "2026-04-07T10:00:00.000Z" },
  { id: "inq-002", listingId: "listing-creta", userId: "demo@example.com", subject: "Ownership details", message: "How many previous owners has this vehicle had?", status: "contacted", createdAt: "2026-04-06T08:00:00.000Z", updatedAt: "2026-04-06T12:15:00.000Z" },
  { id: "inq-003", listingId: "listing-baleno", userId: "manager-demo@example.com", subject: "Pricing review", message: "Need internal review for pricing before publishing.", status: "open", createdAt: "2026-04-08T08:45:00.000Z", updatedAt: "2026-04-08T08:45:00.000Z" },
];

export const demoReservations: ReservationRecord[] = [
  { id: "res-001", listingId: "listing-swift", userId: "demo@example.com", status: "pending", createdAt: "2026-04-07T09:30:00.000Z", updatedAt: "2026-04-07T09:30:00.000Z", priority: "high" },
  { id: "res-002", listingId: "listing-city", userId: "demo@example.com", status: "approved", createdAt: "2026-04-05T13:00:00.000Z", updatedAt: "2026-04-05T13:00:00.000Z", priority: "normal" },
];

export const demoWaitlist: WaitlistRecord[] = [
  { id: "wait-001", listingId: "listing-creta", userId: "demo@example.com", status: "active", position: 1, createdAt: "2026-04-06T11:00:00.000Z", updatedAt: "2026-04-06T11:00:00.000Z" },
  { id: "wait-002", listingId: "listing-creta", userId: "manager-demo@example.com", status: "active", position: 2, createdAt: "2026-04-07T14:30:00.000Z", updatedAt: "2026-04-07T14:30:00.000Z" },
];

export const demoResales: ResaleRecord[] = [
  { id: "re-001", listingId: "listing-i20", userId: "demo@example.com", status: "pending", expectedTimeline: "within_1_month", createdAt: "2026-04-07T15:00:00.000Z", updatedAt: "2026-04-07T15:00:00.000Z" },
  { id: "re-002", listingId: "listing-jazz", userId: "demo@example.com", status: "approved", expectedTimeline: "flexible", createdAt: "2026-04-04T10:30:00.000Z", updatedAt: "2026-04-04T10:30:00.000Z" },
];

export const demoSellerSubmissions: SellerSubmissionRecord[] = [
  {
    id: "seller-001",
    userId: "demo@example.com",
    sellerName: "Dev User",
    phone: "9876500003",
    email: "demo@example.com",
    make: "Hyundai",
    model: "Venue",
    year: 2019,
    variant: "SX",
    location: "Pune",
    mileage: 42000,
    askingPrice: 725000,
    vehicleSummary: "2019 Hyundai Venue SX",
    description: "Single owner, 42,000 km, insurance active till Dec 2026.",
    status: "changes_requested",
    submittedAt: "2026-04-08T07:30:00.000Z",
    updatedAt: "2026-04-08T11:00:00.000Z",
    media: [],
  },
  {
    id: "seller-002",
    userId: "seller-002",
    sellerName: "Sneha Kapoor",
    phone: "9988776644",
    make: "Honda",
    model: "Amaze",
    year: 2018,
    variant: "VX",
    askingPrice: 560000,
    vehicleSummary: "2018 Honda Amaze VX",
    description: "Manual diesel, company service history, expected price 5.6L.",
    status: "reviewed",
    submittedAt: "2026-04-06T11:30:00.000Z",
    updatedAt: "2026-04-06T11:30:00.000Z",
    media: [],
  },
];

export const demoThreads: ChatThreadRecord[] = [
  { id: "thread-support", userId: "demo@example.com", threadType: "support", status: "open", title: "General Support", updatedAt: "2026-04-08T09:45:00.000Z", unreadCount: 1, assignedTo: "manager-demo@example.com" },
  { id: "thread-swift", userId: "demo@example.com", threadType: "vehicle", status: "open", title: "2021 Maruti Swift ZXI", listingId: "listing-swift", updatedAt: "2026-04-08T09:15:00.000Z", unreadCount: 0, assignedTo: "manager-demo@example.com" },
  { id: "thread-creta", userId: "demo@example.com", threadType: "vehicle", status: "open", title: "2020 Hyundai Creta SX", listingId: "listing-creta", updatedAt: "2026-04-07T13:20:00.000Z", unreadCount: 2, assignedTo: "admin-demo@example.com" },
];

export const demoMessages: ChatMessageRecord[] = [
  { id: "msg-001", threadId: "thread-support", senderId: "demo@example.com", senderName: "Dev User", messageType: "text", content: "Can someone confirm when reserved cars move to waitlist?", createdAt: "2026-04-08T09:30:00.000Z" },
  { id: "msg-002", threadId: "thread-support", senderId: "manager-demo@example.com", senderName: "Meera Manager", messageType: "text", content: "Yes. As soon as a car is reserved, new reserve-interest entries go to the waitlist.", createdAt: "2026-04-08T09:45:00.000Z" },
  { id: "msg-003", threadId: "thread-swift", senderId: "demo@example.com", senderName: "Dev User", messageType: "text", content: "Is this Swift still available for inspection tomorrow?", createdAt: "2026-04-08T08:50:00.000Z" },
  { id: "msg-004", threadId: "thread-swift", senderId: "manager-demo@example.com", senderName: "Meera Manager", messageType: "text", content: "Yes, it is available. You can place a reservation request as well.", createdAt: "2026-04-08T09:15:00.000Z" },
  { id: "msg-005", threadId: "thread-creta", senderId: "demo@example.com", senderName: "Dev User", messageType: "voice", voiceDuration: 22, content: "Voice note", createdAt: "2026-04-07T12:45:00.000Z" },
  { id: "msg-006", threadId: "thread-creta", senderId: "admin-demo@example.com", senderName: "Aarav Admin", messageType: "text", content: "This listing is reserved right now, but I can place you first on the waitlist.", createdAt: "2026-04-07T13:20:00.000Z" },
];
