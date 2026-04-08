import { getTranslations } from "next-intl/server";
import { requireViewer } from "@/lib/auth/viewer";
import { getVehicleCatalog } from "@/lib/demo/portal-catalog";
import { InventoryScreen } from "@/modules/inventory/components/inventory-screen";

export default async function ReservedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const inventoryT = await getTranslations({ locale, namespace: "inventory" });
  const viewer = await requireViewer(locale);
  const catalog = await getVehicleCatalog(["reserved"]);

  return (
    <InventoryScreen
      description={inventoryT("reservedDescription")}
      title={inventoryT("reservedTitle")}
      vehicles={catalog.vehicles}
      listings={catalog.listings}
      media={catalog.media}
      primaryActionLabel={inventoryT("joinWaitlist")}
      showPricing={viewer.permissions.canViewFinancials}
    />
  );
}
