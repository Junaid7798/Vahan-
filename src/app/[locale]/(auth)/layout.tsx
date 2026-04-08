import { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell-background min-h-screen px-4 py-6 text-foreground">
      <div className="mx-auto flex max-w-6xl justify-end">
        <LanguageSwitcher />
      </div>
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        {children}
      </div>
    </div>
  );
}
