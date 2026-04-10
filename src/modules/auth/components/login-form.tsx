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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { readResponseJson } from "@/modules/auth/lib/read-response-json";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const authT = useTranslations("auth");
  const commonT = useTranslations("common");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await readResponseJson<{ error?: string }>(response);

      if (!response.ok) {
        setError(result?.error || authT("invalidCredentials"));
        return;
      }

      router.push("/app");
    } catch {
      setError(commonT("error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="auth-card w-full text-foreground shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
      <CardHeader>
        <CardTitle className="text-foreground">{authT("login")}</CardTitle>
        <CardDescription className="text-muted-foreground">{authT("loginDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <Label className="text-foreground" htmlFor="email">{authT("email")}</Label>
                <FormControl><Input className="border-border/80 bg-background/70 text-foreground placeholder:text-muted-foreground" id="email" placeholder="you@example.com" type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <Label className="text-foreground" htmlFor="password">{authT("password")}</Label>
                <FormControl><Input className="border-border/80 bg-background/70 text-foreground placeholder:text-muted-foreground" id="password" placeholder="Enter your password" type="password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button className="w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary)/0.92)]" disabled={isLoading} type="submit">
              {isLoading ? commonT("loading") : authT("login")}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="rounded-lg border border-border/70 bg-[hsl(var(--muted)/0.8)] p-3 text-xs text-foreground/80">
          {authT("demoAccounts")}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link className="text-primary hover:underline" href="/forgot-password">
            {authT("forgotPassword")}
          </Link>
        </p>
        <p className="text-sm text-muted-foreground">
          {authT("dontHaveAccount")}{" "}
          <Link className="text-primary hover:underline" href="/signup">{authT("signup")}</Link>
        </p>
      </CardFooter>
    </Card>
  );
}
