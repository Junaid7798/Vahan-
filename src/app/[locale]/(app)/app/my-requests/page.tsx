import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireViewer } from "@/lib/auth/viewer";
import { getRequestsForViewer } from "@/lib/portal/operations";
import { MySubmissionsPanel } from "@/modules/requests/components/my-submissions-panel";

interface RequestPageCopy {
  created: string;
  description: string;
  eyebrow: string;
  request: string;
  requests: string;
  reservations: string;
  resales: string;
  status: string;
  title: string;
  uploads: string;
  vehicle: string;
  waitlist: string;
}

function getCopy(locale: string): RequestPageCopy {
  if (locale === "hi") {
    return {
      created: "\u092c\u0928\u093e\u092f\u093e \u0917\u092f\u093e",
      description: "\u0906\u0930\u0915\u094d\u0937\u0923 \u0905\u0928\u0941\u0930\u094b\u0927, \u0935\u0947\u091f\u0932\u093f\u0938\u094d\u091f, \u092a\u0941\u0928\u0930\u094d\u0935\u093f\u0915\u094d\u0930\u092f \u0917\u0924\u093f\u0935\u093f\u0927\u093f \u0914\u0930 \u0905\u092a\u0928\u0947 \u0905\u092a\u0932\u094b\u0921 \u090f\u0915 \u0939\u0940 \u091c\u0917\u0939 \u0938\u0947 \u091f\u094d\u0930\u0948\u0915 \u0915\u0930\u0947\u0902\u0964",
      eyebrow: "\u092e\u0947\u0930\u0940 \u0917\u0924\u093f\u0935\u093f\u0927\u093f",
      request: "\u0905\u0928\u0941\u0930\u094b\u0927",
      requests: "\u092e\u0947\u0930\u0947 \u0905\u0928\u0941\u0930\u094b\u0927",
      reservations: "\u0906\u0930\u0915\u094d\u0937\u0923 \u0905\u0928\u0941\u0930\u094b\u0927",
      resales: "\u092a\u0941\u0928\u0930\u094d\u0935\u093f\u0915\u094d\u0930\u092f \u0905\u0928\u0941\u0930\u094b\u0927",
      status: "\u0938\u094d\u0925\u093f\u0924\u093f",
      title: "\u0905\u0928\u0941\u0930\u094b\u0927 \u0915\u0947\u0902\u0926\u094d\u0930",
      uploads: "\u092e\u0947\u0930\u0947 \u0905\u092a\u0932\u094b\u0921",
      vehicle: "\u0935\u093e\u0939\u0928",
      waitlist: "\u0935\u0947\u091f\u0932\u093f\u0938\u094d\u091f",
    };
  }

  return {
    created: "Created",
    description: "Follow reservation requests, waitlist entries, resale activity, and your uploaded vehicles from one place.",
    eyebrow: "My Activity",
    request: "Request",
    requests: "My Requests",
    reservations: "Reservation Requests",
    resales: "Resale Requests",
    status: "Status",
    title: "Requests center",
    uploads: "My Uploads",
    vehicle: "Vehicle",
    waitlist: "Waitlist",
  };
}

export default async function MyRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const viewer = await requireViewer(locale);
  const requests = await getRequestsForViewer(viewer.profile.id);
  const copy = getCopy(locale);

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
            <TabsContent value="reservations">
              <RequestTable
                copy={copy}
                rows={requests.reservations.map((item) => ({
                  createdAt: item.createdAt,
                  id: item.id,
                  listing: item.listingTitle,
                  status: item.status,
                }))}
              />
            </TabsContent>
            <TabsContent value="waitlist">
              <RequestTable
                copy={copy}
                rows={requests.waitlist.map((item) => ({
                  createdAt: item.createdAt,
                  id: item.id,
                  listing: item.listingTitle,
                  status: `Position ${item.position} / ${item.status}`,
                }))}
              />
            </TabsContent>
            <TabsContent value="resales">
              <RequestTable
                copy={copy}
                rows={requests.resales.map((item) => ({
                  createdAt: item.createdAt,
                  id: item.id,
                  listing: item.listingTitle,
                  status: item.status,
                }))}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function RequestTable({
  copy,
  rows,
}: {
  copy: Pick<RequestPageCopy, "created" | "request" | "status" | "vehicle">;
  rows: Array<{ createdAt: string; id: string; listing: string; status: string }>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{copy.request}</TableHead>
          <TableHead>{copy.vehicle}</TableHead>
          <TableHead>{copy.status}</TableHead>
          <TableHead>{copy.created}</TableHead>
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
