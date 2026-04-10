import { SellerSubmissionsPanel } from "@/modules/admin/components/seller-submissions-panel";
import { requireStaff } from "@/lib/auth/viewer";
import { getSupportData } from "@/lib/portal/operations";

export default async function SellerSubmissionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireStaff(locale);
  const data = await getSupportData();
  const copy = locale === "hi"
    ? {
        description: "\u0906\u0928\u0947 \u0935\u093e\u0932\u0947 \u0905\u092a\u0932\u094b\u0921 \u0915\u0940 \u0938\u092e\u0940\u0915\u094d\u0937\u093e \u0915\u0930\u0947\u0902, \u092c\u0926\u0932\u093e\u0935 \u092e\u093e\u0901\u0917\u0947\u0902, \u0914\u0930 \u0938\u092c\u092e\u093f\u0936\u0928 \u0915\u094b \u0921\u094d\u0930\u093e\u092b\u094d\u091f \u0932\u093f\u0938\u094d\u091f\u093f\u0902\u0917 \u092e\u0947\u0902 \u092c\u0926\u0932\u0947\u0902\u0964",
        eyebrow: "\u0938\u094d\u091f\u093e\u092b \u0915\u0924\u093e\u0930",
        title: "\u0935\u093f\u0915\u094d\u0930\u0947\u0924\u093e \u0907\u0928\u091f\u0947\u0915",
      }
    : {
        description: "Review incoming vehicles, request better details, or convert a submission into draft inventory without leaving the queue.",
        eyebrow: "Staff Queue",
        title: "Seller intake",
      };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{copy.eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{copy.description}</p>
      </div>

      <SellerSubmissionsPanel locale={locale} rows={data.submissions} />
    </div>
  );
}
