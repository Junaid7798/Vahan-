import { getTranslations } from "next-intl/server";
import { ProfileForm } from "@/modules/profile/components/profile-form";
import { requireViewer } from "@/lib/auth/viewer";
import { getDemoUserByEmail } from "@/lib/demo/portal-users";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const profileT = await getTranslations({ locale, namespace: "profile" });
  const viewer = await requireViewer(locale);
  const account = viewer.user.email ? await getDemoUserByEmail(viewer.user.email) : null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{profileT("label")}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{profileT("title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{profileT("description")}</p>
      </div>

      <ProfileForm
        approvalStatus={viewer.profile.approval_status}
        city={viewer.profile.city ?? ""}
        email={viewer.user.email ?? "-"}
        fullName={viewer.profile.full_name ?? ""}
        phone={viewer.profile.phone ?? ""}
        preferredLocale={account?.preferredLocale ?? (locale === "hi" ? "hi" : "en")}
        role={viewer.profile.role}
      />
    </div>
  );
}
