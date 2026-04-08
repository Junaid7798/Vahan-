"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const locales = [
  { label: "EN", value: "en" },
  { label: "HI", value: "hi" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-[hsl(var(--background)/0.82)] p-1 shadow-sm backdrop-blur">
      {locales.map((option) => {
        const isActive = locale === option.value;

        return (
          <Button
            key={option.value}
            aria-pressed={isActive}
            className={cn(
              "rounded-full px-3 transition-colors",
              isActive
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary)/0.92)]"
                : "text-muted-foreground hover:bg-[hsl(var(--muted)/0.9)] hover:text-foreground"
            )}
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => router.replace(pathname, { locale: option.value })}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
