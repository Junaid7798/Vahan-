import { redirect } from "next/navigation";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/auth/session";
import { demoUsers } from "@/lib/demo/portal-seed";
import { getDemoUserByEmail } from "@/lib/demo/portal-users";
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
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

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
