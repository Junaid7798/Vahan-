import { getTranslations } from "next-intl/server";
import {
  RefreshStatusButton,
  SignOutButton,
} from "@/components/auth/session-actions";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default async function PendingApprovalPage() {
  const authT = await getTranslations("auth");
  const items = authT.raw("whatHappensNextItems") as string[];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(231,143,94,0.18),_transparent_28%),linear-gradient(180deg,_#fffdf7_0%,_#f4efe5_100%)] px-4 py-6">
      <div className="mx-auto flex max-w-6xl justify-end">
        <LanguageSwitcher />
      </div>
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>

          <h1 className="mb-2 text-2xl font-bold">{authT("pendingApprovalTitle")}</h1>

          <p className="mb-6 text-muted-foreground">{authT("pendingApprovalBody")}</p>

          <div className="rounded-lg bg-white p-4 text-left text-sm shadow-sm">
            <h3 className="mb-2 font-medium">{authT("whatHappensNext")}</h3>
            <ul className="space-y-2 text-muted-foreground">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-amber-600">*</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <RefreshStatusButton className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent" />
            <SignOutButton className="text-sm text-muted-foreground hover:text-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
