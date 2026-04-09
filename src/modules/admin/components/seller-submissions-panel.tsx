"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { patchPortalAction } from "@/lib/demo/portal-client";
import { SellerSubmissionInput, SellerSubmissionRecord } from "@/lib/demo/portal-types";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleSubmissionForm } from "@/modules/requests/components/vehicle-submission-form";

interface SellerSubmissionsPanelProps {
  locale: string;
  rows: SellerSubmissionRecord[];
}

export function SellerSubmissionsPanel({ locale, rows }: SellerSubmissionsPanelProps) {
  const t = useTranslations("sellerQueue");
  const statusT = useTranslations("status");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const activeRecord = rows.find((row) => row.id === editingId) ?? null;

  function refreshWithToast(title: string, description: string) {
    toast({ title, description });
    setEditingId(null);
    router.refresh();
  }

  function getStatusLabel(status: SellerSubmissionRecord["status"]) {
    return status === "changes_requested" ? t("changesRequested") : statusT(status);
  }

  function updateSubmission(action: string, payload: Record<string, unknown>, successTitle: string, successDescription: string) {
    startTransition(async () => {
      try {
        await patchPortalAction(action, payload);
        refreshWithToast(successTitle, successDescription);
      } catch (error) {
        toast({ title: t("updateFailedTitle"), description: error instanceof Error ? error.message : t("updateFailedDescription"), variant: "destructive" });
      }
    });
  }

  function saveSubmission(payload: SellerSubmissionInput) {
    if (!activeRecord) return;
    updateSubmission("edit_submission", { submissionId: activeRecord.id, ...payload }, t("updatedTitle"), t("updatedDescription"));
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </header>

      <div className="grid gap-4">
        {rows.map((row) => (
          <Card key={row.id} className="section-surface shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{row.vehicleSummary}</CardTitle>
                  <p className="text-sm text-muted-foreground">{row.sellerName}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{getStatusLabel(row.status)}</Badge>
                    {row.linkedListingId ? <Badge>{t("listingCreated")}</Badge> : null}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{new Date(row.submittedAt).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN")}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{row.description}</p>
              <div className="flex flex-wrap gap-2">
                {row.linkedListingId ? (
                  <Button asChild size="sm" variant="outline"><Link href={`/app/admin/vehicles/${row.linkedListingId}/edit`}>{t("openListing")}</Link></Button>
                ) : (
                  <Button disabled={isPending} size="sm" type="button" onClick={() => updateSubmission("create_listing_from_submission", { submissionId: row.id }, t("listingCreatedTitle"), t("listingCreatedDescription"))}>{t("createListing")}</Button>
                )}
                <Button disabled={isPending} size="sm" type="button" variant="outline" onClick={() => setEditingId(row.id)}>{t("edit")}</Button>
                <Button disabled={isPending || row.status === "reviewed"} size="sm" type="button" variant="outline" onClick={() => updateSubmission("update_submission", { submissionId: row.id, status: "reviewed" }, t("reviewedTitle"), t("reviewedDescription"))}>{t("markReviewed")}</Button>
                <Button disabled={isPending || row.status === "changes_requested"} size="sm" type="button" variant="outline" onClick={() => updateSubmission("update_submission", { submissionId: row.id, status: "changes_requested" }, t("changesRequestedTitle"), t("changesRequestedDescription"))}>{t("requestChanges")}</Button>
                <Button disabled={isPending || row.status === "rejected"} size="sm" type="button" variant="secondary" onClick={() => updateSubmission("update_submission", { submissionId: row.id, status: "rejected" }, t("rejectedTitle"), t("rejectedDescription"))}>{t("reject")}</Button>
                <Button disabled={isPending} size="sm" type="button" variant="destructive" onClick={() => updateSubmission("delete_submission", { submissionId: row.id }, t("deletedTitle"), t("deletedDescription"))}>{t("delete")}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeRecord ? (
        <VehicleSubmissionForm
          key={activeRecord.id}
          defaultSeller={{ email: activeRecord.email ?? "", phone: activeRecord.phone, sellerName: activeRecord.sellerName }}
          initialRecord={activeRecord}
          isPending={isPending}
          locale={locale}
          onCancel={() => setEditingId(null)}
          onSubmit={saveSubmission}
          submitLabel={t("save")}
          title={t("editPanelTitle", { vehicle: activeRecord.vehicleSummary })}
        />
      ) : null}
    </div>
  );
}
