"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { SellerSubmissionInput, SellerSubmissionRecord } from "@/lib/demo/portal-types";
import { CompressedImageResult } from "@/lib/media/compress-image";
import { PhotoUploadField } from "@/modules/inventory/components/photo-upload-field";

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
  askingPrice: string;
  description: string;
  email: string;
  location: string;
  make: string;
  mileage: string;
  model: string;
  phone: string;
  sellerName: string;
  variant: string;
  year: string;
}

const MIN_YEAR = 1990;

function toFormState(defaultSeller: VehicleSubmissionFormProps["defaultSeller"], record?: SellerSubmissionRecord | null): VehicleSubmissionState {
  return {
    askingPrice: record?.askingPrice?.toString() ?? "",
    description: record?.description ?? "",
    email: record?.email ?? defaultSeller.email,
    location: record?.location ?? "",
    make: record?.make ?? "",
    mileage: record?.mileage?.toString() ?? "",
    model: record?.model ?? "",
    phone: record?.phone ?? defaultSeller.phone,
    sellerName: record?.sellerName ?? defaultSeller.sellerName,
    variant: record?.variant ?? "",
    year: record?.year?.toString() ?? "",
  };
}

function toMediaState(record?: SellerSubmissionRecord | null): CompressedImageResult[] {
  return (record?.media ?? []).map((item) => ({
    compressedSize: 0,
    dataUrl: item.storagePath,
    fileName: item.id,
    originalSize: 0,
  }));
}

function toOptionalNumber(value: string) {
  return value.trim() ? Number(value) : undefined;
}

export function VehicleSubmissionForm(props: VehicleSubmissionFormProps) {
  const [form, setForm] = useState<VehicleSubmissionState>(toFormState(props.defaultSeller, props.initialRecord));
  const [media, setMedia] = useState<CompressedImageResult[]>(toMediaState(props.initialRecord));
  const labels = props.locale === "hi"
    ? { contact: "संपर्क जानकारी", details: "वाहन जानकारी", submitError: "कृपया सभी आवश्यक फ़ील्ड भरें।", yearError: "कृपया सही वर्ष दर्ज करें।" }
    : { contact: "Contact details", details: "Vehicle details", submitError: "Fill in the required fields before saving.", yearError: "Enter a valid vehicle year." };

  async function handleSubmit() {
    if (!form.sellerName.trim() || !form.phone.trim() || !form.make.trim() || !form.model.trim() || !form.description.trim()) {
      toast({ title: labels.submitError, variant: "destructive" });
      return;
    }

    const year = Number(form.year);
    if (!Number.isInteger(year) || year < MIN_YEAR || year > new Date().getFullYear() + 1) {
      toast({ title: labels.yearError, variant: "destructive" });
      return;
    }

    await props.onSubmit({
      askingPrice: toOptionalNumber(form.askingPrice),
      description: form.description.trim(),
      email: form.email.trim() || undefined,
      location: form.location.trim() || undefined,
      make: form.make.trim(),
      media: media.map((item, index) => ({ displayOrder: index + 1, storagePath: item.dataUrl })),
      mileage: toOptionalNumber(form.mileage),
      model: form.model.trim(),
      phone: form.phone.trim(),
      sellerName: form.sellerName.trim(),
      variant: form.variant.trim() || undefined,
      year,
    });
  }

  return (
    <div className="space-y-6 rounded-[28px] border border-border/60 bg-card/90 p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{props.title}</h2>
        <p className="text-sm text-muted-foreground">Make changes here, then save the upload back into the review queue.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={labels.contact}>
          <Field label="Seller name"><Input value={form.sellerName} onChange={(event) => setForm((current) => ({ ...current, sellerName: event.target.value }))} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></Field>
          <Field label="Email"><Input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></Field>
        </Section>

        <Section title={labels.details}>
          <Field label="Make"><Input value={form.make} onChange={(event) => setForm((current) => ({ ...current, make: event.target.value }))} /></Field>
          <Field label="Model"><Input value={form.model} onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))} /></Field>
          <Field label="Year"><Input type="number" value={form.year} onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))} /></Field>
          <Field label="Variant"><Input value={form.variant} onChange={(event) => setForm((current) => ({ ...current, variant: event.target.value }))} /></Field>
          <Field label="Location"><Input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} /></Field>
          <Field label="Mileage"><Input type="number" value={form.mileage} onChange={(event) => setForm((current) => ({ ...current, mileage: event.target.value }))} /></Field>
          <Field label="Expected price"><Input type="number" value={form.askingPrice} onChange={(event) => setForm((current) => ({ ...current, askingPrice: event.target.value }))} /></Field>
        </Section>
      </div>

      <Field label="Vehicle notes">
        <Textarea rows={5} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
      </Field>

      <PhotoUploadField value={media} onChange={setMedia} />

      <div className="flex flex-wrap gap-3">
        <Button disabled={props.isPending} type="button" onClick={handleSubmit}>
          {props.submitLabel}
        </Button>
        {props.onCancel ? (
          <Button disabled={props.isPending} type="button" variant="outline" onClick={props.onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}
