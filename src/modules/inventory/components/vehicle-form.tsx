"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { CompressedImageResult } from "@/lib/media/compress-image";
import { VehicleRecord } from "@/lib/demo/portal-types";
import { PhotoUploadField } from "@/modules/inventory/components/photo-upload-field";

interface VehicleFormProps {
  initialRecord?: VehicleRecord | null;
  mode: "create" | "edit";
  showFinancials: boolean;
}

interface VehicleFormState {
  bodyType: string;
  color: string;
  conditionNotes: string;
  documentationCost: string;
  extraSpend: string;
  fuelType: string;
  highlights: string;
  internalNotes: string;
  location: string;
  maintenanceCost: string;
  make: string;
  mileage: string;
  model: string;
  otherCost: string;
  procurementPrice: string;
  registrationYear: string;
  status: VehicleRecord["status"];
  targetSellingPrice: string;
  transmission: string;
  transportCost: string;
  variant: string;
  vin: string;
  year: string;
}

function toState(record?: VehicleRecord | null): VehicleFormState {
  return {
    bodyType: record?.bodyType ?? "",
    color: record?.color ?? "",
    conditionNotes: record?.conditionNotes ?? "",
    documentationCost: record?.documentationCost?.toString() ?? "",
    extraSpend: record?.extraSpend?.toString() ?? "",
    fuelType: record?.fuelType ?? "",
    highlights: record?.highlights ?? "",
    internalNotes: record?.internalNotes ?? "",
    location: record?.location ?? "",
    maintenanceCost: record?.maintenanceCost?.toString() ?? "",
    make: record?.make ?? "",
    mileage: record?.mileage?.toString() ?? "",
    model: record?.model ?? "",
    otherCost: record?.otherCost?.toString() ?? "",
    procurementPrice: record?.procurementPrice?.toString() ?? "",
    registrationYear: record?.registrationYear?.toString() ?? "",
    status: record?.status ?? "draft",
    targetSellingPrice: record?.targetSellingPrice?.toString() ?? "",
    transmission: record?.transmission ?? "",
    transportCost: record?.transportCost?.toString() ?? "",
    variant: record?.variant ?? "",
    vin: record?.vin ?? "",
    year: record?.year?.toString() ?? "",
  };
}

function toMedia(record?: VehicleRecord | null): CompressedImageResult[] {
  return (record?.media ?? []).map((item) => ({ compressedSize: 0, dataUrl: item.storagePath, fileName: item.id, originalSize: 0 }));
}

function toNumber(value: string) {
  return value ? Number(value) : undefined;
}

