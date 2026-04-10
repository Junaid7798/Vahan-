"use client";

import { useEffect } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useTranslations } from "next-intl";
import { WifiOff } from "lucide-react";
import { setupAutoSync } from "@/lib/offline/sync";

export function OnlineStatusIndicator() {
  const isOnline = useOnlineStatus();
  const t = useTranslations("offline");

  useEffect(() => setupAutoSync(), []);

  if (isOnline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-black"
      role="status"
      aria-live="polite"
    >
      <WifiOff className="h-4 w-4" />
      <span>{t("offline")} - {t("changesWillSync")}</span>
    </div>
  );
}
