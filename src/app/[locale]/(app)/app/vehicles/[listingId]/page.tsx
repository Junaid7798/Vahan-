import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/auth/viewer";
import { getVehicleRecord } from "@/lib/demo/portal-catalog";
import { VehicleDetailScreen } from "@/modules/inventory/components/vehicle-detail-screen";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; listingId: string }>;
}) {
  const { locale, listingId } = await params;
  const viewer = await requireViewer(locale);
  const record = await getVehicleRecord(listingId);

  if (!record) {
    notFound();
  }

  return <VehicleDetailScreen record={record} showFinancials={viewer.permissions.canViewFinancials} />;
}
