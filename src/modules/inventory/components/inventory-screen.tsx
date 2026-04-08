"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { VehicleGrid } from "@/components/vehicle/vehicle-grid";
import { toast } from "@/hooks/use-toast";
import { postPortalAction } from "@/lib/demo/portal-client";

interface InventoryScreenProps {
  description: string;
  title: string;
  vehicles: Array<Record<string, string | number | undefined>>;
  listings: Array<Record<string, string | number | undefined>>;
  media: Array<Record<string, string | number | boolean | undefined>>;
  primaryActionLabel?: string;
  showPricing?: boolean;
}

export function InventoryScreen({
  title,
  description,
  vehicles,
  listings,
  media,
  primaryActionLabel,
  showPricing = false,
}: InventoryScreenProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inventoryT = useTranslations("inventory");

  function runAction(action: "create_inquiry" | "create_resale" | "create_reservation", listingId: string) {
    startTransition(async () => {
      try {
        if (action === "create_inquiry") {
          await postPortalAction("create_inquiry", {
            listingId,
            message: inventoryT("followUpPrompt"),
            preferredContactMethod: "chat",
            subject: inventoryT("inquirySubject", { listingId }),
          });
          toast({ title: inventoryT("inquirySentTitle"), description: inventoryT("inquirySentDescription") });
        }

        if (action === "create_reservation") {
          await postPortalAction("create_reservation", { listingId, message: inventoryT("reservationPrompt") });
          toast({ title: inventoryT("requestCapturedTitle"), description: inventoryT("requestCapturedDescription") });
        }

        if (action === "create_resale") {
          await postPortalAction("create_resale", { expectedTimeline: "flexible", listingId });
          toast({ title: inventoryT("resaleSentTitle"), description: inventoryT("resaleSentDescription") });
        }

        router.refresh();
      } catch (error) {
        toast({
          title: inventoryT("actionFailedTitle"),
          description: error instanceof Error ? error.message : inventoryT("actionFailedDescription"),
          variant: "destructive",
        });
      }
    });
  }

  const primaryAction = primaryActionLabel === inventoryT("requestResale") ? "create_resale" : "create_reservation";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{inventoryT("eyebrow")}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>

      <VehicleGrid
        vehicles={vehicles as never[]}
        listings={listings as never[]}
        media={media as never[]}
        onViewDetails={(vehicleId) => {
          const listing = listings.find((item) => item.vehicle_id === vehicleId);
          if (listing?.id) {
            router.push(`/app/vehicles/${listing.id}`);
          }
        }}
        onInquiry={(listingId) => runAction("create_inquiry", listingId)}
        onPrimaryAction={(listingId) => runAction(primaryAction, listingId)}
        primaryActionLabel={isPending ? inventoryT("working") : primaryActionLabel}
        showPricing={showPricing}
      />
    </div>
  );
}
