import { UsersManagementPanel } from "@/modules/admin/components/users-management-panel";
import { requireAdmin } from "@/lib/auth/viewer";
import { getSupportData } from "@/lib/portal/operations";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  const data = await getSupportData();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Admin Users</p>
        <h1 className="text-3xl font-semibold tracking-tight">Review approvals and access</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Approve new accounts, disable access, and control whether managers can handle sensitive financial fields.
        </p>
      </div>

      <UsersManagementPanel users={data.users} />
    </div>
  );
}
