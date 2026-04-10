"use client";

import { type ReactNode, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { FormSection, StickyFormFooter } from "@/components/forms/form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { VehicleRecord } from "@/lib/demo/portal-types";
import { CompressedImageResult } from "@/lib/media/compress-image";
import { PhotoUploadField } from "@/modules/inventory/components/photo-upload-field";
import { bodyTypeOptions, fuelTypeOptions, getCityOptions, getMakeOptions, getModelOptions, getVariantOptions, isVehicleStatus, listingStatusOptions, transmissionOptions } from "@/lib/vehicle/form-options";

interface VehicleFormProps {
  initialRecord?: VehicleRecord | null;
  mode: "create" | "edit";
  showFinancials: boolean;
}

interface VehicleFormState {
  bodyType: string; color: string; conditionNotes: string; documentationCost: string; extraSpend: string; fuelType: string; highlights: string; internalNotes: string;
  location: string; maintenanceCost: string; make: string; mileage: string; model: string; otherCost: string; procurementPrice: string; registrationYear: string;
  status: VehicleRecord["status"]; targetSellingPrice: string; transmission: string; transportCost: string; variant: string; vin: string; year: string;
}

const inputClassName = "h-11 rounded-2xl border-border/60 bg-background/80";
const textareaClassName = "min-h-28 rounded-[24px] border-border/60 bg-background/80";

function toState(record?: VehicleRecord | null): VehicleFormState {
  return {
    bodyType: record?.bodyType ?? "", color: record?.color ?? "", conditionNotes: record?.conditionNotes ?? "", documentationCost: record?.documentationCost?.toString() ?? "",
    extraSpend: record?.extraSpend?.toString() ?? "", fuelType: record?.fuelType ?? "", highlights: record?.highlights ?? "", internalNotes: record?.internalNotes ?? "",
    location: record?.location ?? "", maintenanceCost: record?.maintenanceCost?.toString() ?? "", make: record?.make ?? "", mileage: record?.mileage?.toString() ?? "",
    model: record?.model ?? "", otherCost: record?.otherCost?.toString() ?? "", procurementPrice: record?.procurementPrice?.toString() ?? "", registrationYear: record?.registrationYear?.toString() ?? "",
    status: record?.status ?? "draft", targetSellingPrice: record?.targetSellingPrice?.toString() ?? "", transmission: record?.transmission ?? "", transportCost: record?.transportCost?.toString() ?? "",
    variant: record?.variant ?? "", vin: record?.vin ?? "", year: record?.year?.toString() ?? "",
  };
}

function toMedia(record?: VehicleRecord | null): CompressedImageResult[] {
  return (record?.media ?? []).map((item) => ({
    compressedSize: 0,
    blurredStoragePath: item.blurredStoragePath,
    dataUrl: item.previewUrl ?? item.storagePath,
    fileName: item.id,
    originalSize: 0,
    originalStoragePath: item.originalStoragePath,
    storagePath: item.storagePath,
  }));
}

function toNumber(value: string) {
  return value.trim() ? Number(value) : undefined;
}

export function VehicleForm({ initialRecord, mode, showFinancials }: VehicleFormProps) {
  const router = useRouter();
  const t = useTranslations("vehicleForm");
  const statusT = useTranslations("status");
  const vehicleT = useTranslations("vehicle");
  const [form, setForm] = useState<VehicleFormState>(toState(initialRecord));
  const [media, setMedia] = useState<CompressedImageResult[]>(toMedia(initialRecord));
  const [isSaving, setIsSaving] = useState(false);
  const modelOptions = getModelOptions(form.make);
  const variantOptions = getVariantOptions(form.make, form.model);

  function update<K extends keyof VehicleFormState>(key: K, value: VehicleFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    if (!form.make || !form.model || !form.year) {
      toast({ title: t("missingRequiredTitle"), description: t("missingRequiredDescription") });
      return;
    }

    setIsSaving(true);
    const basePath = process.env.NEXT_PUBLIC_SUPABASE_URL ? "/api/vehicles" : "/api/demo/vehicles";
    const response = await fetch(mode === "create" ? basePath : `${basePath}/${initialRecord?.listingId}`, {
      body: JSON.stringify({
        bodyType: form.bodyType, color: form.color, conditionNotes: form.conditionNotes, documentationCost: toNumber(form.documentationCost), extraSpend: toNumber(form.extraSpend),
        fuelType: form.fuelType, highlights: form.highlights, internalNotes: form.internalNotes, location: form.location, maintenanceCost: toNumber(form.maintenanceCost), make: form.make,
        media: media.map((item, index) => ({
          blurredStoragePath: item.blurredStoragePath,
          displayOrder: index + 1,
          originalStoragePath: item.originalStoragePath,
          storagePath: item.storagePath ?? item.dataUrl,
        })), mileage: toNumber(form.mileage), model: form.model, otherCost: toNumber(form.otherCost),
        procurementPrice: toNumber(form.procurementPrice), registrationYear: toNumber(form.registrationYear), status: form.status, targetSellingPrice: toNumber(form.targetSellingPrice),
        transmission: form.transmission, transportCost: toNumber(form.transportCost), variant: form.variant, vin: form.vin, year: Number(form.year),
      }),
      headers: { "Content-Type": "application/json" },
      method: mode === "create" ? "POST" : "PUT",
    });
    setIsSaving(false);

    if (!response.ok) {
      toast({ title: t("saveFailedTitle"), description: t("saveFailedDescription"), variant: "destructive" });
      return;
    }

    toast({ title: mode === "create" ? t("createdTitle") : t("updatedTitle"), description: mode === "create" ? t("createdDescription") : t("updatedDescription") });
    router.push("/app/admin/vehicles");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{t("eyebrow")}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{mode === "create" ? t("createTitle") : t("editTitle")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{mode === "create" ? t("createDescription") : t("editDescription")}</p>
      </header>

      <FormSection description={t("basicsDescription")} title={t("basicsTitle")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Select value={form.status} onValueChange={(value) => isVehicleStatus(value) && update("status", value)}><SelectTrigger className={inputClassName}><SelectValue placeholder={t("status")} /></SelectTrigger><SelectContent>{listingStatusOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.value === "published" ? statusT("available") : statusT(item.value as "archived" | "draft" | "reserved" | "sold")}</SelectItem>)}</SelectContent></Select>
          <SearchableSelect emptyLabel={t("noMakes")} label={vehicleT("make")} options={getMakeOptions()} placeholder={t("pickMake")} searchPlaceholder={t("searchMake")} value={form.make} onValueChange={(value) => setForm((current) => ({ ...current, make: value, model: "", variant: "" }))} />
          <SearchableSelect disabled={!form.make} emptyLabel={t("noModels")} label={vehicleT("model")} options={modelOptions} placeholder={t("pickModel")} searchPlaceholder={t("searchModel")} value={form.model} onValueChange={(value) => setForm((current) => ({ ...current, model: value, variant: "" }))} />
          <SearchableSelect allowCustomValue disabled={!form.model} emptyLabel={t("noVariants")} label={vehicleT("variant")} options={variantOptions} placeholder={t("pickVariant")} searchPlaceholder={t("searchVariant")} value={form.variant} onValueChange={(value) => update("variant", value)} />
          <Field label={vehicleT("year")}><Input className={inputClassName} inputMode="numeric" value={form.year} onChange={(event) => update("year", event.target.value)} /></Field>
          <Field label={vehicleT("color")}><Input className={inputClassName} value={form.color} onChange={(event) => update("color", event.target.value)} /></Field>
        </div>
      </FormSection>

      <FormSection description={t("specsDescription")} title={t("specsTitle")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={vehicleT("mileage")}><Input className={inputClassName} inputMode="numeric" value={form.mileage} onChange={(event) => update("mileage", event.target.value)} /></Field>
          <Field label={t("registrationYear")}><Input className={inputClassName} inputMode="numeric" value={form.registrationYear} onChange={(event) => update("registrationYear", event.target.value)} /></Field>
          <SimpleSelect label={vehicleT("fuelType")} options={fuelTypeOptions} value={form.fuelType} onValueChange={(value) => update("fuelType", value)} />
          <SimpleSelect label={vehicleT("transmission")} options={transmissionOptions} value={form.transmission} onValueChange={(value) => update("transmission", value)} />
          <SimpleSelect label={vehicleT("bodyType")} options={bodyTypeOptions} value={form.bodyType} onValueChange={(value) => update("bodyType", value)} />
          <SearchableSelect allowCustomValue emptyLabel={t("noCities")} label={vehicleT("location")} options={getCityOptions()} placeholder={t("pickLocation")} searchPlaceholder={t("searchLocation")} value={form.location} onValueChange={(value) => update("location", value)} />
          <Field className="md:col-span-2" label={t("vin")}><Input className={inputClassName} value={form.vin} onChange={(event) => update("vin", event.target.value)} /></Field>
        </div>
      </FormSection>

      <FormSection description={t("notesDescription")} title={t("notesTitle")}>
        <div className="grid gap-4">
          <Field label={t("highlights")}><Textarea className={textareaClassName} value={form.highlights} onChange={(event) => update("highlights", event.target.value)} /></Field>
          <Field label={t("conditionNotes")}><Textarea className={textareaClassName} value={form.conditionNotes} onChange={(event) => update("conditionNotes", event.target.value)} /></Field>
          <Field label={t("internalNotes")}><Textarea className={textareaClassName} value={form.internalNotes} onChange={(event) => update("internalNotes", event.target.value)} /></Field>
        </div>
      </FormSection>

      <FormSection description={t("mediaDescription")} title={t("mediaTitle")}><PhotoUploadField value={media} onChange={setMedia} /></FormSection>

      {showFinancials ? (
        <FormSection description={t("financialDescription")} title={t("financialTitle")}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("procurementPrice")}><Input className={inputClassName} inputMode="numeric" value={form.procurementPrice} onChange={(event) => update("procurementPrice", event.target.value)} /></Field>
            <Field label={t("targetSellingPrice")}><Input className={inputClassName} inputMode="numeric" value={form.targetSellingPrice} onChange={(event) => update("targetSellingPrice", event.target.value)} /></Field>
            <Field label={t("extraSpend")}><Input className={inputClassName} inputMode="numeric" value={form.extraSpend} onChange={(event) => update("extraSpend", event.target.value)} /></Field>
            <Field label={t("maintenanceCost")}><Input className={inputClassName} inputMode="numeric" value={form.maintenanceCost} onChange={(event) => update("maintenanceCost", event.target.value)} /></Field>
            <Field label={t("documentationCost")}><Input className={inputClassName} inputMode="numeric" value={form.documentationCost} onChange={(event) => update("documentationCost", event.target.value)} /></Field>
            <Field label={t("transportCost")}><Input className={inputClassName} inputMode="numeric" value={form.transportCost} onChange={(event) => update("transportCost", event.target.value)} /></Field>
            <Field className="md:col-span-2" label={t("otherCost")}><Input className={inputClassName} inputMode="numeric" value={form.otherCost} onChange={(event) => update("otherCost", event.target.value)} /></Field>
          </div>
        </FormSection>
      ) : null}

      <StickyFormFooter>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button className="rounded-2xl" type="button" variant="outline" onClick={() => router.push("/app/admin/vehicles")}>{t("cancel")}</Button>
          <Button className="rounded-2xl" disabled={isSaving} type="button" onClick={submit}>{isSaving ? t("saving") : mode === "create" ? t("saveCreate") : t("saveEdit")}</Button>
        </div>
      </StickyFormFooter>
    </div>
  );
}

function Field({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return <div className={className ? className : ""}><Label className="mb-2 block">{label}</Label>{children}</div>;
}

function SimpleSelect({ label, options, value, onValueChange }: { label: string; onValueChange: (value: string) => void; options: readonly { label: string; value: string }[]; value: string }) {
  return <Field label={label}><Select value={value} onValueChange={onValueChange}><SelectTrigger className={inputClassName}><SelectValue placeholder={label} /></SelectTrigger><SelectContent>{options.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></Field>;
}
