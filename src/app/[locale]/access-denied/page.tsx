import { getTranslations } from "next-intl/server";
import { SignOutButton } from "@/components/auth/session-actions";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default async function AccessDeniedPage() {
  const authT = await getTranslations("auth");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(231,143,94,0.18),_transparent_28%),linear-gradient(180deg,_#fffdf7_0%,_#f4efe5_100%)] px-4 py-6">
      <div className="mx-auto flex max-w-6xl justify-end">
        <LanguageSwitcher />
      </div>
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>

          <h1 className="mb-2 text-2xl font-bold">{authT("accessDeniedTitle")}</h1>

          <p className="mb-6 text-muted-foreground">{authT("accessDeniedDescription")}</p>

          <div className="rounded-lg bg-white p-4 text-left text-sm shadow-sm">
            <h3 className="mb-2 font-medium">{authT("needHelp")}</h3>
            <p className="text-muted-foreground">{authT("needHelpDescription")}</p>
          </div>

          <div className="mt-6">
            <SignOutButton className="text-sm text-muted-foreground hover:text-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
