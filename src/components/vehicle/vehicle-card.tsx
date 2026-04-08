"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useState } from "react";
import { Car, Fuel, Gauge, Heart, MapPin, MessageCircle, Share2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { formatVehiclePrice, localizeFuelType, localizeTransmission } from "@/lib/i18n/vehicle-display";

interface VehicleCardProps {
  vehicle: {
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
  };
  listing?: {
    id: string;
    status: string;
    target_selling_price?: number;
    highlights?: string;
    is_blurred?: boolean;
  };
  media?: Array<{
    storage_path: string;
    is_blurred: boolean;
    display_order: number;
  }>;
  onViewDetails?: (id: string) => void;
  onReserve?: (id: string) => void;
  onInquiry?: (id: string) => void;
  onPrimaryAction?: (id: string) => void;
  primaryActionLabel?: string;
  showPricing?: boolean;
}

const statusColors: Record<string, string> = {
  archived: "bg-slate-500",
  draft: "bg-gray-500",
  published: "bg-green-500",
  reserved: "bg-yellow-500",
  sold: "bg-red-500",
};

function formatImageSrc(path?: string): string {
  if (!path) return "/placeholder-car.svg";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }
  return `/${path}`;
}

function readSavedState(listingId?: string): boolean {
  if (!listingId || typeof window === "undefined") return false;
  return window.localStorage.getItem(`saved-${listingId}`) === "true";
}

export function VehicleCard({
  vehicle,
  listing,
  media,
  onViewDetails,
  onReserve,
  onInquiry,
  onPrimaryAction,
  primaryActionLabel,
  showPricing = false,
}: VehicleCardProps) {
  const imageUrl = formatImageSrc(media?.[0]?.storage_path);
  const isBlurred = Boolean(listing?.is_blurred || media?.[0]?.is_blurred);
  const hasMileage = vehicle.mileage != null;
  const primaryAction = onPrimaryAction ?? onReserve;
  const canInquire = Boolean(onInquiry && listing && ["published", "reserved", "sold"].includes(listing.status));
  const [savedOverrides, setSavedOverrides] = useState<Record<string, boolean>>({});
  const isSaved = listing ? savedOverrides[listing.id] ?? readSavedState(listing.id) : false;
  const inventoryT = useTranslations("inventory");
  const statusT = useTranslations("status");
  const locale = useLocale();
  const formattedPrice = showPricing ? formatVehiclePrice(listing?.target_selling_price, locale) : null;
  const fuelTypeLabel = localizeFuelType(vehicle.fuel_type, inventoryT);
  const transmissionLabel = localizeTransmission(vehicle.transmission, inventoryT);

  function formatStatus(status?: string): string {
    if (!status) return statusT("draft");
    return status === "published" ? inventoryT("availableStatus") : statusT(status as "archived" | "draft" | "reserved" | "sold");
  }

  function getActionLabel(status?: string) {
    if (primaryActionLabel) return primaryActionLabel;
    if (status === "sold") return inventoryT("requestResale");
    if (status === "reserved") return inventoryT("joinWaitlist");
    return inventoryT("reserveInterest");
  }

  function toggleSaved() {
    if (!listing) return;
    const nextValue = !isSaved;
    setSavedOverrides((current) => ({ ...current, [listing.id]: nextValue }));
    window.localStorage.setItem(`saved-${listing.id}`, String(nextValue));
    toast({
      title: nextValue ? inventoryT("savedTitle") : inventoryT("removedTitle"),
      description: nextValue
        ? inventoryT("savedDescription", { vehicle: `${vehicle.make} ${vehicle.model}` })
        : inventoryT("removedDescription", { vehicle: `${vehicle.make} ${vehicle.model}` }),
    });
  }

  async function shareVehicle() {
    if (!listing) return;
    const url = `${window.location.origin}/${locale}/app/vehicles/${listing.id}`;

    if (navigator.share) {
      await navigator.share({ title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, url });
      return;
    }

    await navigator.clipboard.writeText(url);
    toast({ title: inventoryT("linkCopiedTitle"), description: inventoryT("linkCopiedDescription") });
  }

  return (
    <Card className="overflow-hidden rounded-[28px] border border-border/60 bg-card/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="relative aspect-video bg-muted">
        <Image src={imageUrl} alt={`${vehicle.make} ${vehicle.model}`} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className={`object-cover ${isBlurred ? "blur-md" : ""}`} />
        {listing?.status ? <Badge className={`absolute left-3 top-3 ${statusColors[listing.status] ?? statusColors.draft} text-white`}>{formatStatus(listing.status)}</Badge> : null}
        <div className="absolute right-3 top-3 flex gap-2">
          <Button type="button" variant="secondary" size="icon" className="h-9 w-9 rounded-full" aria-label={inventoryT("saveVehicle")} onClick={toggleSaved}>
            <Heart className={`h-4 w-4 ${isSaved ? "fill-current text-red-500" : ""}`} />
          </Button>
          <Button type="button" variant="secondary" size="icon" className="h-9 w-9 rounded-full" aria-label={inventoryT("shareVehicle")} onClick={() => void shareVehicle()}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardHeader className="space-y-3 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold tracking-tight">{vehicle.make} {vehicle.model}</h3>
            <p className="truncate text-sm text-muted-foreground">{vehicle.year} {vehicle.variant}</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold text-primary">{formattedPrice ?? inventoryT("requestPrice")}</p>
            {!showPricing ? <p className="text-xs text-muted-foreground">{inventoryT("priceAfterInquiry")}</p> : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-2">
        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          {vehicle.location ? <Spec icon={<MapPin className="h-3 w-3 shrink-0" />} value={vehicle.location} /> : null}
          {hasMileage ? <Spec icon={<Gauge className="h-3 w-3 shrink-0" />} value={`${vehicle.mileage?.toLocaleString("en-IN")} km`} /> : null}
          {fuelTypeLabel ? <Spec icon={<Fuel className="h-3 w-3 shrink-0" />} value={fuelTypeLabel} /> : null}
          {transmissionLabel ? <Spec icon={<Car className="h-3 w-3 shrink-0" />} value={transmissionLabel} /> : null}
        </div>

        {listing?.highlights ? <p className="line-clamp-2 text-xs text-muted-foreground">{listing.highlights}</p> : null}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => onViewDetails?.(vehicle.id)}>
          {inventoryT("viewDetails")}
        </Button>
        {listing && primaryAction ? <Button type="button" size="sm" className="flex-1" onClick={() => primaryAction(listing.id)}>{getActionLabel(listing.status)}</Button> : null}
        {canInquire ? (
          <Button type="button" size="sm" variant="secondary" className="flex-1" onClick={() => onInquiry?.(listing!.id)}>
            <MessageCircle className="mr-2 h-4 w-4" />
            {inventoryT("inquire")}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}

function Spec({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-background px-3 py-2">
      {icon}
      <span className="truncate">{value}</span>
    </div>
  );
}

interface VehicleCardSkeletonProps {
  count?: number;
}

export function VehicleCardSkeleton({ count = 1 }: VehicleCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden rounded-[28px] border border-border/60 bg-card/90">
          <div className="aspect-video animate-pulse bg-muted" />
          <CardHeader className="space-y-3 pb-2">
            <div className="h-6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-2 pb-2">
            <div className="h-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </CardContent>
          <CardFooter>
            <div className="h-8 w-full animate-pulse rounded bg-muted" />
          </CardFooter>
        </Card>
      ))}
    </>
  );
}
