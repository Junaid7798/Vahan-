import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Toaster } from "@/components/ui/toaster";
import { OnlineStatusIndicator } from "@/components/online-status-indicator";

export const metadata = {
  title: "Vehicle Inventory Portal",
  description: "Private vehicle inventory portal for used vehicle resellers",
  manifest: "/manifest.webmanifest",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <OnlineStatusIndicator />
      {children}
      <Toaster />
    </NextIntlClientProvider>
  );
}
