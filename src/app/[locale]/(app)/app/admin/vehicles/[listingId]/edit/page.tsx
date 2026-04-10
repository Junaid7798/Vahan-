import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/viewer";
import { getVehicleRecord } from "@/lib/portal/catalog";
import { VehicleForm } from "@/modules/inventory/components/vehicle-form";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ locale: string; listingId: string }>;
}) {
  const { locale, listingId } = await params;
  const viewer = await requireStaff(locale);
  const record = await getVehicleRecord(
    listingId,
    viewer.permissions.canViewFinancials,
    viewer.permissions.canManageVehicles,
  );

  if (!record) {
    notFound();
  }

  return <VehicleForm initialRecord={record} mode="edit" showFinancials={viewer.permissions.canViewFinancials} />;
}
