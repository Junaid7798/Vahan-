"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  description?: string;
  keywords?: readonly string[];
  label: string;
  value: string;
}

interface SearchableSelectProps {
  allowCustomValue?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  emptyLabel: string;
  label: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder: string;
  triggerClassName?: string;
  value: string;
}

export function SearchableSelect({
  allowCustomValue = false,
  clearLabel,
  disabled = false,
  emptyLabel,
  label,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  triggerClassName,
  value,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedOption = useMemo(() => options.find((option) => option.value === value), [options, value]);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((option) => {
      const haystack = [option.label, option.value, ...(option.keywords ?? [])].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, options]);
  const hasExactMatch = options.some((option) => option.label.toLowerCase() === normalizedQuery || option.value.toLowerCase() === normalizedQuery);

  function selectValue(nextValue: string) {
    onValueChange(nextValue);
    setIsOpen(false);
    setQuery("");
  }

  return (
    <>
      <Button
        className={cn(
          "justify-between rounded-2xl border-border/60 bg-background/80 px-4 text-left shadow-sm hover:bg-background",
          !selectedOption && !value ? "text-muted-foreground" : "text-foreground",
          triggerClassName
        )}
        disabled={disabled}
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
      >
        <span className="truncate">{selectedOption?.label ?? (value || placeholder)}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="sheet-surface flex max-h-[88vh] flex-col rounded-t-[28px] border-border/70 px-0 pb-0" side="bottom">
          <SheetHeader className="px-5 pt-2 text-left">
            <SheetTitle>{label}</SheetTitle>
            <SheetDescription>{placeholder}</SheetDescription>
          </SheetHeader>

          <div className="border-b border-border/60 px-5 pb-4 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                className="h-11 rounded-2xl border-border/60 bg-background/85 pl-9"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-3 py-3">
            <div className="space-y-2 pb-4">
              {clearLabel && value ? (
                <ListButton isSelected={false} label={clearLabel} onClick={() => selectValue("")} />
              ) : null}

              {filteredOptions.map((option) => (
                <ListButton
                  key={option.value}
                  description={option.description}
                  isSelected={option.value === value}
                  label={option.label}
                  onClick={() => selectValue(option.value)}
                />
              ))}

              {allowCustomValue && normalizedQuery && !hasExactMatch ? (
                <ListButton
                  isSelected={false}
                  label={`Use "${query.trim()}"`}
                  onClick={() => selectValue(query.trim())}
                />
              ) : null}

              {!filteredOptions.length && (!allowCustomValue || hasExactMatch || !normalizedQuery) ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
              ) : null}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ListButton({
  description,
  isSelected,
  label,
  onClick,
}: {
  description?: string;
  isSelected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
        isSelected ? "border-primary/40 bg-primary/8" : "border-border/50 bg-background/70 hover:bg-muted/70"
      )}
      type="button"
      onClick={onClick}
    >
      <span className="min-w-0 space-y-1">
        <span className="block truncate font-medium">{label}</span>
        {description ? <span className="block text-xs text-muted-foreground">{description}</span> : null}
      </span>
      {isSelected ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : null}
    </button>
  );
}
