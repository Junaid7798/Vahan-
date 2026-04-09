import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  children: ReactNode;
  className?: string;
  description?: string;
  title: string;
}

export function FormSection({ children, className, description, title }: FormSectionProps) {
  return (
    <section className={cn("section-surface space-y-4 rounded-[28px] p-5 shadow-sm", className)}>
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function StickyFormFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-2 border-t border-border/60 px-5 py-4 sticky-form-footer">
      {children}
    </div>
  );
}
