import { getVehicleCatalog as getDemoVehicleCatalog, getVehicleRecord as getDemoVehicleRecord, getStatusLabel, sumVehicleCosts } from "@/lib/demo/portal-catalog";
import { isSupabaseConfigured } from "@/lib/auth/session";
import { getVehicleCatalog as getSupabaseVehicleCatalog, getVehicleRecord as getSupabaseVehicleRecord } from "@/lib/supabase/portal-catalog";

export async function getVehicleCatalog(statuses?: string[], showFinancials = false) {
  if (!isSupabaseConfigured()) {
    const catalog = await getDemoVehicleCatalog(statuses);
    return {
      ...catalog,
      listings: catalog.listings.map((listing) => ({
        ...listing,
        target_selling_price: showFinancials ? listing.target_selling_price : undefined,
      })),
    };
  }

  return getSupabaseVehicleCatalog(statuses, showFinancials);
}

export async function getVehicleRecord(listingId: string, showFinancials = false) {
  if (!isSupabaseConfigured()) {
    const record = await getDemoVehicleRecord(listingId);
    if (!record || showFinancials) {
      return record;
    }

    return {
      ...record,
      vin: undefined,
      procurementPrice: undefined,
      targetSellingPrice: undefined,
      extraSpend: undefined,
      maintenanceCost: undefined,
      documentationCost: undefined,
      transportCost: undefined,
      otherCost: undefined,
      internalNotes: undefined,
    };
  }

  return getSupabaseVehicleRecord(listingId, showFinancials);
}

export { getStatusLabel, sumVehicleCosts };
