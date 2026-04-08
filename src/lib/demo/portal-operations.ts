import { getVehicleCatalog, getVehicleRecord } from "@/lib/demo/portal-catalog";
import { readPortalStore } from "@/lib/demo/portal-store";
import { PermissionCheck } from "@/lib/supabase/permissions";

export interface ShellNotificationItem {
  description: string;
  href: string;
  id: string;
  title: string;
}

function getVehicleTitle(listingId: string, titles: Map<string, string>) {
  return titles.get(listingId) ?? listingId;
}

async function getVehicleTitles() {
  const catalog = await getVehicleCatalog();
  return new Map(catalog.records.map((record) => [record.listingId, `${record.year} ${record.make} ${record.model}`]));
}

export async function getDashboardData(userId: string, permissions: PermissionCheck) {
  const [catalog, state, vehicleTitles] = await Promise.all([getVehicleCatalog(), readPortalStore(), getVehicleTitles()]);
  const available = catalog.records.filter((record) => record.status === "published");
  const reserved = catalog.records.filter((record) => record.status === "reserved");
  const sold = catalog.records.filter((record) => record.status === "sold");

  if (permissions.canManageVehicles) {
    return {
      mode: "staff" as const,
      stats: [
        { label: "Available Listings", value: available.length.toString() },
        { label: "Reserved Listings", value: reserved.length.toString() },
        { label: "Sold Listings", value: sold.length.toString() },
        { label: "Pending Approvals", value: state.users.filter((item) => item.approvalStatus === "pending_approval").length.toString() },
        { label: "Reservation Requests", value: state.reservations.filter((item) => item.status === "pending").length.toString() },
        { label: "Seller Submissions", value: state.submissions.filter((item) => item.status === "pending").length.toString() },
        { label: "Resale Requests", value: state.resales.filter((item) => item.status === "pending").length.toString() },
      ],
      queues: {
        activities: state.activities.slice(0, 5),
        inquiries: state.inquiries.filter((item) => item.status === "open"),
        reservations: state.reservations.filter((item) => item.status === "pending"),
        resales: state.resales.filter((item) => item.status === "pending"),
        submissions: state.submissions.filter((item) => item.status === "pending"),
      },
      records: catalog.records,
      vehicleTitles,
    };
  }

  return {
    mode: "user" as const,
    stats: [
      { label: "Available", value: available.length.toString() },
      { label: "Reserved", value: reserved.length.toString() },
      { label: "Sold", value: sold.length.toString() },
      {
        label: "My Active Requests",
        value: [...state.reservations, ...state.waitlist, ...state.resales].filter((item) => item.userId === userId).length.toString(),
      },
    ],
    recent: {
      available: available.slice(0, 3),
      inquiries: state.inquiries.filter((item) => item.userId === userId).slice(0, 3),
      requests: state.reservations.filter((item) => item.userId === userId).slice(0, 3),
      reserved: reserved.slice(0, 3),
      sold: sold.slice(0, 3),
    },
  };
}

export async function getInquiriesForViewer(userId: string, canViewAll: boolean) {
  const [state, vehicleTitles] = await Promise.all([readPortalStore(), getVehicleTitles()]);
  const inquiries = canViewAll ? state.inquiries : state.inquiries.filter((item) => item.userId === userId);

  return inquiries.map((inquiry) => ({
    ...inquiry,
    listingTitle: getVehicleTitle(inquiry.listingId, vehicleTitles),
    userName: state.users.find((user) => user.id === inquiry.userId)?.fullName ?? inquiry.userId,
  }));
}

export async function getRequestsForViewer(userId: string) {
  const [state, vehicleTitles] = await Promise.all([readPortalStore(), getVehicleTitles()]);

  return {
    reservations: state.reservations.filter((item) => item.userId === userId).map((item) => ({ ...item, listingTitle: getVehicleTitle(item.listingId, vehicleTitles) })),
    resales: state.resales.filter((item) => item.userId === userId).map((item) => ({ ...item, listingTitle: getVehicleTitle(item.listingId, vehicleTitles) })),
    submissions: state.submissions
      .filter((item) => item.userId === userId)
      .map((item) => ({
        ...item,
        linkedListingTitle: item.linkedListingId ? getVehicleTitle(item.linkedListingId, vehicleTitles) : undefined,
      })),
    waitlist: state.waitlist.filter((item) => item.userId === userId).map((item) => ({ ...item, listingTitle: getVehicleTitle(item.listingId, vehicleTitles) })),
  };
}

