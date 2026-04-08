"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export default function LocaleErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const commonT = useTranslations("common");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(231,143,94,0.18),_transparent_28%),linear-gradient(180deg,_#fffdf7_0%,_#f4efe5_100%)] px-4">
      <div className="w-full max-w-lg rounded-[32px] border border-white/50 bg-white/85 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Vahan</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{commonT("error")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {error.message || "The page hit an unexpected issue while rendering. You can retry the request or return to the dashboard."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={() => unstable_retry()}>
            {commonT("retry")}
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/app">{commonT("returnHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
