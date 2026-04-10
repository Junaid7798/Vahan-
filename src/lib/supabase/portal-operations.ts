import "server-only";

import { DemoPortalSettings } from "@/lib/demo/portal-types";
import { PermissionCheck } from "@/lib/supabase/permissions";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { getVehicleCatalog, getVehicleRecord } from "@/lib/supabase/portal-catalog";
import { PortalNotificationItem } from "@/lib/supabase/portal-types";
import { resolveStorageUrl } from "@/lib/supabase/portal-media";
import { getSellerSubmissions } from "@/lib/supabase/portal-submission-records";

function getVehicleTitle(listingId: string, titles: Map<string, string>) {
  return titles.get(listingId) ?? listingId;
}

async function getVehicleTitles() {
  const catalog = await getVehicleCatalog();
  return new Map(catalog.records.map((record) => [record.listingId, `${record.year} ${record.make} ${record.model}`]));
}

async function getAppSettings(): Promise<DemoPortalSettings> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return {
      defaultLocale: "en",
      managerFinancialAccess: false,
      notifications: {
        inquiries: true,
        reservations: true,
        sellerSubmissions: true,
        resaleRequests: true,
        chats: true,
      },
    };
  }

  return {
    defaultLocale: data.default_locale === "hi" ? "hi" : "en",
    managerFinancialAccess: Boolean(data.manager_financial_access),
    notifications: {
      inquiries: Boolean(data.notify_inquiries),
      reservations: Boolean(data.notify_reservations),
      sellerSubmissions: Boolean(data.notify_seller_submissions),
      resaleRequests: Boolean(data.notify_resale_requests),
      chats: Boolean(data.notify_chats),
    },
  };
}

async function getProfilesMap() {
  const client = createAdminClient();
  const { data, error } = await client
    .from("user_profiles")
    .select("id, full_name, phone, city, role, approval_status, can_view_financials, preferred_locale, created_at");

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile]));
}

export async function getDashboardData(userId: string, permissions: PermissionCheck) {
  const client = createAdminClient();
  const [catalog, vehicleTitles, profilesMap, submissions] = await Promise.all([
    getVehicleCatalog(),
    getVehicleTitles(),
    getProfilesMap(),
    permissions.canManageVehicles ? getSellerSubmissions() : Promise.resolve([]),
  ]);

  const available = catalog.records.filter((record) => record.status === "published");
  const reserved = catalog.records.filter((record) => record.status === "reserved");
  const sold = catalog.records.filter((record) => record.status === "sold");

  const [{ data: inquiries }, { data: reservations }, { data: waitlist }, { data: resales }, { data: activities }] =
    await Promise.all([
      client.from("inquiries").select("*").order("updated_at", { ascending: false }),
      client.from("reservation_requests").select("*").order("updated_at", { ascending: false }),
      client.from("reservation_waitlist").select("*").order("created_at", { ascending: false }),
      client.from("resale_requests").select("*").order("updated_at", { ascending: false }),
      client.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(5),
    ]);

  if (permissions.canManageVehicles) {
    return {
      mode: "staff" as const,
      stats: [
        { label: "Available Listings", value: available.length.toString() },
        { label: "Reserved Listings", value: reserved.length.toString() },
        { label: "Sold Listings", value: sold.length.toString() },
        { label: "Pending Approvals", value: Array.from(profilesMap.values()).filter((item) => item.approval_status === "pending_approval").length.toString() },
        { label: "Reservation Requests", value: (reservations ?? []).filter((item) => item.status === "pending").length.toString() },
        { label: "Seller Submissions", value: submissions.filter((item) => item.status === "pending").length.toString() },
        { label: "Resale Requests", value: (resales ?? []).filter((item) => item.status === "pending").length.toString() },
      ],
      queues: {
        activities: (activities ?? []).map((item) => ({
          id: item.id,
          title: item.action.replaceAll("_", " "),
          description: typeof item.details === "object" && item.details && "message" in item.details
            ? String(item.details.message)
            : item.entity_type ? `${item.entity_type} ${item.entity_id ?? ""}`.trim() : item.action,
          createdAt: item.created_at,
        })),
        inquiries: (inquiries ?? []).filter((item) => item.status === "open"),
        reservations: (reservations ?? []).filter((item) => item.status === "pending"),
        resales: (resales ?? []).filter((item) => item.status === "pending"),
        submissions: submissions.filter((item) => item.status === "pending"),
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
        value: [
          ...(reservations ?? []).filter((item) => item.user_id === userId),
          ...(waitlist ?? []).filter((item) => item.user_id === userId),
          ...(resales ?? []).filter((item) => item.user_id === userId),
        ].length.toString(),
      },
    ],
    recent: {
      available: available.slice(0, 3),
      inquiries: (inquiries ?? []).filter((item) => item.user_id === userId).slice(0, 3),
      requests: (reservations ?? []).filter((item) => item.user_id === userId).slice(0, 3),
      reserved: reserved.slice(0, 3),
      sold: sold.slice(0, 3),
    },
  };
}