export async function getChatForViewer(userId: string, canViewAll: boolean) {
  const state = await readPortalStore();
  const threads = canViewAll ? state.threads : state.threads.filter((item) => item.userId === userId);

  return {
    messages: state.messages.filter((item) => threads.some((thread) => thread.id === item.threadId)),
    threads,
  };
}

export async function getSupportData() {
  const [state, vehicleTitles] = await Promise.all([readPortalStore(), getVehicleTitles()]);

  return {
    activities: state.activities,
    reservations: state.reservations.map((item) => ({ ...item, listingTitle: getVehicleTitle(item.listingId, vehicleTitles), requesterName: state.users.find((user) => user.id === item.userId)?.fullName ?? item.userId })),
    resales: state.resales.map((item) => ({ ...item, listingTitle: getVehicleTitle(item.listingId, vehicleTitles), requesterName: state.users.find((user) => user.id === item.userId)?.fullName ?? item.userId })),
    settings: state.settings,
    submissions: state.submissions,
    users: state.users,
    waitlist: state.waitlist.map((item) => ({ ...item, listingTitle: getVehicleTitle(item.listingId, vehicleTitles), requesterName: state.users.find((user) => user.id === item.userId)?.fullName ?? item.userId })),
  };
}

export async function getShellNotifications(userId: string, permissions: PermissionCheck) {
  const [state, vehicleTitles] = await Promise.all([readPortalStore(), getVehicleTitles()]);

  if (permissions.canManageVehicles) {
    const items: ShellNotificationItem[] = [];

    if (permissions.canManageUsers) {
      const pendingApprovals = state.users.filter((item) => item.approvalStatus === "pending_approval").length;
      if (pendingApprovals > 0) {
        items.push({ id: "pending-approvals", title: `${pendingApprovals} approvals waiting`, description: "New signups need an access decision.", href: "/app/admin/users" });
      }
    }

    const pendingReservations = state.reservations.filter((item) => item.status === "pending").length;
    if (pendingReservations > 0) {
      items.push({ id: "reservation-requests", title: `${pendingReservations} reservation requests`, description: "Reserve-interest and waitlist activity needs review.", href: "/app/admin/reservation-requests" });
    }

    const unreadChats = state.threads.filter((item) => item.unreadCount > 0).length;
    if (unreadChats > 0) {
      items.push({ id: "staff-chat", title: `${unreadChats} unread chats`, description: "Support conversations need a reply.", href: "/app/admin/chat" });
    }

    const pendingSubmissions = state.submissions.filter((item) => item.status === "pending").length;
    if (pendingSubmissions > 0) {
      items.push({ id: "seller-submissions", title: `${pendingSubmissions} seller submissions`, description: "New intake records are ready for review.", href: "/app/admin/seller-submissions" });
    }

    return items.slice(0, 6);
  }

  return [
    ...state.reservations
      .filter((item) => item.userId === userId && item.status === "approved")
      .map((item) => ({ id: item.id, title: "Reservation approved", description: `${getVehicleTitle(item.listingId, vehicleTitles)} is reserved for follow-up.`, href: "/app/my-requests" })),
    ...state.waitlist
      .filter((item) => item.userId === userId && item.status === "promoted")
      .map((item) => ({ id: item.id, title: "Waitlist promoted", description: `${getVehicleTitle(item.listingId, vehicleTitles)} moved forward in the queue.`, href: "/app/my-requests" })),
    ...state.threads
      .filter((item) => item.userId === userId && item.unreadCount > 0)
      .map((item) => ({ id: item.id, title: `${item.unreadCount} unread message${item.unreadCount === 1 ? "" : "s"}`, description: item.title, href: "/app/chat" })),
  ].slice(0, 6);
}

export async function getVehicleChatThread(listingId: string, userId: string) {
  const state = await readPortalStore();
  return state.threads.find((thread) => thread.listingId === listingId && thread.userId === userId) ?? null;
}

export async function getVehicleMeta(listingId: string) {
  const record = await getVehicleRecord(listingId);
  return record ? `${record.year} ${record.make} ${record.model}` : listingId;
}
