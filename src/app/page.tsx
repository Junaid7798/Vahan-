import { redirect } from "next/navigation";
import { getViewerContext } from "@/lib/auth/viewer";
import { getPreferredLocale } from "@/lib/i18n/preferred-locale";

export default async function RootRedirect() {
  const locale = await getPreferredLocale();
  const viewer = await getViewerContext();
  redirect(viewer ? `/${locale}/app` : `/${locale}/login`);
}
