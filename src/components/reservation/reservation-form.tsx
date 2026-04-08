"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Loader2 } from "lucide-react";

const reservationSchema = z.object({
  message: z.string().max(500, "Message must be less than 500 characters").optional(),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

interface ReservationFormProps {
  listingId: string;
  vehicleInfo?: string;
  onSubmit?: (listingId: string, data: ReservationFormValues) => Promise<void>;
  trigger?: React.ReactNode;
}

export function ReservationForm({ 
  listingId, 
  vehicleInfo,
  onSubmit,
  trigger 
}: ReservationFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      message: "",
    },
  });

  const handleSubmit = async (values: ReservationFormValues) => {
    if (!onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(listingId, values);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error submitting reservation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button type="button">
      <Calendar className="mr-2 h-4 w-4" />
      Reserve Interest
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reserve Interest</DialogTitle>
          <DialogDescription>
            {vehicleInfo 
              ? `Submit your interest in ${vehicleInfo}` 
              : "Submit your interest in this vehicle"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information or questions..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !onSubmit}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface ReservationRequestCardProps {
  request: {
    id: string;
    listing_id: string;
    status: string;
    message?: string;
    created_at: string;
  };
  vehicleInfo?: string;
  onCancel?: (id: string) => void;
}

export function ReservationRequestCard({ request, vehicleInfo, onCancel }: ReservationRequestCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          {vehicleInfo && <p className="font-medium">{vehicleInfo}</p>}
          <p className="text-sm text-muted-foreground">
            Submitted: {formatDate(request.created_at)}
          </p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${
          request.status === "pending" ? "bg-yellow-500" :
          request.status === "approved" ? "bg-green-500" :
          request.status === "rejected" ? "bg-red-500" :
          "bg-gray-500"
        }`}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>
      {request.message && (
        <p className="text-sm">{request.message}</p>
      )}
      {request.status === "pending" && onCancel && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onCancel(request.id)}
        >
          Cancel Request
        </Button>
      )}
    </div>
  );
}
