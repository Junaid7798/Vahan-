import { getTranslations } from "next-intl/server";
import { requireViewer } from "@/lib/auth/viewer";
import { getVehicleCatalog } from "@/lib/demo/portal-catalog";
import { InventoryScreen } from "@/modules/inventory/components/inventory-screen";

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const inventoryT = await getTranslations({ locale, namespace: "inventory" });
  const viewer = await requireViewer(locale);
  const catalog = await getVehicleCatalog(["published"]);

  return (
    <InventoryScreen
      description={inventoryT("availableDescription")}
      primaryActionLabel={inventoryT("reserveInterest")}
      title={inventoryT("availableTitle")}
      vehicles={catalog.vehicles}
      listings={catalog.listings}
      media={catalog.media}
      showPricing={viewer.permissions.canViewFinancials}
    />
  );
}
