import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireViewer } from "@/lib/auth/viewer";
import { getRequestsForViewer } from "@/lib/demo/portal-operations";
import { MySubmissionsPanel } from "@/modules/requests/components/my-submissions-panel";

export default async function MyRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const viewer = await requireViewer(locale);
  const requests = await getRequestsForViewer(viewer.profile.id);
  const copy = locale === "hi"
    ? {
        description: "आरक्षण, वेटलिस्ट और अपने अपलोड एक ही जगह से ट्रैक करें।",
        eyebrow: "मेरी गतिविधि",
        reservations: "आरक्षण अनुरोध",
        requests: "मेरे अनुरोध",
        resales: "पुनर्विक्रय अनुरोध",
        title: "अनुरोध केंद्र",
        uploads: "मेरे अपलोड",
        waitlist: "वेटलिस्ट",
      }
    : {
        description: "Follow reservation requests, waitlist entries, resale activity, and your uploaded vehicles from one place.",
        eyebrow: "My Activity",
        reservations: "Reservation Requests",
        requests: "My Requests",
        resales: "Resale Requests",
        title: "Requests center",
        uploads: "My Uploads",
        waitlist: "Waitlist",
      };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{copy.eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{copy.description}</p>
      </div>

      <Card className="border-border/60 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>{copy.requests}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="uploads">
            <TabsList className="h-auto flex-wrap justify-start">
              <TabsTrigger value="uploads">{copy.uploads}</TabsTrigger>
              <TabsTrigger value="reservations">{copy.reservations}</TabsTrigger>
              <TabsTrigger value="waitlist">{copy.waitlist}</TabsTrigger>
              <TabsTrigger value="resales">{copy.resales}</TabsTrigger>
            </TabsList>
            <TabsContent value="uploads">
              <MySubmissionsPanel
                defaultSeller={{
                  email: viewer.user.email ?? "",
                  phone: viewer.profile.phone ?? "",
                  sellerName: viewer.profile.full_name ?? "",
                }}
                locale={locale}
                rows={requests.submissions}
              />
            </TabsContent>
            <TabsContent value="reservations"><RequestTable rows={requests.reservations.map((item) => ({ id: item.id, listing: item.listingTitle, status: item.status, createdAt: item.createdAt }))} /></TabsContent>
            <TabsContent value="waitlist"><RequestTable rows={requests.waitlist.map((item) => ({ id: item.id, listing: item.listingTitle, status: `Position ${item.position} / ${item.status}`, createdAt: item.createdAt }))} /></TabsContent>
            <TabsContent value="resales"><RequestTable rows={requests.resales.map((item) => ({ id: item.id, listing: item.listingTitle, status: item.status, createdAt: item.createdAt }))} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function RequestTable({
  rows,
}: {
  rows: Array<{ id: string; listing: string; status: string; createdAt: string }>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Request</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.id}</TableCell>
            <TableCell>{row.listing}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell>{new Date(row.createdAt).toLocaleDateString("en-IN")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
