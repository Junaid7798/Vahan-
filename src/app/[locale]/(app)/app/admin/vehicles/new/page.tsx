import { requireStaff } from "@/lib/auth/viewer";
import { VehicleForm } from "@/modules/inventory/components/vehicle-form";

export default async function NewVehiclePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const viewer = await requireStaff(locale);
  return <VehicleForm mode="create" showFinancials={viewer.permissions.canViewFinancials} />;
}
