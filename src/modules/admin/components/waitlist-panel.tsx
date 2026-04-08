"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { patchPortalAction } from "@/lib/demo/portal-client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface WaitlistRow {
  createdAt: string;
  id: string;
  listingTitle: string;
  position: number;
  requesterName: string;
  status: string;
}

export function WaitlistPanel({ rows }: { rows: WaitlistRow[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function updateWaitlist(waitlistId: string, status: "promoted" | "removed") {
    startTransition(async () => {
      try {
        await patchPortalAction("update_waitlist", { waitlistId, status });
        toast({ title: "Waitlist updated", description: `Entry marked ${status}.` });
        router.refresh();
      } catch (error) {
        toast({ title: "Update failed", description: error instanceof Error ? error.message : "The waitlist entry could not be updated.", variant: "destructive" });
      }
    });
  }

  return (
    <Card className="border-border/60 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Waitlist Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requester</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.requesterName}</TableCell>
                <TableCell>{row.listingTitle}</TableCell>
                <TableCell>{row.position}</TableCell>
                <TableCell><Badge variant="secondary">{row.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button disabled={isPending || row.status !== "active"} size="sm" type="button" onClick={() => updateWaitlist(row.id, "promoted")}>Promote</Button>
                    <Button disabled={isPending || row.status !== "active"} size="sm" type="button" variant="outline" onClick={() => updateWaitlist(row.id, "removed")}>Remove</Button>
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
