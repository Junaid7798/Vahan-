"use client";

import { useState } from "react";
import { Moon, Palette, SunMedium } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  applyThemePreference,
  THEME_ACCENT_STORAGE_KEY,
  THEME_MODE_STORAGE_KEY,
  themeAccents,
  ThemeAccent,
  themeModes,
  ThemeMode,
} from "@/lib/theme/preferences";

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const storedMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
  return storedMode && themeModes.includes(storedMode as ThemeMode) ? (storedMode as ThemeMode) : "system";
}

function getInitialAccent(): ThemeAccent {
  if (typeof window === "undefined") return "copper";
  const storedAccent = window.localStorage.getItem(THEME_ACCENT_STORAGE_KEY);
  return storedAccent && themeAccents.includes(storedAccent as ThemeAccent) ? (storedAccent as ThemeAccent) : "copper";
}

export function AppearanceSwitcher() {
  const t = useTranslations("appearance");
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);
  const [accent, setAccent] = useState<ThemeAccent>(getInitialAccent);

  function updateMode(nextMode: ThemeMode) {
    setMode(nextMode);
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode);
    applyThemePreference(nextMode, accent);
  }

  function updateAccent(nextAccent: ThemeAccent) {
    setAccent(nextAccent);
    window.localStorage.setItem(THEME_ACCENT_STORAGE_KEY, nextAccent);
    applyThemePreference(mode, nextAccent);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={t("title")} className="shell-control rounded-2xl" size="icon" type="button" variant="outline">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="sheet-surface w-64 rounded-2xl p-2">
        <DropdownMenuLabel>{t("title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("mode")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mode} onValueChange={(value) => updateMode(value as ThemeMode)}>
          <DropdownMenuRadioItem value="system">
            <SunMedium className="h-4 w-4" />
            {t("system")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">
            <SunMedium className="h-4 w-4" />
            {t("light")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="h-4 w-4" />
            {t("dark")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("color")}</DropdownMenuLabel>
        {themeAccents.map((item) => (
          <DropdownMenuItem key={item} onSelect={() => updateAccent(item)}>
            <span aria-hidden="true" className={`h-3 w-3 rounded-full ${item === "copper" ? "bg-amber-600" : item === "ocean" ? "bg-sky-600" : "bg-emerald-600"}`} />
            {t(item)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
