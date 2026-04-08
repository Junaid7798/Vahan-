import { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(231,143,94,0.18),_transparent_28%),linear-gradient(180deg,_#fffdf7_0%,_#f4efe5_100%)] px-4 py-6">
      <div className="mx-auto flex max-w-6xl justify-end">
        <LanguageSwitcher />
      </div>
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        {children}
      </div>
    </div>
  );
}
