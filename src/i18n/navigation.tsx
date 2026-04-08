"use client";

import type { ReactNode } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function NavLink({ href, children, className, onClick }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
        isActive
          ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))] shadow-[0_14px_34px_rgba(15,23,42,0.12)]"
          : "text-muted-foreground hover:bg-black/5 hover:text-foreground",
        className
      )}
      href={href}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
