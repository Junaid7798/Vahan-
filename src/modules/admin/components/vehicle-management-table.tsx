"use client";

import { useTransition } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface VehicleManagementRow {
  listingId: string;
  location?: string;
  make: string;
  model: string;
  status: string;
  stockId: string;
  updatedAt: string;
  year: number;
}

interface VehicleManagementTableProps {
  locale: string;
  rows: VehicleManagementRow[];
}

export function VehicleManagementTable({ locale, rows }: VehicleManagementTableProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function deleteVehicle(listingId: string) {
    startTransition(async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_SUPABASE_URL ? "/api/vehicles" : "/api/demo/vehicles";
        const response = await fetch(`${basePath}/${listingId}`, { method: "DELETE" });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "The vehicle could not be deleted.");
        }

        toast({ title: "Vehicle deleted", description: "The listing and its related queue items were removed." });
        router.refresh();
      } catch (error) {
        toast({
          title: "Delete failed",
          description: error instanceof Error ? error.message : "The vehicle could not be deleted.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Stock ID</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.listingId}>
            <TableCell className="font-medium">{row.stockId}</TableCell>
            <TableCell>{row.year} {row.make} {row.model}</TableCell>
            <TableCell>{row.status === "published" ? "available" : row.status}</TableCell>
            <TableCell>{row.location}</TableCell>
            <TableCell>{new Date(row.updatedAt).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN")}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline"><Link href={`/app/vehicles/${row.listingId}`}>Open</Link></Button>
                <Button asChild size="sm"><Link href={`/app/admin/vehicles/${row.listingId}/edit`}>Edit</Link></Button>
                <Button disabled={isPending} size="sm" type="button" variant="destructive" onClick={() => deleteVehicle(row.listingId)}>
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
