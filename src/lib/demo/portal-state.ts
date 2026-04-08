import {
  demoInquiries,
  demoMessages,
  demoReservations,
  demoResales,
  demoSellerSubmissions,
  demoThreads,
  demoUsers,
  demoWaitlist,
} from "@/lib/demo/portal-seed";
import { normalizeSellerSubmission } from "@/lib/demo/submission-utils";
import { DemoPortalActivityRecord, DemoPortalSettings, DemoPortalState } from "@/lib/demo/portal-types";

const initialActivities: DemoPortalActivityRecord[] = [
  {
    id: "activity-001",
    title: "Seller submission received",
    description: "A new Hyundai Venue submission is waiting for review.",
    createdAt: "2026-04-08T07:30:00.000Z",
  },
  {
    id: "activity-002",
    title: "Reservation request created",
    description: "Dev User requested reserve interest on listing-swift.",
    createdAt: "2026-04-07T09:30:00.000Z",
  },
  {
    id: "activity-003",
    title: "Chat reply sent",
    description: "Support replied in the General Support thread.",
    createdAt: "2026-04-08T09:45:00.000Z",
  },
];

const initialSettings: DemoPortalSettings = {
  defaultLocale: "en",
  managerFinancialAccess: true,
  notifications: {
    inquiries: true,
    reservations: true,
    sellerSubmissions: true,
    resaleRequests: true,
    chats: true,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function normalizePortalState(state: DemoPortalState): DemoPortalState {
  return {
    ...state,
    submissions: state.submissions.map((submission) => normalizeSellerSubmission(submission)),
  };
}

export function getInitialPortalState(): DemoPortalState {
  return normalizePortalState({
    users: clone(demoUsers),
    inquiries: clone(demoInquiries),
    reservations: clone(demoReservations),
    waitlist: clone(demoWaitlist),
    resales: clone(demoResales),
    submissions: clone(demoSellerSubmissions),
    threads: clone(demoThreads),
    messages: clone(demoMessages),
    activities: clone(initialActivities),
    settings: clone(initialSettings),
  });
}
