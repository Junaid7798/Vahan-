"use client";

import { type ReactNode, useState } from "react";
import { useTranslations } from "next-intl";
import { FormSection, StickyFormFooter } from "@/components/forms/form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { SellerSubmissionInput, SellerSubmissionRecord } from "@/lib/demo/portal-types";
import { CompressedImageResult } from "@/lib/media/compress-image";
import { PhotoUploadField } from "@/modules/inventory/components/photo-upload-field";
import { getCityOptions, getMakeOptions, getModelOptions, getVariantOptions } from "@/lib/vehicle/form-options";

interface VehicleSubmissionFormProps {
  defaultSeller: { email: string; phone: string; sellerName: string };
  initialRecord?: SellerSubmissionRecord | null;
  isPending: boolean;
  locale: string;
  onCancel?: () => void;
  onSubmit: (payload: SellerSubmissionInput) => Promise<void> | void;
  submitLabel: string;
  title: string;
}

interface VehicleSubmissionState {
  askingPrice: string; description: string; email: string; location: string; make: string; mileage: string; model: string; phone: string; sellerName: string; variant: string; year: string;
}

const inputClassName = "h-11 rounded-2xl border-border/60 bg-background/80";
const textareaClassName = "min-h-28 rounded-[24px] border-border/60 bg-background/80";
const MIN_YEAR = 1990;

function toFormState(defaultSeller: VehicleSubmissionFormProps["defaultSeller"], record?: SellerSubmissionRecord | null): VehicleSubmissionState {
  return {
    askingPrice: record?.askingPrice?.toString() ?? "", description: record?.description ?? "", email: record?.email ?? defaultSeller.email, location: record?.location ?? "",
    make: record?.make ?? "", mileage: record?.mileage?.toString() ?? "", model: record?.model ?? "", phone: record?.phone ?? defaultSeller.phone,
    sellerName: record?.sellerName ?? defaultSeller.sellerName, variant: record?.variant ?? "", year: record?.year?.toString() ?? "",
  };
}

function toMediaState(record?: SellerSubmissionRecord | null): CompressedImageResult[] {
  return (record?.media ?? []).map((item) => ({ compressedSize: 0, dataUrl: item.storagePath, fileName: item.id, originalSize: 0 }));
}

function toOptionalNumber(value: string) {
  return value.trim() ? Number(value) : undefined;
}

export function VehicleSubmissionForm(props: VehicleSubmissionFormProps) {
  const t = useTranslations("submissionForm");
  const vehicleT = useTranslations("vehicle");
  const [form, setForm] = useState<VehicleSubmissionState>(toFormState(props.defaultSeller, props.initialRecord));
  const [media, setMedia] = useState<CompressedImageResult[]>(toMediaState(props.initialRecord));
  const modelOptions = getModelOptions(form.make);
  const variantOptions = getVariantOptions(form.make, form.model);

  async function handleSubmit() {
    if (!form.sellerName.trim() || !form.phone.trim() || !form.make.trim() || !form.model.trim() || !form.description.trim()) {
      toast({ title: t("missingRequiredTitle"), description: t("missingRequiredDescription"), variant: "destructive" });
      return;
    }

    const year = Number(form.year);
    if (!Number.isInteger(year) || year < MIN_YEAR || year > new Date().getFullYear() + 1) {
      toast({ title: t("invalidYearTitle"), description: t("invalidYearDescription"), variant: "destructive" });
      return;
    }

    await props.onSubmit({
      askingPrice: toOptionalNumber(form.askingPrice), description: form.description.trim(), email: form.email.trim() || undefined, location: form.location.trim() || undefined,
      make: form.make.trim(), media: media.map((item, index) => ({ displayOrder: index + 1, storagePath: item.dataUrl })), mileage: toOptionalNumber(form.mileage),
      model: form.model.trim(), phone: form.phone.trim(), sellerName: form.sellerName.trim(), variant: form.variant.trim() || undefined, year,
    });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">{props.title}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </header>

      <FormSection description={t("contactDescription")} title={t("contactTitle")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("sellerName")}><Input className={inputClassName} value={form.sellerName} onChange={(event) => setForm((current) => ({ ...current, sellerName: event.target.value }))} /></Field>
          <Field label={t("phone")}><Input className={inputClassName} inputMode="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></Field>
          <Field className="md:col-span-2" label={t("email")}><Input className={inputClassName} inputMode="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></Field>
        </div>
      </FormSection>

      <FormSection description={t("vehicleDescription")} title={t("vehicleTitle")}>
        <div className="grid gap-4 md:grid-cols-2">
          <SearchableSelect emptyLabel={t("noMakes")} label={vehicleT("make")} options={getMakeOptions()} placeholder={t("pickMake")} searchPlaceholder={t("searchMake")} value={form.make} onValueChange={(value) => setForm((current) => ({ ...current, make: value, model: "", variant: "" }))} />
          <SearchableSelect disabled={!form.make} emptyLabel={t("noModels")} label={vehicleT("model")} options={modelOptions} placeholder={t("pickModel")} searchPlaceholder={t("searchModel")} value={form.model} onValueChange={(value) => setForm((current) => ({ ...current, model: value, variant: "" }))} />
          <Field label={vehicleT("year")}><Input className={inputClassName} inputMode="numeric" value={form.year} onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))} /></Field>
          <SearchableSelect allowCustomValue disabled={!form.model} emptyLabel={t("noVariants")} label={vehicleT("variant")} options={variantOptions} placeholder={t("pickVariant")} searchPlaceholder={t("searchVariant")} value={form.variant} onValueChange={(value) => setForm((current) => ({ ...current, variant: value }))} />
          <SearchableSelect allowCustomValue emptyLabel={t("noCities")} label={vehicleT("location")} options={getCityOptions()} placeholder={t("pickLocation")} searchPlaceholder={t("searchLocation")} value={form.location} onValueChange={(value) => setForm((current) => ({ ...current, location: value }))} />
          <Field label={vehicleT("mileage")}><Input className={inputClassName} inputMode="numeric" value={form.mileage} onChange={(event) => setForm((current) => ({ ...current, mileage: event.target.value }))} /></Field>
          <Field className="md:col-span-2" label={t("askingPrice")}><Input className={inputClassName} inputMode="numeric" value={form.askingPrice} onChange={(event) => setForm((current) => ({ ...current, askingPrice: event.target.value }))} /></Field>
        </div>
      </FormSection>

      <FormSection description={t("notesDescription")} title={t("notesTitle")}>
        <Field label={t("vehicleNotes")}><Textarea className={textareaClassName} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></Field>
      </FormSection>

      <FormSection description={t("mediaDescription")} title={t("mediaTitle")}><PhotoUploadField value={media} onChange={setMedia} /></FormSection>

      <StickyFormFooter>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {props.onCancel ? <Button className="rounded-2xl" disabled={props.isPending} type="button" variant="outline" onClick={props.onCancel}>{t("cancel")}</Button> : null}
          <Button className="rounded-2xl" disabled={props.isPending} type="button" onClick={handleSubmit}>{props.isPending ? t("saving") : props.submitLabel}</Button>
        </div>
      </StickyFormFooter>
    </div>
  );
}

function Field({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return <div className={className ? className : ""}><Label className="mb-2 block">{label}</Label>{children}</div>;
}
