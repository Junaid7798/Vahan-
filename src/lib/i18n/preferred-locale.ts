import { cookies, headers } from "next/headers";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getDemoUserByEmail } from "@/lib/demo/portal-users";
import { PortalLocale } from "@/lib/demo/portal-types";

const supportedLocales: PortalLocale[] = ["en", "hi"];

function isSupportedLocale(value: string | null | undefined): value is PortalLocale {
  return supportedLocales.includes(value as PortalLocale);
}

function localeFromAcceptLanguage(value: string | null): PortalLocale {
  if (!value) return "en";

  const normalized = value.toLowerCase();
  if (normalized.includes("hi")) return "hi";

  return "en";
}

export async function getPreferredLocale(): Promise<PortalLocale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  if (isSupportedLocale(localeCookie)) {
    return localeCookie;
  }

  const user = await getAuthenticatedUser();
  if (user?.isDemo && user.email) {
    const account = await getDemoUserByEmail(user.email);
    if (account?.preferredLocale) {
      return account.preferredLocale;
    }
  }

  const headerStore = await headers();
  return localeFromAcceptLanguage(headerStore.get("accept-language"));
}
