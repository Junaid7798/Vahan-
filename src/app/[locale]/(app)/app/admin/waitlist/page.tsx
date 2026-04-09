import { WaitlistPanel } from "@/modules/admin/components/waitlist-panel";
import { requireStaff } from "@/lib/auth/viewer";
import { getSupportData } from "@/lib/portal/operations";

export default async function WaitlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireStaff(locale);
  const data = await getSupportData();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Staff Queue</p>
        <h1 className="text-3xl font-semibold tracking-tight">Waitlist management</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Promote the next interested buyer when a reserved vehicle becomes available or clear entries that no longer need follow-up.
        </p>
      </div>

      <WaitlistPanel rows={data.waitlist} />
    </div>
  );
}
