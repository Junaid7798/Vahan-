"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { patchPortalAction } from "@/lib/demo/portal-client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ReservationRow {
  createdAt: string;
  id: string;
  listingTitle: string;
  priority: string;
  requesterName: string;
  status: string;
}

export function ReservationRequestsPanel({ rows }: { rows: ReservationRow[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function updateReservation(reservationId: string, status: "approved" | "rejected") {
    startTransition(async () => {
      try {
        await patchPortalAction("update_reservation", { reservationId, status });
        toast({ title: "Reservation updated", description: `Request marked ${status}.` });
        router.refresh();
      } catch (error) {
        toast({ title: "Update failed", description: error instanceof Error ? error.message : "The request could not be updated.", variant: "destructive" });
      }
    });
  }

  return (
    <Card className="border-border/60 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Reservation Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requester</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.requesterName}</TableCell>
                <TableCell>{row.listingTitle}</TableCell>
                <TableCell><Badge variant="secondary">{row.status}</Badge></TableCell>
                <TableCell>{row.priority}</TableCell>
                <TableCell>{new Date(row.createdAt).toLocaleDateString("en-IN")}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button disabled={isPending || row.status !== "pending"} size="sm" type="button" onClick={() => updateReservation(row.id, "approved")}>Approve</Button>
                    <Button disabled={isPending || row.status !== "pending"} size="sm" type="button" variant="outline" onClick={() => updateReservation(row.id, "rejected")}>Reject</Button>
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
