"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { patchPortalAction } from "@/lib/demo/portal-client";
import { DemoPortalSettings } from "@/lib/demo/portal-types";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdminSettingsFormProps {
  settings: DemoPortalSettings;
}

export function AdminSettingsForm({ settings }: AdminSettingsFormProps) {
  const [form, setForm] = useState(settings);
  const [isPending, startTransition] = useTransition();
  const settingsT = useTranslations("settings");

  function saveSettings() {
    startTransition(async () => {
      try {
        await patchPortalAction("update_settings", form);
        toast({ title: settingsT("updatedTitle"), description: settingsT("updatedDescription") });
      } catch (error) {
        toast({
          title: settingsT("saveFailedTitle"),
          description: error instanceof Error ? error.message : settingsT("saveFailedDescription"),
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-border/60 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>{settingsT("operationalControls")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <ToggleRow
            checked={form.managerFinancialAccess}
            description={settingsT("managerFinancialAccessDescription")}
            label={settingsT("managerFinancialAccess")}
            onChange={(checked) => setForm((current) => ({ ...current, managerFinancialAccess: checked }))}
          />
          <ToggleRow
            checked={form.notifications.inquiries}
            description={settingsT("inquiryNotificationsDescription")}
            label={settingsT("inquiryNotifications")}
            onChange={(checked) => setForm((current) => ({ ...current, notifications: { ...current.notifications, inquiries: checked } }))}
          />
          <ToggleRow
            checked={form.notifications.reservations}
            description={settingsT("reservationNotificationsDescription")}
            label={settingsT("reservationNotifications")}
            onChange={(checked) => setForm((current) => ({ ...current, notifications: { ...current.notifications, reservations: checked } }))}
          />
          <ToggleRow
            checked={form.notifications.sellerSubmissions}
            description={settingsT("sellerSubmissionNotificationsDescription")}
            label={settingsT("sellerSubmissionNotifications")}
            onChange={(checked) => setForm((current) => ({ ...current, notifications: { ...current.notifications, sellerSubmissions: checked } }))}
          />
          <ToggleRow
            checked={form.notifications.resaleRequests}
            description={settingsT("resaleNotificationsDescription")}
            label={settingsT("resaleNotifications")}
            onChange={(checked) => setForm((current) => ({ ...current, notifications: { ...current.notifications, resaleRequests: checked } }))}
          />
          <ToggleRow
            checked={form.notifications.chats}
            description={settingsT("chatNotificationsDescription")}
            label={settingsT("chatNotifications")}
            onChange={(checked) => setForm((current) => ({ ...current, notifications: { ...current.notifications, chats: checked } }))}
          />
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>{settingsT("localizationDefaults")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>{settingsT("defaultAppLanguage")}</Label>
            <Select value={form.defaultLocale} onValueChange={(value: "en" | "hi") => setForm((current) => ({ ...current, defaultLocale: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={settingsT("chooseLanguage")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">{settingsT("localizationDescription")}</p>
          <Button className="w-full" disabled={isPending} type="button" onClick={saveSettings}>
            {isPending ? settingsT("saving") : settingsT("saveSettings")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-background px-4 py-4">
      <div className="space-y-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <input checked={checked} className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  );
}
