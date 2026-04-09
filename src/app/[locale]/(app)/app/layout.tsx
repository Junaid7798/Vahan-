import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { requireViewer } from "@/lib/auth/viewer";
import { getShellNotifications } from "@/lib/demo/portal-operations";

function getInitials(name: string | null, email: string | null): string {
  const source = name ?? email ?? "User";
  const parts = source.split(" ").filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const viewer = await requireViewer(locale);
  const notifications = await getShellNotifications(viewer.profile.id, viewer.permissions);

  if (viewer.profile.approval_status === "pending_approval") {
    redirect(`/${locale}/pending-approval`);
  }

  if (viewer.profile.approval_status === "rejected" || viewer.profile.approval_status === "disabled") {
    redirect(`/${locale}/access-denied`);
  }

  return (
    <div className="app-shell-background min-h-screen text-foreground">
      <div className="flex min-h-screen">
        <aside className="shell-card hidden w-[292px] shrink-0 border-r md:block">
          <AppSidebar role={viewer.profile.role} />
        </aside>
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-[hsl(var(--background)/0.72)] px-4 py-4 backdrop-blur lg:px-6">
            <AppTopbar
              initials={getInitials(viewer.profile.full_name, viewer.user.email)}
              notifications={notifications}
              role={viewer.profile.role}
            />
          </header>
          <main className="flex-1 px-4 py-6 lg:px-6 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
