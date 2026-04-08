"use client";

import { useMemo, useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { patchPortalAction, postPortalAction } from "@/lib/demo/portal-client";
import { SellerSubmissionInput, SellerSubmissionRecord } from "@/lib/demo/portal-types";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleSubmissionForm } from "@/modules/requests/components/vehicle-submission-form";

interface MySubmissionsPanelProps {
  defaultSeller: { email: string; phone: string; sellerName: string };
  locale: string;
  rows: Array<SellerSubmissionRecord & { linkedListingTitle?: string }>;
}

function getStatusLabel(locale: string, status: SellerSubmissionRecord["status"]) {
  const labels = locale === "hi"
    ? { changes_requested: "बदलाव चाहिए", pending: "लंबित", rejected: "अस्वीकृत", reviewed: "समीक्षित" }
    : { changes_requested: "Changes requested", pending: "Pending", rejected: "Rejected", reviewed: "Reviewed" };

  return labels[status];
}

export function MySubmissionsPanel({ defaultSeller, locale, rows }: MySubmissionsPanelProps) {
  const [editingId, setEditingId] = useState<string | "new" | null>(rows.length ? null : "new");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const activeRecord = useMemo(() => rows.find((row) => row.id === editingId) ?? null, [editingId, rows]);
  const copy = locale === "hi"
    ? { add: "नया वाहन जोड़ें", empty: "आपके अपलोड यहां दिखाई देंगे।", remove: "हटाएं", save: "अपलोड सहेजें", title: "मेरे अपलोड", updated: "अपडेट किया गया", uploaded: "अपलोड किया गया" }
    : { add: "Add vehicle upload", empty: "Your uploads will appear here once you start a submission.", remove: "Remove", save: "Save upload", title: "My uploads", updated: "Updated", uploaded: "Uploaded" };

  function refreshAfterSuccess(title: string, description: string) {
    toast({ title, description });
    setEditingId(null);
    router.refresh();
  }

  function saveSubmission(submissionId: string | null) {
    return async (payload: SellerSubmissionInput) => {
      startTransition(async () => {
        try {
          if (submissionId) {
            await patchPortalAction("edit_submission", { submissionId, ...payload });
            refreshAfterSuccess("Upload updated", "Your vehicle submission is back in the review queue.");
            return;
          }

          await postPortalAction("create_submission", payload);
          refreshAfterSuccess("Upload created", "Your vehicle was added to the seller intake queue.");
        } catch (error) {
          toast({
            title: "Save failed",
            description: error instanceof Error ? error.message : "The upload could not be saved.",
            variant: "destructive",
          });
        }
      });
    };
  }

  function deleteSubmission(submissionId: string) {
    startTransition(async () => {
      try {
        await patchPortalAction("delete_submission", { submissionId });
        refreshAfterSuccess("Upload removed", "The vehicle submission was deleted.");
      } catch (error) {
        toast({
          title: "Delete failed",
          description: error instanceof Error ? error.message : "The upload could not be removed.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{copy.title}</h2>
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        </div>
        <Button disabled={isPending} type="button" onClick={() => setEditingId("new")}>
          {copy.add}
        </Button>
      </div>

      <div className="grid gap-4">
        {rows.map((row) => {
          const canEdit = !row.linkedListingId && (row.status === "pending" || row.status === "changes_requested");

          return (
            <Card key={row.id} className="border-border/60 bg-card/90 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{row.vehicleSummary}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{getStatusLabel(locale, row.status)}</Badge>
                    {row.linkedListingId ? <Badge>{row.linkedListingTitle ?? "Live listing created"}</Badge> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {row.linkedListingId ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/app/vehicles/${row.linkedListingId}`}>Open listing</Link>
                    </Button>
                  ) : null}
                  <Button disabled={isPending || !canEdit} size="sm" type="button" variant="outline" onClick={() => setEditingId(row.id)}>
                    Edit
                  </Button>
                  <Button disabled={isPending || !canEdit} size="sm" type="button" variant="destructive" onClick={() => deleteSubmission(row.id)}>
                    {copy.remove}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{row.description}</p>
                <div className="flex flex-wrap gap-4">
                  <span>{copy.uploaded}: {new Date(row.submittedAt).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN")}</span>
                  <span>{copy.updated}: {new Date(row.updatedAt).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN")}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editingId ? (
        <VehicleSubmissionForm
          key={activeRecord?.id ?? "new"}
          defaultSeller={defaultSeller}
          initialRecord={activeRecord}
          isPending={isPending}
          locale={locale}
          onCancel={() => setEditingId(null)}
          onSubmit={saveSubmission(activeRecord?.id ?? null)}
          submitLabel={copy.save}
          title={editingId === "new" ? copy.add : "Edit vehicle upload"}
        />
      ) : null}
    </div>
  );
}
