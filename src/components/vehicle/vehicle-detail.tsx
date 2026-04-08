"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Calendar, Car, Fuel, Gauge, Heart, MapPin, MessageCircle, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

interface VehicleDetailProps {
  vehicle: {
    id: string;
    vin?: string;
    make: string;
    model: string;
    year: number;
    variant?: string;
    color?: string;
    mileage?: number;
    fuel_type?: string;
    transmission?: string;
    body_type?: string;
    registration_year?: number;
    location?: string;
  };
  listing?: {
    id: string;
    status: string;
    procurement_price?: number;
    target_selling_price?: number;
    extra_spend?: number;
    maintenance_cost?: number;
    documentation_cost?: number;
    transport_cost?: number;
    other_cost?: number;
    internal_notes?: string;
    condition_notes?: string;
    highlights?: string;
    published_at?: string;
  };
  media?: Array<{
    id: string;
    storage_path: string;
    media_type: string;
    is_blurred: boolean;
    display_order: number;
  }>;
  showFinancials?: boolean;
}

const statusColors: Record<string, string> = {
  published: "bg-green-500",
  reserved: "bg-yellow-500",
  sold: "bg-red-500",
  draft: "bg-gray-500",
};

function formatPrice(amount?: number): string {
  if (amount == null) return "Not disclosed";
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function formatImageSrc(path?: string): string {
  if (!path) return "/placeholder-car.svg";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }
  return `/${path}`;
}

