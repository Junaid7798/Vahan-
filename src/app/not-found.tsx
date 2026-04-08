import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(231,143,94,0.18),_transparent_28%),linear-gradient(180deg,_#fffdf7_0%,_#f4efe5_100%)] px-4">
      <div className="w-full max-w-lg rounded-[32px] border border-white/50 bg-white/85 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Vahan</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The route does not exist or has moved. Return to the app entry point and continue from there.
        </p>
        <div className="mt-6">
          <Link className="inline-flex items-center rounded-full bg-[hsl(var(--primary))] px-5 py-2 text-sm font-medium text-primary-foreground" href="/">
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
