import { InquiriesPanel } from "@/modules/admin/components/inquiries-panel";
import { requireViewer } from "@/lib/auth/viewer";
import { getInquiriesForViewer } from "@/lib/portal/operations";

export default async function InquiriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const viewer = await requireViewer(locale);
  const inquiries = await getInquiriesForViewer(viewer.profile.id, viewer.permissions.canViewAllInquiries);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {viewer.permissions.canViewAllInquiries ? "Staff Queue" : "My Activity"}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {viewer.permissions.canViewAllInquiries ? "Inquiry follow-up" : "My inquiries"}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {viewer.permissions.canViewAllInquiries
            ? "Keep the inquiry pipeline moving with fast status updates and direct jumps back to each vehicle."
            : "Track the latest responses and jump back into any vehicle conversation from one place."}
        </p>
      </div>

      <InquiriesPanel canManage={viewer.permissions.canViewAllInquiries} rows={inquiries} />
    </div>
  );
}
