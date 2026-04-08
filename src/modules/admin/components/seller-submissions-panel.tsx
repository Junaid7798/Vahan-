"use client";

import { useMemo, useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { patchPortalAction } from "@/lib/demo/portal-client";
import { SellerSubmissionInput, SellerSubmissionRecord } from "@/lib/demo/portal-types";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VehicleSubmissionForm } from "@/modules/requests/components/vehicle-submission-form";

interface SellerSubmissionsPanelProps {
  locale: string;
  rows: SellerSubmissionRecord[];
}

function getStatusLabel(locale: string, status: SellerSubmissionRecord["status"]) {
  const labels = locale === "hi"
    ? { changes_requested: "बदलाव चाहिए", pending: "लंबित", rejected: "अस्वीकृत", reviewed: "समीक्षित" }
    : { changes_requested: "Changes requested", pending: "Pending", rejected: "Rejected", reviewed: "Reviewed" };

  return labels[status];
}

export function SellerSubmissionsPanel({ locale, rows }: SellerSubmissionsPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const activeRecord = useMemo(() => rows.find((row) => row.id === editingId) ?? null, [editingId, rows]);

  function refreshWithToast(title: string, description: string) {
    toast({ title, description });
    setEditingId(null);
    router.refresh();
  }

  function updateSubmission(action: string, payload: Record<string, unknown>, successTitle: string, successDescription: string) {
    startTransition(async () => {
      try {
        await patchPortalAction(action, payload);
        refreshWithToast(successTitle, successDescription);
      } catch (error) {
        toast({
          title: "Update failed",
          description: error instanceof Error ? error.message : "The submission could not be updated.",
          variant: "destructive",
        });
      }
    });
  }

  function saveSubmission(payload: SellerSubmissionInput) {
    if (!activeRecord) return;
    updateSubmission("edit_submission", { submissionId: activeRecord.id, ...payload }, "Submission updated", "The seller intake record was updated.");
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Seller Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.sellerName}</TableCell>
                  <TableCell>{row.vehicleSummary}</TableCell>
                  <TableCell><Badge variant="secondary">{getStatusLabel(locale, row.status)}</Badge></TableCell>
                  <TableCell>{new Date(row.submittedAt).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN")}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {row.linkedListingId ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/app/admin/vehicles/${row.linkedListingId}/edit`}>Open listing</Link>
                        </Button>
                      ) : (
                        <Button disabled={isPending} size="sm" type="button" onClick={() => updateSubmission("create_listing_from_submission", { submissionId: row.id }, "Listing created", "The submission is now a staff-managed draft listing.")}>
                          Create listing
                        </Button>
                      )}
                      <Button disabled={isPending} size="sm" type="button" variant="outline" onClick={() => setEditingId(row.id)}>
                        Edit
                      </Button>
                      <Button disabled={isPending || row.status === "reviewed"} size="sm" type="button" variant="outline" onClick={() => updateSubmission("update_submission", { submissionId: row.id, status: "reviewed" }, "Submission reviewed", "The intake record was marked reviewed.")}>
                        Mark reviewed
                      </Button>
                      <Button disabled={isPending || row.status === "changes_requested"} size="sm" type="button" variant="outline" onClick={() => updateSubmission("update_submission", { submissionId: row.id, status: "changes_requested" }, "Changes requested", "The seller has been flagged for an updated submission.")}>
                        Request changes
                      </Button>
                      <Button disabled={isPending || row.status === "rejected"} size="sm" type="button" variant="secondary" onClick={() => updateSubmission("update_submission", { submissionId: row.id, status: "rejected" }, "Submission rejected", "The seller submission was rejected.")}>
                        Reject
                      </Button>
                      <Button disabled={isPending} size="sm" type="button" variant="destructive" onClick={() => updateSubmission("delete_submission", { submissionId: row.id }, "Submission deleted", "The intake record was removed.")}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {activeRecord ? (
        <VehicleSubmissionForm
          key={activeRecord.id}
          defaultSeller={{ email: activeRecord.email ?? "", phone: activeRecord.phone, sellerName: activeRecord.sellerName }}
          initialRecord={activeRecord}
          isPending={isPending}
          locale={locale}
          onCancel={() => setEditingId(null)}
          onSubmit={saveSubmission}
          submitLabel="Save submission"
          title={`Edit ${activeRecord.vehicleSummary}`}
        />
      ) : null}
    </div>
  );
}
