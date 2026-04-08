"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Loader2 } from "lucide-react";

const inquirySchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

interface InquiryButtonProps {
  listingId: string;
  onClick?: (listingId: string) => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function InquiryButton({ 
  listingId, 
  onClick,
  variant = "outline",
  size = "default"
}: InquiryButtonProps) {
  return (
    <Button 
      type="button"
      variant={variant} 
      size={size}
      onClick={() => onClick?.(listingId)}
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      Send Inquiry
    </Button>
  );
}

interface InquiryFormProps {
  listingId: string;
  vehicleInfo?: string;
  onSubmit?: (listingId: string, data: InquiryFormValues) => Promise<void>;
  trigger?: React.ReactNode;
}

export function InquiryForm({ 
  listingId, 
  vehicleInfo,
  onSubmit,
  trigger 
}: InquiryFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  const handleSubmit = async (values: InquiryFormValues) => {
    if (!onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(listingId, values);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error submitting inquiry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button type="button" variant="outline">
      <MessageCircle className="mr-2 h-4 w-4" />
      Send Inquiry
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Inquiry</DialogTitle>
          <DialogDescription>
            {vehicleInfo 
              ? `Ask about ${vehicleInfo}`
              : "Send a message about this vehicle"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief subject for your inquiry"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Your questions or message..."
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
                Send Inquiry
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface InquiryCardProps {
  inquiry: {
    id: string;
    subject: string;
    message: string;
    status: string;
    created_at: string;
  };
  vehicleInfo?: string;
}

export function InquiryCard({ inquiry, vehicleInfo }: InquiryCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    open: { label: "Open", className: "bg-yellow-500" },
    answered: { label: "Answered", className: "bg-green-500" },
    closed: { label: "Closed", className: "bg-gray-500" },
  };
  const status = statusConfig[inquiry.status] || { label: inquiry.status, className: "bg-gray-500" };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{inquiry.subject}</p>
          {vehicleInfo && (
            <p className="text-sm text-muted-foreground">{vehicleInfo}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {formatDate(inquiry.created_at)}
          </p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${status.className}`}>
          {status.label}
        </span>
      </div>
      <p className="text-sm">{inquiry.message}</p>
    </div>
  );
}