export function VehicleForm({ initialRecord, mode, showFinancials }: VehicleFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<VehicleFormState>(toState(initialRecord));
  const [media, setMedia] = useState<CompressedImageResult[]>(toMedia(initialRecord));
  const [isSaving, setIsSaving] = useState(false);

  async function submit() {
    if (!form.make || !form.model || !form.year) {
      toast({ title: "Missing required fields", description: "Make, model, and year are required." });
      return;
    }

    setIsSaving(true);
    const payload = {
      bodyType: form.bodyType,
      color: form.color,
      conditionNotes: form.conditionNotes,
      documentationCost: toNumber(form.documentationCost),
      extraSpend: toNumber(form.extraSpend),
      fuelType: form.fuelType,
      highlights: form.highlights,
      internalNotes: form.internalNotes,
      location: form.location,
      maintenanceCost: toNumber(form.maintenanceCost),
      make: form.make,
      media: media.map((item, index) => ({ displayOrder: index + 1, storagePath: item.dataUrl })),
      mileage: toNumber(form.mileage),
      model: form.model,
      otherCost: toNumber(form.otherCost),
      procurementPrice: toNumber(form.procurementPrice),
      registrationYear: toNumber(form.registrationYear),
      status: form.status,
      targetSellingPrice: toNumber(form.targetSellingPrice),
      transmission: form.transmission,
      transportCost: toNumber(form.transportCost),
      variant: form.variant,
      vin: form.vin,
      year: Number(form.year),
    };

    const url = mode === "create" ? "/api/demo/vehicles" : `/api/demo/vehicles/${initialRecord?.listingId}`;
    const method = mode === "create" ? "POST" : "PUT";
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    setIsSaving(false);

    if (!response.ok) {
      toast({ title: "Save failed", description: "The vehicle could not be saved." });
      return;
    }

    toast({ title: mode === "create" ? "Vehicle created" : "Vehicle updated", description: `Listing saved as ${form.status}.` });
    router.push("/app/admin/vehicles");
    router.refresh();
  }

  return (
    <Card className="rounded-[32px] border-border/60 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Add vehicle" : "Edit vehicle"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Section title="Core Vehicle Info">
          <GridInput label="Make" value={form.make} onChange={(value) => setForm((current) => ({ ...current, make: value }))} />
          <GridInput label="Model" value={form.model} onChange={(value) => setForm((current) => ({ ...current, model: value }))} />
          <GridInput label="Year" value={form.year} onChange={(value) => setForm((current) => ({ ...current, year: value }))} />
          <GridInput label="Variant" value={form.variant} onChange={(value) => setForm((current) => ({ ...current, variant: value }))} />
          <GridInput label="Color" value={form.color} onChange={(value) => setForm((current) => ({ ...current, color: value }))} />
          <GridInput label="Mileage" value={form.mileage} onChange={(value) => setForm((current) => ({ ...current, mileage: value }))} />
          <GridInput label="Fuel Type" value={form.fuelType} onChange={(value) => setForm((current) => ({ ...current, fuelType: value }))} />
          <GridInput label="Transmission" value={form.transmission} onChange={(value) => setForm((current) => ({ ...current, transmission: value }))} />
          <GridInput label="Body Type" value={form.bodyType} onChange={(value) => setForm((current) => ({ ...current, bodyType: value }))} />
          <GridInput label="Registration Year" value={form.registrationYear} onChange={(value) => setForm((current) => ({ ...current, registrationYear: value }))} />
          <GridInput label="Location" value={form.location} onChange={(value) => setForm((current) => ({ ...current, location: value }))} />
          <GridInput label="VIN" value={form.vin} onChange={(value) => setForm((current) => ({ ...current, vin: value }))} />
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(value: VehicleRecord["status"]) => setForm((current) => ({ ...current, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Section>

        <Section title="Notes">
          <TextField label="Highlights" value={form.highlights} onChange={(value) => setForm((current) => ({ ...current, highlights: value }))} />
          <TextField label="Condition Notes" value={form.conditionNotes} onChange={(value) => setForm((current) => ({ ...current, conditionNotes: value }))} />
          <TextField label="Internal Notes" value={form.internalNotes} onChange={(value) => setForm((current) => ({ ...current, internalNotes: value }))} />
        </Section>

        <PhotoUploadField value={media} onChange={setMedia} />

        {showFinancials ? (
          <Section title="Hidden Financials">
            <GridInput label="Procurement Price" value={form.procurementPrice} onChange={(value) => setForm((current) => ({ ...current, procurementPrice: value }))} />
            <GridInput label="Target Selling Price" value={form.targetSellingPrice} onChange={(value) => setForm((current) => ({ ...current, targetSellingPrice: value }))} />
            <GridInput label="Extra Spend" value={form.extraSpend} onChange={(value) => setForm((current) => ({ ...current, extraSpend: value }))} />
            <GridInput label="Maintenance Cost" value={form.maintenanceCost} onChange={(value) => setForm((current) => ({ ...current, maintenanceCost: value }))} />
            <GridInput label="Documentation Cost" value={form.documentationCost} onChange={(value) => setForm((current) => ({ ...current, documentationCost: value }))} />
            <GridInput label="Transport Cost" value={form.transportCost} onChange={(value) => setForm((current) => ({ ...current, transportCost: value }))} />
            <GridInput label="Other Cost" value={form.otherCost} onChange={(value) => setForm((current) => ({ ...current, otherCost: value }))} />
          </Section>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" disabled={isSaving} onClick={submit}>
            {isSaving ? "Saving..." : mode === "create" ? "Create vehicle" : "Save vehicle"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

function GridInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2 md:col-span-2">
      <Label>{label}</Label>
      <Textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

