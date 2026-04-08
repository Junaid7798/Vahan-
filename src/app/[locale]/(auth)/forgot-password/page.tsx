import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/modules/auth/components/forgot-password-form";

export default async function ForgotPasswordPage() {
  const authT = await getTranslations("auth");

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">{authT("portalTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{authT("forgotPasswordSubtitle")}</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
