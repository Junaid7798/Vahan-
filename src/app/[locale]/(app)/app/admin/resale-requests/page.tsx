import { ResaleRequestsPanel } from "@/modules/admin/components/resale-requests-panel";
import { requireStaff } from "@/lib/auth/viewer";
import { getSupportData } from "@/lib/demo/portal-operations";

export default async function ResaleRequestsPage({
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
        <h1 className="text-3xl font-semibold tracking-tight">Resale requests</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Review resale interest on sold vehicles and create a new linked listing when the vehicle is ready to re-enter inventory.
        </p>
      </div>

      <ResaleRequestsPanel rows={data.resales} />
    </div>
  );
}
