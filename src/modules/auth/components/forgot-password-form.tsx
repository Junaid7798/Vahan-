"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const authT = useTranslations("auth");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setServerError(result.error ?? commonT("error"));
        return;
      }

      setIsSubmitted(true);
    } catch {
      setServerError(commonT("error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{authT("forgotPasswordTitle")}</CardTitle>
        <CardDescription>{authT("forgotPasswordDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {authT("resetPasswordSuccess")}
          </div>
        ) : (
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              {serverError ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{serverError}</div> : null}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="email">{authT("email")}</Label>
                    <FormControl>
                      <Input id="email" placeholder="you@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full" disabled={isLoading} type="submit">
                {isLoading ? commonT("loading") : authT("sendResetLink")}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-sm text-gray-600">
          <Link className="text-primary hover:underline" href="/login">
            {authT("backToLogin")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
