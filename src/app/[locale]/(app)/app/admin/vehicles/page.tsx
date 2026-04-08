import { Link } from "@/i18n/routing";
import { requireStaff } from "@/lib/auth/viewer";
import { getVehicleCatalog } from "@/lib/demo/portal-catalog";
import { VehicleManagementTable } from "@/modules/admin/components/vehicle-management-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminVehiclesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireStaff(locale);
  const catalog = await getVehicleCatalog();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vehicle Management</CardTitle>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/app/admin/seller-submissions">Import seller submission</Link></Button>
          <Button asChild><Link href="/app/admin/vehicles/new">Add vehicle</Link></Button>
        </div>
      </CardHeader>
      <CardContent>
        <VehicleManagementTable locale={locale} rows={catalog.records} />
      </CardContent>
    </Card>
  );
}
