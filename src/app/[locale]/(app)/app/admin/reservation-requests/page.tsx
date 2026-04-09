import { ReservationRequestsPanel } from "@/modules/admin/components/reservation-requests-panel";
import { requireStaff } from "@/lib/auth/viewer";
import { getSupportData } from "@/lib/portal/operations";

export default async function ReservationRequestsPage({
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
        <h1 className="text-3xl font-semibold tracking-tight">Reservation review</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Approve or reject reserve-interest requests. Approved requests move the related listing into the reserved state.
        </p>
      </div>

      <ReservationRequestsPanel rows={data.reservations} />
    </div>
  );
}