export function VehicleDetail({
  vehicle,
  listing,
  media = [],
  showFinancials = false,
}: VehicleDetailProps) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ subject: "", message: "" });
  const [reservationOpen, setReservationOpen] = useState(false);
  const [reservationForm, setReservationForm] = useState({ message: "" });

  const images = media
    .filter((item) => item.media_type === "image")
    .sort((first, second) => first.display_order - second.display_order);
  const currentImage = images[selectedImageIndex];
  const hasTargetPrice = listing?.target_selling_price != null;
  const hasMileage = vehicle.mileage != null;
  const totalCost =
    (listing?.procurement_price ?? 0) +
    (listing?.extra_spend ?? 0) +
    (listing?.maintenance_cost ?? 0) +
    (listing?.documentation_cost ?? 0) +
    (listing?.transport_cost ?? 0) +
    (listing?.other_cost ?? 0);
  const headerSubtitle = [vehicle.year, vehicle.variant].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      <Button type="button" variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Inventory
      </Button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            <Image
              src={formatImageSrc(currentImage?.storage_path)}
              alt={`${vehicle.make} ${vehicle.model}`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={`object-cover ${currentImage?.is_blurred ? "blur-md" : ""}`}
            />
            {listing?.status && (
              <Badge className={`absolute left-4 top-4 ${statusColors[listing.status] ?? statusColors.draft} text-white`}>
                {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
              </Badge>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-md border-2 ${
                    index === selectedImageIndex ? "border-primary" : "border-transparent"
                  }`}
                  aria-label={`Show image ${index + 1}`}
                >
                  <Image
                    src={formatImageSrc(image.storage_path)}
                    alt={`Vehicle image ${index + 1}`}
                    fill
                    sizes="112px"
                    className={`object-cover ${image.is_blurred ? "blur-md" : ""}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">
              {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-lg text-muted-foreground">{headerSubtitle}</p>
          </div>

          {hasTargetPrice && (
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">{formatPrice(listing?.target_selling_price)}</span>
              {showFinancials && listing?.procurement_price != null && (
                <span className="text-sm text-muted-foreground">(Cost: {formatPrice(totalCost)})</span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            {vehicle.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{vehicle.location}</span>
              </div>
            )}
            {hasMileage && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Gauge className="h-4 w-4" />
                <span>{vehicle.mileage?.toLocaleString("en-IN")} km</span>
              </div>
            )}
            {vehicle.fuel_type && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Fuel className="h-4 w-4" />
                <span>{vehicle.fuel_type}</span>
              </div>
            )}
            {vehicle.transmission && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Car className="h-4 w-4" />
                <span>{vehicle.transmission}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {listing?.status === "published" && (
              <>
                <Button type="button" className="flex-1" onClick={() => setReservationOpen(true)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Reserve Interest
                </Button>
                <Button type="button" variant="outline" onClick={() => setInquiryOpen(true)}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Send Inquiry
                </Button>
              </>
            )}
            <Button type="button" variant="outline" aria-label="Save vehicle">
              <Heart className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button type="button" variant="outline" aria-label="Share vehicle">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          {listing?.highlights && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{listing.highlights}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Tabs defaultValue="specifications" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="condition">Condition</TabsTrigger>
          {showFinancials && <TabsTrigger value="financials">Financials</TabsTrigger>}
        </TabsList>

        <TabsContent value="specifications">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
              <SpecItem label="Make" value={vehicle.make} />
              <SpecItem label="Model" value={vehicle.model} />
              <SpecItem label="Year" value={String(vehicle.year)} />
              <SpecItem label="Variant" value={vehicle.variant ?? "-"} />
              <SpecItem label="Color" value={vehicle.color ?? "-"} />
              <SpecItem label="Body Type" value={vehicle.body_type ?? "-"} />
              <SpecItem label="Fuel Type" value={vehicle.fuel_type ?? "-"} />
              <SpecItem label="Transmission" value={vehicle.transmission ?? "-"} />
              <SpecItem label="Mileage" value={hasMileage ? `${vehicle.mileage?.toLocaleString("en-IN")} km` : "-"} />
              <SpecItem label="Registration Year" value={vehicle.registration_year?.toString() ?? "-"} />
              <SpecItem label="Location" value={vehicle.location ?? "-"} />
              {vehicle.vin && <SpecItem label="VIN" value={vehicle.vin} mono />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="condition" className="space-y-4">
          {listing?.condition_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Condition Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{listing.condition_notes}</p>
              </CardContent>
            </Card>
          )}
          {listing?.internal_notes && showFinancials && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{listing.internal_notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {showFinancials && (
          <TabsContent value="financials">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <FinancialRow label="Procurement Price" value={formatPrice(listing?.procurement_price)} />
                <Separator />
                <FinancialRow label="Extra Spend" value={formatPrice(listing?.extra_spend)} />
                <Separator />
                <FinancialRow label="Maintenance Cost" value={formatPrice(listing?.maintenance_cost)} />
                <Separator />
                <FinancialRow label="Documentation Cost" value={formatPrice(listing?.documentation_cost)} />
                <Separator />
                <FinancialRow label="Transport Cost" value={formatPrice(listing?.transport_cost)} />
                <Separator />
                <FinancialRow label="Other Cost" value={formatPrice(listing?.other_cost)} />
                <Separator />
                <FinancialRow label="Total Cost" value={formatPrice(totalCost)} strong />
                <Separator />
                <FinancialRow label="Target Price" value={formatPrice(listing?.target_selling_price)} strong accent />
                <FinancialRow
                  label="Margin"
                  value={`Rs. ${((listing?.target_selling_price ?? 0) - totalCost).toLocaleString("en-IN")}`}
                  accent
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Inquiry</DialogTitle>
            <DialogDescription>Send a message about this vehicle to the team.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setInquiryOpen(false);
              setInquiryForm({ subject: "", message: "" });
            }}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="inquiry-subject">Subject</Label>
                <Input
                  id="inquiry-subject"
                  value={inquiryForm.subject}
                  onChange={(event) =>
                    setInquiryForm((current) => ({ ...current, subject: event.target.value }))
                  }
                  placeholder="Inquiry subject"
                />
              </div>
              <div>
                <Label htmlFor="inquiry-message">Message</Label>
                <Textarea
                  id="inquiry-message"
                  value={inquiryForm.message}
                  onChange={(event) =>
                    setInquiryForm((current) => ({ ...current, message: event.target.value }))
                  }
                  placeholder="Your message..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setInquiryOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Send Inquiry</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={reservationOpen} onOpenChange={setReservationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve Interest</DialogTitle>
            <DialogDescription>Submit your interest to reserve this vehicle.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setReservationOpen(false);
              setReservationForm({ message: "" });
            }}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="reservation-message">Message (optional)</Label>
                <Textarea
                  id="reservation-message"
                  value={reservationForm.message}
                  onChange={(event) =>
                    setReservationForm((current) => ({ ...current, message: event.target.value }))
                  }
                  placeholder="Any additional information..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setReservationOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Request</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SpecItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <Label className="text-muted-foreground">{label}</Label>
      <p className={`font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}

function FinancialRow({
  label,
  value,
  strong = false,
  accent = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-lg font-bold" : ""}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span className={accent ? "text-green-600" : ""}>{value}</span>
    </div>
  );
}
