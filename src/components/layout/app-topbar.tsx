"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, Search } from "lucide-react";
import { AppearanceSwitcher } from "@/components/layout/appearance-switcher";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NotificationCenter, ShellNotification } from "@/components/layout/notification-center";
import { TopbarLocaleSwitcher } from "@/components/layout/topbar-locale-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link, useRouter } from "@/i18n/routing";
import { UserRole } from "@/lib/supabase/permissions";

interface AppTopbarProps {
  initials: string;
  notifications: ShellNotification[];
  role: UserRole;
}

export function AppTopbar({ initials, notifications, role }: AppTopbarProps) {
  const topbarT = useTranslations("topbar");
  const [commandQuery, setCommandQuery] = useState("");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const router = useRouter();
  const actions = useMemo(
    () =>
      role === "user"
        ? [
            { href: "/app/inventory", label: topbarT("browseInventory") },
            { href: "/app/reserved", label: topbarT("viewReserved") },
            { href: "/app/my-requests", label: topbarT("openMyRequests") },
            { href: "/app/chat", label: topbarT("supportChat") },
          ]
        : [
            { href: "/app/admin/vehicles/new", label: topbarT("addVehicle") },
            { href: "/app/admin/reservation-requests", label: topbarT("reviewReservations") },
            { href: "/app/admin/seller-submissions", label: topbarT("sellerSubmissions") },
            { href: "/app/admin/users", label: topbarT("pendingApprovals") },
            { href: "/app/admin/chat", label: topbarT("chatInbox") },
          ],
    [role, topbarT]
  );
  const filteredActions = useMemo(
    () => actions.filter((action) => action.label.toLowerCase().includes(commandQuery.toLowerCase())),
    [actions, commandQuery]
  );

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsCommandOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button aria-label={topbarT("openNavigation")} className="md:hidden" size="icon" variant="outline">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="p-0" side="left">
            <SheetHeader className="sr-only">
              <SheetTitle>{topbarT("navigationTitle")}</SheetTitle>
              <SheetDescription>{topbarT("navigationDescription")}</SheetDescription>
            </SheetHeader>
            <AppSidebar role={role} />
          </SheetContent>
        </Sheet>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{topbarT("workspace")}</p>
          <p className="text-sm text-foreground/80">{topbarT("workspaceSubtitle")}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Sheet open={isCommandOpen} onOpenChange={setIsCommandOpen}>
          <SheetTrigger asChild>
            <Button className="hidden items-center gap-2 rounded-2xl border-border/60 bg-white/80 px-4 text-muted-foreground shadow-sm md:flex" type="button" variant="outline">
              <Search className="h-4 w-4" />
              {topbarT("quickActions")}
              <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Ctrl K
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full max-w-md rounded-l-[28px] border-border/60 bg-white/95 p-0" side="right">
            <div className="space-y-5 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{topbarT("quickActions")}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">{topbarT("moveFaster")}</h2>
              </div>
              <Input placeholder={topbarT("searchActions")} value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} />
              <div className="space-y-2">
                {filteredActions.map((action) => (
                  <Button
                    key={action.href}
                    className="w-full justify-start rounded-2xl"
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsCommandOpen(false);
                      router.push(action.href);
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <NotificationCenter items={notifications} />
        <TopbarLocaleSwitcher />
        <AppearanceSwitcher />

        <Button aria-label={topbarT("profile")} asChild className="rounded-full bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))] hover:bg-[hsl(var(--sidebar-accent))]" size="icon" variant="ghost">
          <Link href="/app/profile">
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold">{initials}</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
