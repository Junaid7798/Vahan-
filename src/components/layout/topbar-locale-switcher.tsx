"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const localeOptions = [
  { label: "English", value: "en" },
  { label: "हिन्दी", value: "hi" },
] as const;

export function TopbarLocaleSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const topbarT = useTranslations("topbar");

  function switchLocale(nextLocale: "en" | "hi") {
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={topbarT("language")}
          className="shell-control rounded-2xl"
          size="icon"
          type="button"
          variant="outline"
        >
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="sheet-surface w-52 rounded-2xl p-2">
        <DropdownMenuLabel>{topbarT("language")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={currentLocale}
          onValueChange={(value) => switchLocale(value as "en" | "hi")}
        >
          {localeOptions.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
