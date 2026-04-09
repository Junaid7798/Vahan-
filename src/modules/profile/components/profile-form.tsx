"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { postPortalAction } from "@/lib/demo/portal-client";
import { PortalLocale } from "@/lib/demo/portal-types";
import { toast } from "@/hooks/use-toast";
import { SignOutButton } from "@/components/auth/session-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCityOptions } from "@/lib/vehicle/form-options";

interface ProfileFormProps {
  approvalStatus: string;
  city: string;
  email: string;
  fullName: string;
  phone: string;
  preferredLocale: PortalLocale;
  role: string;
}

export function ProfileForm(props: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    city: props.city,
    fullName: props.fullName,
    phone: props.phone,
    preferredLocale: props.preferredLocale,
  });
  const pathname = usePathname();
  const router = useRouter();
  const profileT = useTranslations("profile");
  const statusT = useTranslations("status");
  const approvalStatusKey = props.approvalStatus === "pending_approval" ? "pending" : props.approvalStatus;
  const roleLabel = props.role === "admin" ? profileT("roleAdmin") : props.role === "manager" ? profileT("roleManager") : profileT("roleUser");

  function saveProfile() {
    startTransition(async () => {
      try {
        await postPortalAction("update_profile", form);
        toast({ title: profileT("updatedTitle"), description: profileT("updatedDescription") });

        if (form.preferredLocale !== props.preferredLocale) {
          document.cookie = `NEXT_LOCALE=${form.preferredLocale}; path=/; max-age=31536000; samesite=lax`;
          router.replace(pathname, { locale: form.preferredLocale });
        }

        router.refresh();
      } catch (error) {
        toast({
          title: profileT("saveFailedTitle"),
          description: error instanceof Error ? error.message : profileT("saveFailedDescription"),
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-border/60 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>{profileT("accountDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Field label={profileT("fullName")}>
            <Input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
          </Field>
          <Field label={profileT("email")}>
            <Input disabled value={props.email} />
          </Field>
          <Field label={profileT("phone")}>
            <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          </Field>
          <Field label={profileT("city")}>
            <SearchableSelect allowCustomValue emptyLabel={profileT("city")} label={profileT("city")} options={getCityOptions()} placeholder={profileT("city")} searchPlaceholder={profileT("citySearchPlaceholder")} value={form.city} onValueChange={(value) => setForm((current) => ({ ...current, city: value }))} />
          </Field>
          <Field label={profileT("language")}>
            <Select value={form.preferredLocale} onValueChange={(value: PortalLocale) => setForm((current) => ({ ...current, preferredLocale: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={profileT("selectLanguage")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-end gap-2">
            <Button className="w-full" disabled={isPending} type="button" onClick={saveProfile}>
              {isPending ? profileT("saving") : profileT("saveChanges")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>{profileT("accessSession")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <StatusRow label={profileT("role")} value={<Badge variant="secondary">{roleLabel}</Badge>} />
          <StatusRow label={profileT("approval")} value={<Badge>{statusT(approvalStatusKey as "approved" | "disabled" | "pending" | "rejected")}</Badge>} />
          <p className="text-sm text-muted-foreground">{profileT("accessDescription")}</p>
          <SignOutButton className="w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            {profileT("signOut")}
          </SignOutButton>
        </CardContent>
      </Card>
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

function StatusRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="font-medium">{value}</div>
    </div>
  );
}
