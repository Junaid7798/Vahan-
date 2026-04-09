import { DemoPortalSettings, VehicleRecord } from "@/lib/demo/portal-types";

export interface PortalCatalogResult {
  records: VehicleRecord[];
  vehicles: Array<Record<string, string | number | undefined>>;
  listings: Array<Record<string, string | number | undefined>>;
  media: Array<Record<string, string | number | boolean | undefined>>;
}

export interface PortalNotificationItem {
  description: string;
  href: string;
  id: string;
  title: string;
}

export type PortalAppSettings = DemoPortalSettings;
