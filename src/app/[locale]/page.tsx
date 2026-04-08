import { redirect } from "next/navigation";
import { getViewerContext } from "@/lib/auth/viewer";

export default async function LocaleEntryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const viewer = await getViewerContext();
  redirect(viewer ? `/${locale}/app` : `/${locale}/login`);
}
