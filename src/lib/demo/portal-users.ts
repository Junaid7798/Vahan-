import { ApprovalStatus, UserRole } from "@/lib/supabase/permissions";
import { DemoPortalState, DemoUserAccount, PortalLocale } from "@/lib/demo/portal-types";
import { readPortalStore, updatePortalStore } from "@/lib/demo/portal-store";
import { addActivity, nowIso } from "@/lib/demo/portal-utils";

function normalizeFinancialAccess(state: DemoPortalState, user: DemoUserAccount) {
  if (user.role === "admin") return true;
  if (user.role === "manager") return state.settings.managerFinancialAccess;
  return false;
}

export async function getDemoUserByEmail(email: string) {
  const state = await readPortalStore();
  return state.users.find((user) => user.email === email) ?? null;
}

export async function createPendingDemoUser(input: {
  city: string;
  email: string;
  fullName: string;
  phone: string;
}) {
  const timestamp = nowIso();

  return updatePortalStore((state) => {
    const existingUser = state.users.find((user) => user.email === input.email);
    if (existingUser) {
      return state;
    }

    const newUser: DemoUserAccount = {
      id: input.email,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      city: input.city,
      role: "user",
      approvalStatus: "pending_approval",
      canViewFinancials: false,
      preferredLocale: state.settings.defaultLocale,
      createdAt: timestamp,
    };

    return {
      ...state,
      users: [newUser, ...state.users],
      activities: addActivity(state, "New signup pending", `${input.fullName} is waiting for approval.`),
    };
  });
}

export async function updateDemoProfile(input: {
  city: string;
  email: string;
  fullName: string;
  phone: string;
  preferredLocale: PortalLocale;
}) {
  return updatePortalStore((state) => {
    const user = state.users.find((item) => item.email === input.email);
    if (!user) {
      throw new Error("User not found.");
    }

    user.fullName = input.fullName;
    user.phone = input.phone;
    user.city = input.city;
    user.preferredLocale = input.preferredLocale;

    return {
      ...state,
      users: [...state.users],
      activities: addActivity(state, "Profile updated", `${input.fullName} updated account details.`),
    };
  });
}

export async function updateDemoSettings(input: {
  defaultLocale: PortalLocale;
  managerFinancialAccess: boolean;
  notifications: {
    chats: boolean;
    inquiries: boolean;
    reservations: boolean;
    resaleRequests: boolean;
    sellerSubmissions: boolean;
  };
}) {
  return updatePortalStore((state) => {
    state.settings = {
      defaultLocale: input.defaultLocale,
      managerFinancialAccess: input.managerFinancialAccess,
      notifications: {
        chats: input.notifications.chats,
        inquiries: input.notifications.inquiries,
        reservations: input.notifications.reservations,
        resaleRequests: input.notifications.resaleRequests,
        sellerSubmissions: input.notifications.sellerSubmissions,
      },
    };

    state.users = state.users.map((user) => ({
      ...user,
      canViewFinancials: normalizeFinancialAccess(state, user),
    }));

    return {
      ...state,
      activities: addActivity(state, "Settings updated", "Operational settings were saved."),
    };
  });
}

export async function updateDemoUser(input: {
  actorEmail: string;
  approvalStatus: ApprovalStatus;
  canViewFinancials: boolean;
  role: UserRole;
  userId: string;
}) {
  return updatePortalStore((state) => {
    const user = state.users.find((item) => item.id === input.userId);
    if (!user) {
      throw new Error("User not found.");
    }

    if (user.email === input.actorEmail && input.approvalStatus === "disabled") {
      throw new Error("You cannot disable your own account.");
    }

    user.role = input.role;
    user.approvalStatus = input.approvalStatus;
    user.canViewFinancials =
      input.role === "admin"
        ? true
        : input.role === "manager"
          ? input.canViewFinancials && state.settings.managerFinancialAccess
          : false;

    return {
      ...state,
      users: [...state.users],
      activities: addActivity(state, "User access changed", `${user.fullName} is now ${input.role} / ${input.approvalStatus}.`),
    };
  });
}
