import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { requireViewer } from "@/lib/auth/viewer";
import { getDashboardData } from "@/lib/portal/operations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dashboardT = await getTranslations({ locale, namespace: "dashboard" });
  const viewer = await requireViewer(locale);
  const dashboard = await getDashboardData(viewer.profile.id, viewer.permissions);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="shell-card rounded-[34px] border p-7 shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {dashboard.mode === "staff" ? dashboardT("staffLabel") : dashboardT("userLabel")}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight">
            {dashboard.mode === "staff" ? dashboardT("staffTitle") : dashboardT("userTitle")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {dashboard.mode === "staff" ? dashboardT("staffDescription") : dashboardT("userDescription")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={dashboard.mode === "staff" ? "/app/admin/vehicles/new" : "/app/inventory"}>
                {dashboard.mode === "staff" ? dashboardT("addVehicle") : dashboardT("browseInventory")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={dashboard.mode === "staff" ? "/app/admin/chat" : "/app/chat"}>
                {dashboard.mode === "staff" ? dashboardT("openChatInbox") : dashboardT("openChat")}
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={dashboard.mode === "staff" ? "/app/admin/reservation-requests" : "/app/my-requests"}>
                {dashboard.mode === "staff" ? dashboardT("reviewReservations") : dashboardT("openMyRequests")}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          {dashboard.stats.slice(0, 4).map((item) => (
            <div
              key={item.label}
              className="shell-card rounded-[28px] border p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{dashboardT(item.label)}</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {dashboard.mode === "staff" ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <QueueBlock
              href="/app/admin/reservation-requests"
              items={dashboard.queues.reservations.map(
                (item) => `${dashboard.vehicleTitles.get(item.listingId) ?? item.listingId} • ${item.status}`
              )}
              title={dashboardT("reservationReviewQueue")}
            />
            <QueueBlock
              href="/app/admin/seller-submissions"
              items={dashboard.queues.submissions.map((item) => `${item.vehicleSummary} • ${item.status}`)}
              title={dashboardT("sellerSubmissions")}
            />
            <QueueBlock
              href="/app/admin/resale-requests"
              items={dashboard.queues.resales.map(
                (item) => `${dashboard.vehicleTitles.get(item.listingId) ?? item.listingId} • ${item.status}`
              )}
              title={dashboardT("resaleQueue")}
            />
            <QueueBlock
              href="/app/inquiries"
              items={dashboard.queues.inquiries.map(
                (item) => `${item.subject} • ${dashboard.vehicleTitles.get(item.listingId) ?? item.listingId}`
              )}
              title={dashboardT("openInquiries")}
            />
          </div>
          <Card className="shell-card rounded-[28px] shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <CardHeader>
              <CardTitle>{dashboardT("recentActivity")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboard.queues.activities.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/60 bg-background px-4 py-4">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <SummaryBlock
            href="/app/inventory"
            items={dashboard.recent.available.map((record) => `${record.year} ${record.make} ${record.model}`)}
            title={dashboardT("latestAvailable")}
          />
          <SummaryBlock
            href="/app/reserved"
            items={dashboard.recent.reserved.map((record) => `${record.year} ${record.make} ${record.model}`)}
            title={dashboardT("reservedWatchlist")}
          />
          <SummaryBlock
            href="/app/sold"
            items={dashboard.recent.sold.map((record) => `${record.year} ${record.make} ${record.model}`)}
            title={dashboardT("soldShowcase")}
          />
          <SummaryBlock
            href="/app/inquiries"
            items={dashboard.recent.inquiries.map((record) => record.subject ?? dashboardT("inquiryFallback"))}
            title={dashboardT("recentInquiries")}
          />
        </div>
      )}
    </div>
  );
}

function QueueBlock({ href, items, title }: { href: string; items: string[]; title: string }) {
  return (
    <Card className="shell-card rounded-[28px] shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button asChild size="sm" variant="ghost">
          <Link href={href}>Open</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? <p className="text-sm text-muted-foreground">Nothing waiting right now.</p> : null}
        {items.map((item) => (
          <div key={item} className="rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm">
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SummaryBlock({ href, items, title }: { href: string; items: string[]; title: string }) {
  return (
    <Card className="shell-card rounded-[28px] shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button asChild size="sm" variant="ghost">
          <Link href={href}>Open</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? <p className="text-sm text-muted-foreground">No items yet.</p> : null}
        {items.map((item) => (
          <div key={item} className="rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm">
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
