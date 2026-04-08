"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

const locales = [
  { label: "EN", value: "en" },
  { label: "HI", value: "hi" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-white/85 p-1 shadow-sm backdrop-blur">
      {locales.map((option) => {
        const isActive = locale === option.value;

        return (
          <Button
            key={option.value}
            aria-pressed={isActive}
            className="rounded-full px-3"
            size="sm"
            type="button"
            variant={isActive ? "default" : "ghost"}
            onClick={() => router.replace(pathname, { locale: option.value })}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
