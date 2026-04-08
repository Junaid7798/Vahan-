import { SellerSubmissionsPanel } from "@/modules/admin/components/seller-submissions-panel";
import { requireStaff } from "@/lib/auth/viewer";
import { getSupportData } from "@/lib/demo/portal-operations";

export default async function SellerSubmissionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireStaff(locale);
  const data = await getSupportData();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Staff Queue</p>
        <h1 className="text-3xl font-semibold tracking-tight">Seller intake</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Review incoming vehicles, request better details, or convert a submission into draft inventory without leaving the queue.
        </p>
      </div>

      <SellerSubmissionsPanel locale={locale} rows={data.submissions} />
    </div>
  );
}
