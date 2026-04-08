type InventoryLabelKey =
  | "allMakes"
  | "allFuelTypes"
  | "allTransmissions"
  | "automatic"
  | "cvt"
  | "diesel"
  | "electric"
  | "hatchback"
  | "hybrid"
  | "manual"
  | "petrol"
  | "sedan"
  | "suv";

type InventoryTranslator = (key: InventoryLabelKey) => string;

export interface VehicleFilterOption {
  label?: string;
  labelKey?: InventoryLabelKey;
  value: string;
}

export const MAKE_FILTER_OPTIONS: readonly VehicleFilterOption[] = [
  { labelKey: "allMakes", value: "all" },
  { label: "Maruti Suzuki", value: "Maruti Suzuki" },
  { label: "Hyundai", value: "Hyundai" },
  { label: "Honda", value: "Honda" },
  { label: "Toyota", value: "Toyota" },
  { label: "Kia", value: "Kia" },
];

export const FUEL_FILTER_OPTIONS: readonly VehicleFilterOption[] = [
  { labelKey: "allFuelTypes", value: "all" },
  { labelKey: "petrol", value: "Petrol" },
  { labelKey: "diesel", value: "Diesel" },
  { labelKey: "electric", value: "Electric" },
  { labelKey: "hybrid", value: "Hybrid" },
];

export const TRANSMISSION_FILTER_OPTIONS: readonly VehicleFilterOption[] = [
  { labelKey: "allTransmissions", value: "all" },
  { labelKey: "manual", value: "Manual" },
  { labelKey: "automatic", value: "Automatic" },
  { labelKey: "cvt", value: "CVT" },
];

const fuelTypeKeys: Record<string, InventoryLabelKey> = { diesel: "diesel", electric: "electric", hybrid: "hybrid", petrol: "petrol" };
const transmissionKeys: Record<string, InventoryLabelKey> = { automatic: "automatic", cvt: "cvt", manual: "manual" };
const bodyTypeKeys: Record<string, InventoryLabelKey> = { hatchback: "hatchback", sedan: "sedan", suv: "suv" };

export function formatVehiclePrice(amount: number | undefined, locale: string, fallback?: string): string | null {
  if (amount == null) return fallback ?? null;
  const localeName = locale === "hi" ? "hi-IN" : "en-IN";
  return new Intl.NumberFormat(localeName, { currency: "INR", maximumFractionDigits: 0, style: "currency" }).format(amount);
}

export function getVehicleOptionLabel(option: VehicleFilterOption, t: InventoryTranslator): string {
  return option.label ?? t(option.labelKey!);
}

export function localizeFuelType(value: string | undefined, t: InventoryTranslator): string | undefined {
  return localizeValue(value, fuelTypeKeys, t);
}

export function localizeTransmission(value: string | undefined, t: InventoryTranslator): string | undefined {
  return localizeValue(value, transmissionKeys, t);
}

export function localizeBodyType(value: string | undefined, t: InventoryTranslator): string | undefined {
  return localizeValue(value, bodyTypeKeys, t);
}

function localizeValue(value: string | undefined, map: Record<string, InventoryLabelKey>, t: InventoryTranslator): string | undefined {
  if (!value) return value;
  const key = map[value.toLowerCase()];
  return key ? t(key) : value;
}
