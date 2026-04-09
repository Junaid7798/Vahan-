import { getTranslations } from "next-intl/server";
import { AdminSettingsForm } from "@/modules/admin/components/settings-form";
import { requireAdmin } from "@/lib/auth/viewer";
import { getSupportData } from "@/lib/portal/operations";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const settingsT = await getTranslations({ locale, namespace: "settings" });
  await requireAdmin(locale);
  const data = await getSupportData();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{settingsT("adminLabel")}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{settingsT("title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{settingsT("description")}</p>
      </div>

      <AdminSettingsForm settings={data.settings} />
    </div>
  );
}
