"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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

export function MySubmissionsPanel({ defaultSeller, locale, rows }: MySubmissionsPanelProps) {
  const t = useTranslations("submissions");
  const statusT = useTranslations("status");
  const [editingId, setEditingId] = useState<string | "new" | null>(rows.length ? null : "new");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const activeRecord = rows.find((row) => row.id === editingId) ?? null;

  function refreshAfterSuccess(title: string, description: string) {
    toast({ title, description });
    setEditingId(null);
    router.refresh();
  }

  function getStatusLabel(status: SellerSubmissionRecord["status"]) {
    return status === "changes_requested" ? t("changesRequested") : statusT(status);
  }

  function saveSubmission(submissionId: string | null) {
    return async (payload: SellerSubmissionInput) => {
      startTransition(async () => {
        try {
          if (submissionId) {
            await patchPortalAction("edit_submission", { submissionId, ...payload });
            refreshAfterSuccess(t("updatedTitle"), t("updatedDescription"));
            return;
          }

          await postPortalAction("create_submission", payload);
          refreshAfterSuccess(t("createdTitle"), t("createdDescription"));
        } catch (error) {
          toast({ title: t("saveFailedTitle"), description: error instanceof Error ? error.message : t("saveFailedDescription"), variant: "destructive" });
        }
      });
    };
  }

  function deleteSubmission(submissionId: string) {
    startTransition(async () => {
      try {
        await patchPortalAction("delete_submission", { submissionId });
        refreshAfterSuccess(t("removedTitle"), t("removedDescription"));
      } catch (error) {
        toast({ title: t("deleteFailedTitle"), description: error instanceof Error ? error.message : t("deleteFailedDescription"), variant: "destructive" });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button disabled={isPending} type="button" onClick={() => setEditingId("new")}>{t("add")}</Button>
      </div>

      <div className="grid gap-4">
        {rows.map((row) => {
          const canEdit = !row.linkedListingId && (row.status === "pending" || row.status === "changes_requested");

          return (
            <Card key={row.id} className="section-surface shadow-sm">
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{row.vehicleSummary}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{getStatusLabel(row.status)}</Badge>
                    {row.linkedListingId ? <Badge>{row.linkedListingTitle ?? t("liveListingCreated")}</Badge> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {row.linkedListingId ? <Button asChild size="sm" variant="outline"><Link href={`/app/vehicles/${row.linkedListingId}`}>{t("openListing")}</Link></Button> : null}
                  <Button disabled={isPending || !canEdit} size="sm" type="button" variant="outline" onClick={() => setEditingId(row.id)}>{t("edit")}</Button>
                  <Button disabled={isPending || !canEdit} size="sm" type="button" variant="destructive" onClick={() => deleteSubmission(row.id)}>{t("remove")}</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{row.description}</p>
                <div className="flex flex-wrap gap-4">
                  <span>{t("uploadedOn")}: {new Date(row.submittedAt).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN")}</span>
                  <span>{t("updatedOn")}: {new Date(row.updatedAt).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN")}</span>
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
          submitLabel={t("save")}
          title={editingId === "new" ? t("add") : t("editUpload")}
        />
      ) : null}
    </div>
  );
}
