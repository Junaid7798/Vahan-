"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { patchPortalAction } from "@/lib/demo/portal-client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ResaleRow {
  createdAt: string;
  expectedTimeline: string;
  id: string;
  listingTitle: string;
  requesterName: string;
  status: string;
}

export function ResaleRequestsPanel({ rows }: { rows: ResaleRow[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function updateResale(resaleId: string, status: "approved" | "rejected" | "relisted") {
    startTransition(async () => {
      try {
        await patchPortalAction("update_resale", { resaleId, status });
        toast({ title: "Resale updated", description: `Request marked ${status}.` });
        router.refresh();
      } catch (error) {
        toast({ title: "Update failed", description: error instanceof Error ? error.message : "The resale request could not be updated.", variant: "destructive" });
      }
    });
  }

  return (
    <Card className="border-border/60 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Resale Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requester</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timeline</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.requesterName}</TableCell>
                <TableCell>{row.listingTitle}</TableCell>
                <TableCell><Badge variant="secondary">{row.status}</Badge></TableCell>
                <TableCell>{row.expectedTimeline}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button disabled={isPending || row.status !== "pending"} size="sm" type="button" onClick={() => updateResale(row.id, "approved")}>Approve</Button>
                    <Button disabled={isPending || row.status !== "pending"} size="sm" type="button" variant="outline" onClick={() => updateResale(row.id, "rejected")}>Reject</Button>
                    <Button disabled={isPending || (row.status !== "approved" && row.status !== "relisted")} size="sm" type="button" variant="secondary" onClick={() => updateResale(row.id, "relisted")}>Create relisting</Button>
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
