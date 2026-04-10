import { getTranslations } from "next-intl/server";
import { requireViewer } from "@/lib/auth/viewer";
import { getVehicleCatalog } from "@/lib/portal/catalog";
import { InventoryScreen } from "@/modules/inventory/components/inventory-screen";

export default async function SoldPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const inventoryT = await getTranslations({ locale, namespace: "inventory" });
  const viewer = await requireViewer(locale);
  const catalog = await getVehicleCatalog(
    ["sold"],
    viewer.permissions.canViewFinancials,
    viewer.permissions.canManageVehicles,
  );

  return (
    <InventoryScreen
      description={inventoryT("soldDescription")}
      title={inventoryT("soldTitle")}
      vehicles={catalog.vehicles}
      listings={catalog.listings}
      media={catalog.media}
      primaryActionLabel={inventoryT("requestResale")}
      showPricing={viewer.permissions.canViewFinancials}
    />
  );
}
