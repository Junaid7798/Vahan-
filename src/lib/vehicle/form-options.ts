import { VehicleRecord } from "@/lib/demo/portal-types";

export interface SearchOption {
  description?: string;
  keywords?: readonly string[];
  label: string;
  value: string;
}

const makeCatalog = [
  { label: "Honda", models: [{ label: "City", variants: ["VX", "ZX"] }, { label: "Jazz", variants: ["V", "VX"] }, { label: "Amaze", variants: ["S", "VX"] }] },
  { label: "Hyundai", models: [{ label: "Creta", variants: ["SX", "SX(O)"] }, { label: "i20", variants: ["Sportz", "Asta"] }, { label: "Verna", variants: ["SX", "SX Turbo"] }] },
  { label: "Maruti Suzuki", models: [{ label: "Swift", variants: ["VXI", "ZXI"] }, { label: "Baleno", variants: ["Zeta", "Alpha"] }, { label: "Brezza", variants: ["VXI", "ZXI"] }] },
  { label: "Toyota", models: [{ label: "Glanza", variants: ["G", "V"] }, { label: "Innova Crysta", variants: ["GX", "VX"] }] },
  { label: "Kia", models: [{ label: "Seltos", variants: ["HTK+", "HTX"] }, { label: "Sonet", variants: ["HTX", "GTX+"] }] },
] as const;

const cityOptions = ["Mumbai", "Pune", "Delhi", "Bengaluru", "Nashik", "Nagpur", "Ahmedabad", "Jaipur"];

export const fuelTypeOptions: readonly SearchOption[] = ["Petrol", "Diesel", "Electric", "Hybrid"].map((value) => ({ label: value, value }));
export const transmissionOptions: readonly SearchOption[] = ["Manual", "Automatic", "CVT"].map((value) => ({ label: value, value }));
export const bodyTypeOptions: readonly SearchOption[] = ["Hatchback", "Sedan", "SUV"].map((value) => ({ label: value, value }));
export const listingStatusOptions: readonly SearchOption[] = [
  { label: "Draft", value: "draft" },
  { label: "Available", value: "published" },
  { label: "Reserved", value: "reserved" },
  { label: "Sold", value: "sold" },
  { label: "Archived", value: "archived" },
];

export function getMakeOptions(): SearchOption[] {
  return makeCatalog.map((make) => ({
    description: `${make.models.length} suggested models`,
    keywords: make.models.flatMap((model) => [model.label, ...model.variants]),
    label: make.label,
    value: make.label,
  }));
}

export function getModelOptions(make: string): SearchOption[] {
  const match = makeCatalog.find((item) => item.label.toLowerCase() === make.trim().toLowerCase());
  return (match?.models ?? []).map((model) => ({
    description: model.variants.join(" • "),
    keywords: model.variants,
    label: model.label,
    value: model.label,
  }));
}

export function getVariantOptions(make: string, model: string): SearchOption[] {
  const makeMatch = makeCatalog.find((item) => item.label.toLowerCase() === make.trim().toLowerCase());
  const modelMatch = makeMatch?.models.find((item) => item.label.toLowerCase() === model.trim().toLowerCase());
  return (modelMatch?.variants ?? []).map((variant) => ({ label: variant, value: variant }));
}

export function getCityOptions(): SearchOption[] {
  return cityOptions.map((city) => ({ label: city, value: city }));
}

export function isVehicleStatus(value: string): value is VehicleRecord["status"] {
  return ["draft", "published", "reserved", "sold", "archived"].includes(value);
}