export async function getInquiriesForViewer(userId: string, canViewAll: boolean) {
  const client = createAdminClient();
  const [vehicleTitles, profilesMap, query] = await Promise.all([
    getVehicleTitles(),
    getProfilesMap(),
    canViewAll
      ? client.from("inquiries").select("*").order("updated_at", { ascending: false })
      : client.from("inquiries").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
  ]);

  const inquiries = query.data ?? [];
  return inquiries.map((inquiry) => ({
    id: inquiry.id,
    listingId: inquiry.listing_id,
    listingTitle: getVehicleTitle(inquiry.listing_id, vehicleTitles),
    status: inquiry.status,
    subject: inquiry.subject ?? "Inquiry",
    updatedAt: inquiry.updated_at,
    userName: profilesMap.get(inquiry.user_id)?.full_name ?? inquiry.user_id,
  }));
}

export async function getRequestsForViewer(userId: string) {
  const client = createAdminClient();
  const [vehicleTitles, submissions, reservations, resales, waitlist] = await Promise.all([
    getVehicleTitles(),
    getSellerSubmissions(userId),
    client.from("reservation_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    client.from("resale_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    client.from("reservation_waitlist").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  return {
    reservations: (reservations.data ?? []).map((item) => ({
      id: item.id,
      listingTitle: getVehicleTitle(item.listing_id, vehicleTitles),
      status: item.status,
      createdAt: item.created_at,
    })),
    resales: (resales.data ?? []).map((item) => ({
      id: item.id,
      listingTitle: getVehicleTitle(item.listing_id, vehicleTitles),
      status: item.status,
      createdAt: item.created_at,
    })),
    submissions: submissions
      .map((item) => ({
        ...item,
        linkedListingTitle: item.linkedListingId ? getVehicleTitle(item.linkedListingId, vehicleTitles) : undefined,
      })),
    waitlist: (waitlist.data ?? []).map((item) => ({
      id: item.id,
      listingTitle: getVehicleTitle(item.listing_id, vehicleTitles),
      position: item.position,
      status: item.status === "waiting" ? "active" : item.status,
      createdAt: item.created_at,
    })),
  };
}

export async function getChatForViewer(userId: string, canViewAll: boolean) {
  const client = createAdminClient();
  const threadDiscovery = canViewAll
    ? await client.from("chat_threads").select("id")
    : await client.from("chat_participants").select("thread_id").eq("user_id", userId);

  if (threadDiscovery.error) {
    throw new Error(threadDiscovery.error.message);
  }

  const threadIds = Array.from(
    new Set(
      (threadDiscovery.data ?? []).map((item) => ("thread_id" in item ? item.thread_id : item.id))
    )
  );

  if (threadIds.length === 0) {
    return { messages: [], threads: [] };
  }

  const [profilesMap, threadResult, messageResult, vehicleTitles, viewerParticipants] = await Promise.all([
    getProfilesMap(),
    client.from("chat_threads").select("*").in("id", threadIds).order("updated_at", { ascending: false }),
    client.from("chat_messages").select("*").in("thread_id", threadIds).order("created_at", { ascending: true }),
    getVehicleTitles(),
    client.from("chat_participants").select("thread_id, last_read_at").eq("user_id", userId).in("thread_id", threadIds),
  ]);

  const threads = threadResult.data ?? [];
  const messages = messageResult.data ?? [];
  const participantMap = new Map((viewerParticipants.data ?? []).map((item) => [item.thread_id, item]));

  const mappedMessages = await Promise.all(
    messages.map(async (message) => ({
      id: message.id,
      threadId: message.thread_id,
      senderId: message.sender_id,
      senderName: profilesMap.get(message.sender_id)?.full_name ?? "User",
      messageType: message.message_type as "text" | "voice" | "image",
      content:
        message.message_type === "voice"
          ? await resolveStorageUrl("voice-notes", message.voice_note_path)
          : message.content ?? undefined,
      voiceDuration: message.voice_duration ?? undefined,
      imageUrl: undefined,
      createdAt: message.created_at,
    }))
  );

  const mappedThreads = threads.map((thread) => {
    const participant = participantMap.get(thread.id);
    const unreadCount = participant?.last_read_at
      ? mappedMessages.filter(
          (message) =>
            message.threadId === thread.id &&
            message.senderId !== userId &&
            new Date(message.createdAt).getTime() > new Date(participant.last_read_at).getTime()
        ).length
      : mappedMessages.filter((message) => message.threadId === thread.id && message.senderId !== userId).length;

    return {
      id: thread.id,
      listingId: thread.listing_id ?? undefined,
      status: thread.status as "open" | "closed",
      threadType: thread.thread_type as "support" | "vehicle",
      title: thread.thread_type === "support" ? "General support" : getVehicleTitle(thread.listing_id ?? thread.id, vehicleTitles),
      unreadCount,
      updatedAt: thread.updated_at,
    };
  });

  return {
    messages: mappedMessages,
    threads: mappedThreads,
  };
}

export async function getSupportData() {
  const client = createAdminClient();
  const [vehicleTitles, profilesMap, settings, submissions, reservations, resales, waitlist, activities] = await Promise.all([
    getVehicleTitles(),
    getProfilesMap(),
    getAppSettings(),
    getSellerSubmissions(),
    client.from("reservation_requests").select("*").order("created_at", { ascending: false }),
    client.from("resale_requests").select("*").order("created_at", { ascending: false }),
    client.from("reservation_waitlist").select("*").order("created_at", { ascending: false }),
    client.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(20),
  ]);

  const admin = createAdminClient();
  const { data: authUsers } = await admin.auth.admin.listUsers();

  return {
    activities: (activities.data ?? []).map((item) => ({
      id: item.id,
      title: item.action.replaceAll("_", " "),
      description: typeof item.details === "object" && item.details && "message" in item.details
        ? String(item.details.message)
        : item.entity_type ? `${item.entity_type} ${item.entity_id ?? ""}`.trim() : item.action,
      createdAt: item.created_at,
    })),
    reservations: (reservations.data ?? []).map((item) => ({
      id: item.id,
      listingTitle: getVehicleTitle(item.listing_id, vehicleTitles),
      requesterId: item.user_id,
      requesterName: profilesMap.get(item.user_id)?.full_name ?? item.user_id,
      status: item.status,
      priority: item.priority ?? "normal",
      createdAt: item.created_at,
    })),
    resales: (resales.data ?? []).map((item) => ({
      id: item.id,
      listingTitle: getVehicleTitle(item.listing_id, vehicleTitles),
      requesterId: item.user_id,
      requesterName: profilesMap.get(item.user_id)?.full_name ?? item.user_id,
      status: item.status,
      expectedTimeline: item.expected_timeline ?? "flexible",
      createdAt: item.created_at,
    })),
    settings,
    submissions,
    users: authUsers.users.map((user) => {
      const profile = profilesMap.get(user.id);
      return {
        id: user.id,
        fullName: profile?.full_name ?? user.user_metadata.full_name ?? user.email ?? "User",
        email: user.email ?? "",
        phone: profile?.phone ?? "",
        city: profile?.city ?? "",
        role: (profile?.role ?? "user") as "admin" | "manager" | "user",
        approvalStatus: (profile?.approval_status ?? "pending_approval") as "approved" | "disabled" | "pending_approval" | "rejected",
        canViewFinancials: Boolean(profile?.can_view_financials),
        preferredLocale: (profile?.preferred_locale ?? "en") as "en" | "hi",
        createdAt: profile?.created_at ?? user.created_at,
      };
    }),
    waitlist: (waitlist.data ?? []).map((item) => ({
      id: item.id,
      listingTitle: getVehicleTitle(item.listing_id, vehicleTitles),
      requesterId: item.user_id,
      requesterName: profilesMap.get(item.user_id)?.full_name ?? item.user_id,
      position: item.position,
      status: item.status === "waiting" ? "active" : item.status,
      createdAt: item.created_at,
    })),
  };
}

export async function getShellNotifications(userId: string, permissions: PermissionCheck): Promise<PortalNotificationItem[]> {
  const [supportData, chatData] = await Promise.all([
    getSupportData(),
    getChatForViewer(userId, permissions.canManageVehicles),
  ]);

  if (permissions.canManageVehicles) {
    const items: PortalNotificationItem[] = [];
    const pendingApprovals = supportData.users.filter((item) => item.approvalStatus === "pending_approval").length;
    if (permissions.canManageUsers && pendingApprovals > 0) {
      items.push({
        id: "pending-approvals",
        title: `${pendingApprovals} approvals waiting`,
        description: "New signups need an access decision.",
        href: "/app/admin/users",
      });
    }

    const pendingReservations = supportData.reservations.filter((item) => item.status === "pending").length;
    if (pendingReservations > 0) {
      items.push({
        id: "reservation-requests",
        title: `${pendingReservations} reservation requests`,
        description: "Reserve-interest and waitlist activity needs review.",
        href: "/app/admin/reservation-requests",
      });
    }

    const unreadChats = chatData.threads.filter((item) => item.unreadCount > 0).length;
    if (unreadChats > 0) {
      items.push({
        id: "staff-chat",
        title: `${unreadChats} unread chats`,
        description: "Support conversations need a reply.",
        href: "/app/admin/chat",
      });
    }

    const pendingSubmissions = supportData.submissions.filter((item) => item.status === "pending").length;
    if (pendingSubmissions > 0) {
      items.push({
        id: "seller-submissions",
        title: `${pendingSubmissions} seller submissions`,
        description: "New intake records are ready for review.",
        href: "/app/admin/seller-submissions",
      });
    }

    return items.slice(0, 6);
  }

  return [
    ...supportData.reservations
      .filter((item) => item.requesterId === userId && item.status === "approved")
      .map((item) => ({
        id: item.id,
        title: "Reservation approved",
        description: `${item.listingTitle} is reserved for follow-up.`,
        href: "/app/my-requests",
      })),
    ...supportData.waitlist
      .filter((item) => item.requesterId === userId && item.status === "promoted")
      .map((item) => ({
        id: item.id,
        title: "Waitlist promoted",
        description: `${item.listingTitle} moved forward in the queue.`,
        href: "/app/my-requests",
      })),
    ...chatData.threads
      .filter((item) => item.unreadCount > 0)
      .map((item) => ({
        id: item.id,
        title: `${item.unreadCount} unread message${item.unreadCount === 1 ? "" : "s"}`,
        description: item.title,
        href: "/app/chat",
      })),
  ].slice(0, 6);
}

export async function getVehicleChatThread(listingId: string, userId: string) {
  const chat = await getChatForViewer(userId, false);
  return chat.threads.find((thread) => thread.listingId === listingId) ?? null;
}

export async function getVehicleMeta(listingId: string) {
  const record = await getVehicleRecord(listingId, true, true);
  return record ? `${record.year} ${record.make} ${record.model}` : listingId;
}
