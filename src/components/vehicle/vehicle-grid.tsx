"use client";

import { useState } from "react";
import { Grid, List, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FUEL_FILTER_OPTIONS,
  MAKE_FILTER_OPTIONS,
  TRANSMISSION_FILTER_OPTIONS,
  getVehicleOptionLabel,
} from "@/lib/i18n/vehicle-display";
import { VehicleCard, VehicleCardSkeleton } from "./vehicle-card";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  variant?: string;
  color?: string;
  mileage?: number;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  location?: string;
}

interface VehicleListing {
  id: string;
  vehicle_id: string;
  status: string;
  target_selling_price?: number;
  highlights?: string;
}

interface VehicleMedia {
  listing_id: string;
  storage_path: string;
  is_blurred: boolean;
  display_order: number;
}

interface VehicleGridProps {
  vehicles: Vehicle[];
  listings: VehicleListing[];
  media: VehicleMedia[];
  isLoading?: boolean;
  onViewDetails?: (id: string) => void;
  onReserve?: (id: string) => void;
  onInquiry?: (id: string) => void;
  onPrimaryAction?: (id: string) => void;
  primaryActionLabel?: string;
  showPricing?: boolean;
}

interface VehicleGridFilters {
  fuelType: string;
  make: string;
  transmission: string;
}

const DEFAULT_FILTERS = { fuelType: "all", make: "all", transmission: "all" } as const;

export function VehicleGrid({
  vehicles,
  listings,
  media,
  isLoading,
  onViewDetails,
  onReserve,
  onInquiry,
  onPrimaryAction,
  primaryActionLabel,
  showPricing = false,
}: VehicleGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<VehicleGridFilters>({ ...DEFAULT_FILTERS });
  const [searchQuery, setSearchQuery] = useState("");
  const inventoryT = useTranslations("inventory");
  const makeOptions = MAKE_FILTER_OPTIONS.map((option) => ({ label: getVehicleOptionLabel(option, inventoryT), value: option.value }));
  const fuelOptions = FUEL_FILTER_OPTIONS.map((option) => ({ label: getVehicleOptionLabel(option, inventoryT), value: option.value }));
  const transmissionOptions = TRANSMISSION_FILTER_OPTIONS.map((option) => ({ label: getVehicleOptionLabel(option, inventoryT), value: option.value }));

  const getListing = (vehicleId: string) => listings.find((listing) => listing.vehicle_id === vehicleId);
  const getMedia = (listingId: string) => media.filter((item) => item.listing_id === listingId);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query || vehicle.make.toLowerCase().includes(query) || vehicle.model.toLowerCase().includes(query);
    const matchesMake = filters.make === DEFAULT_FILTERS.make || vehicle.make === filters.make;
    const matchesFuel = filters.fuelType === DEFAULT_FILTERS.fuelType || vehicle.fuel_type === filters.fuelType;
    const matchesTransmission = filters.transmission === DEFAULT_FILTERS.transmission || vehicle.transmission === filters.transmission;
    return matchesQuery && matchesMake && matchesFuel && matchesTransmission;
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <VehicleCardSkeleton count={6} />
      </div>
    );
  }

  const hasActiveFilters = [filters.make, filters.fuelType, filters.transmission].some((value) => value !== "all");
  const makeLabel = makeOptions.find((option) => option.value === filters.make)?.label ?? filters.make;
  const fuelLabel = fuelOptions.find((option) => option.value === filters.fuelType)?.label ?? filters.fuelType;
  const transmissionLabel = transmissionOptions.find((option) => option.value === filters.transmission)?.label ?? filters.transmission;

  return (
    <div className="space-y-6">
      <div className="shell-card flex flex-col gap-4 rounded-[28px] border p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={inventoryT("searchPlaceholder")} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <FilterSelect items={makeOptions} placeholder={inventoryT("make")} value={filters.make} onValueChange={(value) => setFilters((current) => ({ ...current, make: value }))} />
          <FilterSelect items={fuelOptions} placeholder={inventoryT("fuelType")} value={filters.fuelType} onValueChange={(value) => setFilters((current) => ({ ...current, fuelType: value }))} />
          <FilterSelect items={transmissionOptions} placeholder={inventoryT("transmission")} value={filters.transmission} onValueChange={(value) => setFilters((current) => ({ ...current, transmission: value }))} />

          <div className="flex rounded-xl border border-border/60 bg-background">
            <Button type="button" variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" aria-label={inventoryT("showGridView")} onClick={() => setViewMode("grid")}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button type="button" variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" aria-label={inventoryT("showListView")} onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="flex flex-wrap gap-2">
          {filters.make !== DEFAULT_FILTERS.make ? <FilterBadge clearLabel={inventoryT("clearFilter", { label: makeLabel })} label={makeLabel} onClear={() => setFilters((current) => ({ ...current, make: DEFAULT_FILTERS.make }))} /> : null}
          {filters.fuelType !== DEFAULT_FILTERS.fuelType ? <FilterBadge clearLabel={inventoryT("clearFilter", { label: fuelLabel })} label={fuelLabel} onClear={() => setFilters((current) => ({ ...current, fuelType: DEFAULT_FILTERS.fuelType }))} /> : null}
          {filters.transmission !== DEFAULT_FILTERS.transmission ? <FilterBadge clearLabel={inventoryT("clearFilter", { label: transmissionLabel })} label={transmissionLabel} onClear={() => setFilters((current) => ({ ...current, transmission: DEFAULT_FILTERS.transmission }))} /> : null}
          <Button type="button" variant="ghost" size="sm" onClick={() => setFilters({ ...DEFAULT_FILTERS })}>
            {inventoryT("clearAll")}
          </Button>
        </div>
      ) : null}

      <div className="text-sm text-muted-foreground">{inventoryT("vehiclesFound", { count: filteredVehicles.length })}</div>

      {filteredVehicles.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-border/60 bg-card/60 py-14 text-center">
          <p className="text-muted-foreground">{inventoryT("noVehicles")}</p>
          <Button
            type="button"
            variant="link"
            onClick={() => {
              setSearchQuery("");
              setFilters({ ...DEFAULT_FILTERS });
            }}
          >
            {inventoryT("resetSearch")}
          </Button>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
          {filteredVehicles.map((vehicle) => {
            const listing = getListing(vehicle.id);
            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                listing={listing}
                media={listing ? getMedia(listing.id) : []}
                onViewDetails={onViewDetails}
                onReserve={onReserve}
                onInquiry={onInquiry}
                onPrimaryAction={onPrimaryAction}
                primaryActionLabel={primaryActionLabel}
                showPricing={showPricing}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  items,
  placeholder,
  value,
  onValueChange,
}: {
  items: Array<{ label: string; value: string }>;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full sm:w-[160px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FilterBadge({ clearLabel, label, onClear }: { clearLabel: string; label: string; onClear: () => void }) {
  return (
    <Badge className="gap-2 px-3 py-1" variant="secondary">
      <span>{label}</span>
      <button type="button" onClick={onClear} aria-label={clearLabel}>
        x
      </button>
    </Badge>
  );
}
