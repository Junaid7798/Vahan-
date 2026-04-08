"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ShellNotification {
  description: string;
  href: string;
  id: string;
  title: string;
}

interface NotificationCenterProps {
  items: ShellNotification[];
}

export function NotificationCenter({ items }: NotificationCenterProps) {
  const router = useRouter();
  const t = useTranslations("notifications");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t("title")}
          className="relative rounded-2xl"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Bell className="h-4 w-4" />
          {items.length > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {items.length > 9 ? "9+" : items.length}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px] rounded-2xl p-2">
        <DropdownMenuLabel className="flex items-center justify-between gap-3">
          <span>{t("title")}</span>
          <Badge variant="secondary">{items.length}</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground">{t("empty")}</div>
        ) : null}
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            className="items-start rounded-xl py-3"
            onSelect={() => router.push(item.href)}
          >
            <div className="space-y-1">
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
