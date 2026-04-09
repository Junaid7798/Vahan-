import "server-only";

import { ApprovalStatus, UserRole } from "@/lib/supabase/permissions";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { logPortalActivity } from "@/lib/supabase/portal-activity";

interface SettingsInput {
  defaultLocale: "en" | "hi";
  managerFinancialAccess: boolean;
  notifications: {
    chats: boolean;
    inquiries: boolean;
    reservations: boolean;
    resaleRequests: boolean;
    sellerSubmissions: boolean;
  };
}

export async function updateProfile(userId: string, input: { city: string; fullName: string; phone: string; preferredLocale: "en" | "hi" }) {
  const client = createAdminClient();
  const { error } = await client
    .from("user_profiles")
    .update({
      city: input.city,
      full_name: input.fullName,
      phone: input.phone,
      preferred_locale: input.preferredLocale,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await logPortalActivity({
    action: "profile_updated",
    entityId: userId,
    entityType: "user_profiles",
    userId,
  });
}

export async function updateSettings(input: SettingsInput, actorId: string) {
  const client = createAdminClient();
  const { error } = await client
    .from("app_settings")
    .update({
      default_locale: input.defaultLocale,
      manager_financial_access: input.managerFinancialAccess,
      notify_chats: input.notifications.chats,
      notify_inquiries: input.notifications.inquiries,
      notify_reservations: input.notifications.reservations,
      notify_resale_requests: input.notifications.resaleRequests,
      notify_seller_submissions: input.notifications.sellerSubmissions,
    })
    .eq("id", 1);

  if (error) {
    throw new Error(error.message);
  }

  if (!input.managerFinancialAccess) {
    const { error: managerError } = await client
      .from("user_profiles")
      .update({ can_view_financials: false })
      .eq("role", "manager");

    if (managerError) {
      throw new Error(managerError.message);
    }
  }

  await logPortalActivity({
    action: "settings_updated",
    entityType: "app_settings",
    userId: actorId,
  });
}

export async function updateUserAccess(
  actorId: string,
  actorEmail: string | null,
  input: { approvalStatus: ApprovalStatus; canViewFinancials: boolean; role: UserRole; userId: string }
) {
  const client = createAdminClient();
  const { data: settings, error: settingsError } = await client
    .from("app_settings")
    .select("manager_financial_access")
    .eq("id", 1)
    .maybeSingle();

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  const { data: authUsers, error: authError } = await client.auth.admin.listUsers();
  if (authError) {
    throw new Error(authError.message);
  }

  const authUser = authUsers.users.find((item) => item.id === input.userId);
  if (actorEmail && authUser?.email === actorEmail && input.approvalStatus === "disabled") {
    throw new Error("You cannot disable your own account.");
  }

  const canViewFinancials =
    input.role === "admin"
      ? true
      : input.role === "manager"
        ? input.canViewFinancials && Boolean(settings?.manager_financial_access)
        : false;

  const { error } = await client
    .from("user_profiles")
    .update({
      role: input.role,
      approval_status: input.approvalStatus,
      can_view_financials: canViewFinancials,
    })
    .eq("id", input.userId);

  if (error) {
    throw new Error(error.message);
  }

  await logPortalActivity({
    action: "user_access_updated",
    details: { approvalStatus: input.approvalStatus, role: input.role },
    entityId: input.userId,
    entityType: "user_profiles",
    userId: actorId,
  });
}
