import { redirect } from "next/navigation";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/auth/session";
import { demoUsers } from "@/lib/demo/portal-seed";
import { getDemoUserByEmail } from "@/lib/demo/portal-users";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createServerClient } from "@/lib/supabase/server-client";
import { getPermissions, PermissionCheck, UserProfile } from "@/lib/supabase/permissions";

export interface ViewerContext {
  user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>;
  profile: UserProfile;
  permissions: PermissionCheck;
}

function buildDemoProfile(email: string): UserProfile {
  const account = demoUsers.find((item) => item.email === email);
  const role = account?.role ?? (email.startsWith("admin") ? "admin" : email.startsWith("manager") ? "manager" : "user");

  return {
    id: email,
    full_name: account?.fullName ?? `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
    phone: account?.phone ?? null,
    city: account?.city ?? null,
    role,
    approval_status: account?.approvalStatus ?? "approved",
    can_view_financials: account?.canViewFinancials ?? role !== "user",
    created_at: account?.createdAt ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function getViewerContext(): Promise<ViewerContext | null> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  if (!isSupabaseConfigured()) {
    const email = user.email ?? user.id;
    const account = await getDemoUserByEmail(email);
    const profile = account
      ? {
          id: account.id,
          full_name: account.fullName,
          phone: account.phone,
          city: account.city,
          role: account.role,
          approval_status: account.approvalStatus,
          can_view_financials: account.canViewFinancials,
          created_at: account.createdAt,
          updated_at: new Date().toISOString(),
        }
      : buildDemoProfile(email);

    return { user, profile, permissions: getPermissions(profile) };
  }

  const supabase = await createServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).maybeSingle();

  const adminEmail = process.env.SUPABASE_ADMIN_EMAIL?.toLowerCase();
  const shouldPromoteToAdmin = Boolean(user.email && adminEmail && user.email.toLowerCase() === adminEmail);

  if (!profile || shouldPromoteToAdmin) {
    try {
      const adminClient = createAdminClient();
      const payload = {
        id: user.id,
        full_name: authUser?.user_metadata.full_name ?? user.email ?? user.id,
        phone: authUser?.user_metadata.phone ?? null,
        city: authUser?.user_metadata.city ?? null,
        preferred_locale: authUser?.user_metadata.preferred_locale === "hi" ? "hi" : "en",
        role: shouldPromoteToAdmin ? "admin" : profile?.role ?? "user",
        approval_status: shouldPromoteToAdmin ? "approved" : profile?.approval_status ?? "pending_approval",
        can_view_financials: shouldPromoteToAdmin ? true : profile?.can_view_financials ?? false,
      };

      await adminClient.from("user_profiles").upsert(payload, { onConflict: "id" });
      const result = await adminClient.from("user_profiles").select("*").eq("id", user.id).maybeSingle();
      profile = result.data ?? profile;
    } catch {
      if (!profile) {
        return null;
      }
    }
  }

  if (!profile) {
    return null;
  }

  return { user, profile, permissions: getPermissions(profile) };
}

export async function requireViewer(locale: string): Promise<ViewerContext> {
  const viewer = await getViewerContext();

  if (!viewer) {
    redirect(`/${locale}/login`);
  }

  return viewer;
}

export async function requireStaff(locale: string): Promise<ViewerContext> {
  const viewer = await requireViewer(locale);

  if (!viewer.permissions.canManageVehicles && !viewer.permissions.canManageUsers) {
    redirect(`/${locale}/app`);
  }

  return viewer;
}

export async function requireAdmin(locale: string): Promise<ViewerContext> {
  const viewer = await requireViewer(locale);

  if (!viewer.permissions.canManageUsers) {
    redirect(`/${locale}/app`);
  }

  return viewer;
}
