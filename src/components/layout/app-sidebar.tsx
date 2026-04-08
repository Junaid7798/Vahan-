"use client";

import { Car, LayoutDashboard, ListChecks, MessageSquare, Settings, ShieldCheck, Store, User, Users, WalletCards } from "lucide-react";
import { useTranslations } from "next-intl";
import { SignOutButton } from "@/components/auth/session-actions";
import { NavLink } from "@/i18n/navigation";
import { UserRole } from "@/lib/supabase/permissions";

interface AppSidebarProps {
  role: UserRole;
}

const userSections = [
  {
    items: [
      { href: "/app", icon: LayoutDashboard, label: "dashboard" },
      { href: "/app/inventory", icon: Car, label: "inventory" },
      { href: "/app/reserved", icon: WalletCards, label: "reserved" },
      { href: "/app/sold", icon: ShieldCheck, label: "sold" },
    ],
    title: "browse",
  },
  {
    items: [
      { href: "/app/chat", icon: MessageSquare, label: "chat" },
      { href: "/app/inquiries", icon: ListChecks, label: "inquiries" },
      { href: "/app/my-requests", icon: Store, label: "myRequests" },
      { href: "/app/profile", icon: User, label: "profile" },
    ],
    title: "workspace",
  },
] as const;

const staffSections = [
  {
    items: [
      { href: "/app", icon: LayoutDashboard, label: "dashboard" },
      { href: "/app/inventory", icon: Car, label: "inventory" },
      { href: "/app/reserved", icon: WalletCards, label: "reserved" },
      { href: "/app/sold", icon: ShieldCheck, label: "sold" },
      { href: "/app/admin/chat", icon: MessageSquare, label: "chat" },
      { href: "/app/inquiries", icon: ListChecks, label: "inquiries" },
    ],
    title: "operations",
  },
  {
    items: [
      { href: "/app/admin/users", icon: Users, label: "users" },
      { href: "/app/admin/vehicles", icon: Car, label: "vehicles" },
      { href: "/app/admin/seller-submissions", icon: Store, label: "sellerSubmissions" },
      { href: "/app/admin/reservation-requests", icon: WalletCards, label: "reservationRequests" },
      { href: "/app/admin/waitlist", icon: ListChecks, label: "waitlist" },
      { href: "/app/admin/resale-requests", icon: ShieldCheck, label: "resaleRequests" },
      { href: "/app/admin/settings", icon: Settings, label: "settings" },
      { href: "/app/profile", icon: User, label: "profile" },
    ],
    title: "control",
  },
] as const;

export function AppSidebar({ role }: AppSidebarProps) {
  const navT = useTranslations("nav");
  const authT = useTranslations("auth");
  const sidebarT = useTranslations("sidebar");
  const sections = role === "user" ? userSections : staffSections;

  return (
    <div className="flex h-full flex-col bg-transparent px-4 py-5">
      <div className="shell-card rounded-[28px] border p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <NavLink className="rounded-2xl px-3 py-3 text-base font-semibold text-foreground" href="/app">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]">
            <Store className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span>Vahan</span>
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">{role}</span>
          </div>
        </NavLink>
      </div>

      <nav className="mt-6 flex-1 space-y-5 overflow-y-auto pr-1">
        {sections.map((section) => (
          <div key={section.title} className="space-y-2">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{sidebarT(section.title)}</p>
            <div className="shell-card space-y-1 rounded-[28px] border p-2 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
              {section.items.map((item) => (
                <NavLink key={item.href} className="rounded-2xl px-3 py-3 text-sm" href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {navT(item.label)}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shell-card mt-5 rounded-[28px] border p-3 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <SignOutButton className="flex w-full items-center justify-start gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" variant="ghost">
          {authT("logout")}
        </SignOutButton>
      </div>
    </div>
  );
}
