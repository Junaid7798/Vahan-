"use client";

import Image from "next/image";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { postPortalAction } from "@/lib/demo/portal-client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVehiclePrice, localizeBodyType, localizeFuelType, localizeTransmission } from "@/lib/i18n/vehicle-display";

interface VehicleDetailScreenProps {
  record: {
    listingId: string;
    make: string;
    model: string;
    year: number;
    variant?: string;
    color?: string;
    mileage?: number;
    fuelType?: string;
    transmission?: string;
    bodyType?: string;
    registrationYear?: number;
    location?: string;
    vin?: string;
    status: string;
    highlights?: string;
    conditionNotes?: string;
    targetSellingPrice?: number;
    procurementPrice?: number;
    extraSpend?: number;
    maintenanceCost?: number;
    documentationCost?: number;
    transportCost?: number;
    otherCost?: number;
    media: Array<{ previewUrl?: string; storagePath: string }>;
  };
  showFinancials: boolean;
}

export function VehicleDetailScreen({ record, showFinancials }: VehicleDetailScreenProps) {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const inventoryT = useTranslations("inventory");
  const offlineT = useTranslations("offline");
  const statusT = useTranslations("status");
  const fuelTypeLabel = localizeFuelType(record.fuelType, inventoryT);
  const transmissionLabel = localizeTransmission(record.transmission, inventoryT);
  const bodyTypeLabel = localizeBodyType(record.bodyType, inventoryT);
  const totalCost =
    (record.procurementPrice ?? 0) +
    (record.extraSpend ?? 0) +
    (record.maintenanceCost ?? 0) +
    (record.documentationCost ?? 0) +
    (record.transportCost ?? 0) +
    (record.otherCost ?? 0);

  function formatStatus(status: string) {
    return status === "published" ? inventoryT("availableStatus") : statusT(status as "archived" | "draft" | "reserved" | "sold");
  }

  function getPrimaryActionLabel(status: string) {
    if (status === "sold") return inventoryT("requestResale");
    if (status === "reserved") return inventoryT("joinWaitlist");
    return inventoryT("reserveInterest");
  }

  function runAction(action: "create_chat_thread" | "create_inquiry" | "create_resale" | "create_reservation") {
    startTransition(async () => {
      try {
        if (action === "create_chat_thread") {
          await postPortalAction("create_chat_thread", { listingId: record.listingId, threadType: "vehicle", title: `${record.year} ${record.make} ${record.model}` });
          router.push(showFinancials ? "/app/admin/chat" : "/app/chat");
          router.refresh();
          return;
        }

        if (action === "create_inquiry") {
          const result = await postPortalAction("create_inquiry", {
            listingId: record.listingId,
            message: inventoryT("followUpPrompt"),
            preferredContactMethod: "chat",
            subject: inventoryT("detailInquirySubject", { vehicle: `${record.make} ${record.model}` }),
          });
          toast({
            title: result.queued ? offlineT("queuedTitle") : inventoryT("inquirySentTitle"),
            description: result.queued ? offlineT("queuedDescription") : inventoryT("inquirySentDescription"),
          });
          if (result.queued) {
            return;
          }
        }

        if (action === "create_reservation") {
          const result = await postPortalAction("create_reservation", { listingId: record.listingId, message: inventoryT("detailReservationPrompt") });
          toast({
            title: result.queued ? offlineT("queuedTitle") : inventoryT("requestCapturedTitle"),
            description: result.queued ? offlineT("queuedDescription") : inventoryT("requestCapturedDescription"),
          });
          if (result.queued) {
            return;
          }
        }

        if (action === "create_resale") {
          const result = await postPortalAction("create_resale", { expectedTimeline: "flexible", listingId: record.listingId });
          toast({
            title: result.queued ? offlineT("queuedTitle") : inventoryT("resaleSentTitle"),
            description: result.queued ? offlineT("queuedDescription") : inventoryT("resaleSentDescription"),
          });
          if (result.queued) {
            return;
          }
        }

        router.refresh();
      } catch (error) {
        toast({ title: inventoryT("actionFailedTitle"), description: error instanceof Error ? error.message : inventoryT("actionFailedDescription"), variant: "destructive" });
      }
    });
  }

  const primaryAction = record.status === "sold" ? "create_resale" : "create_reservation";

  return (
    <div className="space-y-6">
      <Button type="button" variant="ghost" onClick={() => router.back()}>
        {inventoryT("backToList")}
      </Button>

      <div className="grid gap-8 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-border/60 bg-muted shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <Image alt={`${record.make} ${record.model}`} fill src={record.media[0]?.previewUrl ?? record.media[0]?.storagePath ?? "/placeholder-car.svg"} className="object-cover" unoptimized />
          </div>
          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>{inventoryT("vehicleStory")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{record.highlights ?? inventoryT("vehicleStoryFallback")}</p>
              <p>{record.conditionNotes ?? inventoryT("conditionFallback")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-3">
                <Badge>{formatStatus(record.status)}</Badge>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">{record.make} {record.model}</h1>
                  <p className="text-sm text-muted-foreground">{record.year} {record.variant}</p>
                </div>
                <p className="text-xl font-semibold text-primary">
                  {showFinancials ? formatVehiclePrice(record.targetSellingPrice, locale, inventoryT("notDisclosed")) : inventoryT("requestPrice")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <Spec label={inventoryT("colorLabel")} value={record.color} />
                <Spec label={inventoryT("mileageLabel")} value={record.mileage != null ? `${record.mileage.toLocaleString("en-IN")} km` : undefined} />
                <Spec label={inventoryT("fuelLabel")} value={fuelTypeLabel} />
                <Spec label={inventoryT("transmissionLabel")} value={transmissionLabel} />
                <Spec label={inventoryT("bodyLabel")} value={bodyTypeLabel} />
                <Spec label={inventoryT("locationLabel")} value={record.location} />
                <Spec label={inventoryT("registrationLabel")} value={record.registrationYear?.toString()} />
                <Spec label={inventoryT("vinLabel")} value={showFinancials ? record.vin : undefined} />
              </div>

              <div className="grid gap-3">
                <Button disabled={isPending} type="button" onClick={() => runAction(primaryAction)}>
                  {isPending ? inventoryT("working") : getPrimaryActionLabel(record.status)}
                </Button>
                <Button disabled={isPending} type="button" variant="outline" onClick={() => runAction("create_inquiry")}>
                  {inventoryT("sendInquiry")}
                </Button>
                <Button disabled={isPending} type="button" variant="secondary" onClick={() => runAction("create_chat_thread")}>
                  {inventoryT("openChat")}
                </Button>
                {showFinancials ? (
                  <Button type="button" variant="ghost" onClick={() => router.push(`/app/admin/vehicles/${record.listingId}/edit`)}>
                    {inventoryT("editListing")}
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {showFinancials ? (
            <Card className="border-border/60 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>{inventoryT("financials")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <FinancialRow label={inventoryT("procurement")} value={formatVehiclePrice(record.procurementPrice, locale, inventoryT("notDisclosed"))!} />
                <FinancialRow label={inventoryT("extraSpend")} value={formatVehiclePrice(record.extraSpend, locale, inventoryT("notDisclosed"))!} />
                <FinancialRow label={inventoryT("maintenance")} value={formatVehiclePrice(record.maintenanceCost, locale, inventoryT("notDisclosed"))!} />
                <FinancialRow label={inventoryT("documentation")} value={formatVehiclePrice(record.documentationCost, locale, inventoryT("notDisclosed"))!} />
                <FinancialRow label={inventoryT("transport")} value={formatVehiclePrice(record.transportCost, locale, inventoryT("notDisclosed"))!} />
                <FinancialRow label={inventoryT("other")} value={formatVehiclePrice(record.otherCost, locale, inventoryT("notDisclosed"))!} />
                <FinancialRow label={inventoryT("totalCost")} value={formatVehiclePrice(totalCost, locale, inventoryT("notDisclosed"))!} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background px-3 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value ?? "-"}</p>
    </div>
  );
}

function FinancialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
