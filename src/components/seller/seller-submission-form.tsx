"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Car, CheckCircle2 } from "lucide-react";

const sellerSubmissionSchema = z.object({
  seller_name: z.string().min(2, "Name must be at least 2 characters"),
  seller_phone: z.string().min(10, "Valid phone number required"),
  seller_email: z.string().email("Valid email required").optional().or(z.literal("")),
  vehicle_make: z.string().min(1, "Vehicle make is required"),
  vehicle_model: z.string().min(1, "Vehicle model is required"),
  vehicle_year: z.number().min(1990).max(new Date().getFullYear() + 1),
  vehicle_variant: z.string().optional(),
  description: z.string().min(20, "Please provide more details about the vehicle").max(2000),
});

type SellerSubmissionFormValues = z.infer<typeof sellerSubmissionSchema>;

interface SellerSubmissionFormProps {
  onSubmit?: (data: SellerSubmissionFormValues) => Promise<void>;
}

export function SellerSubmissionForm({ onSubmit }: SellerSubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<SellerSubmissionFormValues>({
    resolver: zodResolver(sellerSubmissionSchema),
    defaultValues: {
      seller_name: "",
      seller_phone: "",
      seller_email: "",
      vehicle_make: "",
      vehicle_model: "",
      vehicle_year: new Date().getFullYear(),
      vehicle_variant: "",
      description: "",
    },
  });

  const handleSubmit = async (values: SellerSubmissionFormValues) => {
    if (!onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      setIsSuccess(true);
      form.reset();
    } catch (error) {
      console.error("Error submitting:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Submission Received!</h3>
          <p className="text-muted-foreground mb-4">
            Thank you for submitting your vehicle. Our team will review your submission and contact you shortly.
          </p>
          <Button onClick={() => setIsSuccess(false)}>
            Submit Another Vehicle
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Sell Your Vehicle
        </CardTitle>
        <CardDescription>
          Submit details about your vehicle and our team will get back to you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Your Details
              </h4>
              
              <FormField
                control={form.control}
                name="seller_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="seller_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="10-digit phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seller_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Vehicle Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehicle_make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Maruti, Hyundai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicle_model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Swift, Creta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehicle_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicle_variant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variant (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., VXI, SX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide details about your vehicle - condition, mileage, any modifications, reason for selling, expected price, etc."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !onSubmit}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for Review
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
