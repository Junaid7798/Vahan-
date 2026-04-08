"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react";

const resaleRequestSchema = z.object({
  message: z.string().min(20, "Please provide more details").max(2000),
  expected_timeline: z.string().min(1, "Please select a timeline"),
});

type ResaleRequestFormValues = z.infer<typeof resaleRequestSchema>;

interface ResaleRequestFormProps {
  onSubmit?: (data: ResaleRequestFormValues) => Promise<void>;
}

export function ResaleRequestForm({ onSubmit }: ResaleRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ResaleRequestFormValues>({
    resolver: zodResolver(resaleRequestSchema),
    defaultValues: {
      message: "",
      expected_timeline: "",
    },
  });

  const handleSubmit = async (values: ResaleRequestFormValues) => {
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
          <h3 className="text-xl font-semibold mb-2">Request Submitted!</h3>
          <p className="text-muted-foreground mb-4">
            Your resale request has been submitted. Our team will review and contact you.
          </p>
          <Button onClick={() => setIsSuccess(false)}>
            Submit Another Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Request Resale
        </CardTitle>
        <CardDescription>
          Interested in selling your vehicle through us? Submit your details below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="expected_timeline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>When are you looking to sell?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="immediate">Immediately</SelectItem>
                      <SelectItem value="within_1_month">Within 1 month</SelectItem>
                      <SelectItem value="within_3_months">Within 3 months</SelectItem>
                      <SelectItem value="within_6_months">Within 6 months</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide details about your vehicle - make, model, year, current condition, mileage, expected price, etc."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting || !onSubmit}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
