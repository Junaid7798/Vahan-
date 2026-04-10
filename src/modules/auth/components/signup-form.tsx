"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readResponseJson } from "@/modules/auth/lib/read-response-json";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone must be at least 10 digits"),
    city: z.string().min(1, "City is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const authT = useTranslations("auth");
  const commonT = useTranslations("common");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      city: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await readResponseJson<{ error?: string }>(response);

      if (!response.ok) {
        setError(result?.error || commonT("error"));
        return;
      }

      router.push("/pending-approval");
    } catch {
      setError(commonT("error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="auth-card w-full text-foreground shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
      <CardHeader>
        <CardTitle className="text-foreground">{authT("signup")}</CardTitle>
        <CardDescription className="text-muted-foreground">{authT("signupDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {error ? (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-foreground" htmlFor="fullName">{authT("fullName")}</Label>
                  <FormControl>
                    <Input className="border-border/80 bg-background/70 text-foreground placeholder:text-muted-foreground" id="fullName" placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-foreground" htmlFor="email">{authT("email")}</Label>
                  <FormControl>
                    <Input className="border-border/80 bg-background/70 text-foreground placeholder:text-muted-foreground" id="email" placeholder="you@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-foreground" htmlFor="phone">{authT("phone")}</Label>
                  <FormControl>
                    <Input className="border-border/80 bg-background/70 text-foreground placeholder:text-muted-foreground" id="phone" placeholder="9876543210" type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-foreground" htmlFor="city">{authT("city")}</Label>
                  <FormControl>
                    <Input className="border-border/80 bg-background/70 text-foreground placeholder:text-muted-foreground" id="city" placeholder="Mumbai" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-foreground" htmlFor="password">{authT("password")}</Label>
                  <FormControl>
                    <Input
                      className="border-border/80 bg-background/70 text-foreground placeholder:text-muted-foreground"
                      id="password"
                      placeholder="Create a password"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-foreground" htmlFor="confirmPassword">{authT("confirmPassword")}</Label>
                  <FormControl>
                    <Input
                      className="border-border/80 bg-background/70 text-foreground placeholder:text-muted-foreground"
                      id="confirmPassword"
                      placeholder="Confirm your password"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary)/0.92)]" disabled={isLoading} type="submit">
              {isLoading ? commonT("loading") : authT("createAccount")}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {authT("alreadyHaveAccount")}{" "}
          <Link className="text-primary hover:underline" href="/login">
            {authT("login")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
