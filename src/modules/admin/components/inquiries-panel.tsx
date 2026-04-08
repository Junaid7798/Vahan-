"use client";

import { useTransition } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { patchPortalAction } from "@/lib/demo/portal-client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface InquiryRow {
  id: string;
  listingId: string;
  listingTitle: string;
  status: string;
  subject: string;
  updatedAt: string;
  userName: string;
}

export function InquiriesPanel({ canManage, rows }: { canManage: boolean; rows: InquiryRow[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function updateInquiry(inquiryId: string, status: "contacted" | "closed") {
    startTransition(async () => {
      try {
        await patchPortalAction("update_inquiry", { inquiryId, status });
        toast({ title: "Inquiry updated", description: `Inquiry marked ${status}.` });
        router.refresh();
      } catch (error) {
        toast({ title: "Update failed", description: error instanceof Error ? error.message : "The inquiry could not be updated.", variant: "destructive" });
      }
    });
  }

  return (
    <Card className="border-border/60 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>{canManage ? "Inquiry Queue" : "My Inquiries"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {canManage ? <TableHead>Requester</TableHead> : null}
              <TableHead>Subject</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {canManage ? <TableCell className="font-medium">{row.userName}</TableCell> : null}
                <TableCell className="font-medium">{row.subject}</TableCell>
                <TableCell>{row.listingTitle}</TableCell>
                <TableCell><Badge variant="secondary">{row.status}</Badge></TableCell>
                <TableCell>{new Date(row.updatedAt).toLocaleDateString("en-IN")}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild size="sm" type="button" variant="outline">
                      <Link href={`/app/vehicles/${row.listingId}`}>Open vehicle</Link>
                    </Button>
                    {canManage ? (
                      <>
                        <Button disabled={isPending || row.status !== "open"} size="sm" type="button" onClick={() => updateInquiry(row.id, "contacted")}>Mark contacted</Button>
                        <Button disabled={isPending || row.status === "closed"} size="sm" type="button" variant="secondary" onClick={() => updateInquiry(row.id, "closed")}>Close</Button>
                      </>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
