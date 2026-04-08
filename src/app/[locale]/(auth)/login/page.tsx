import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/modules/auth/components/login-form";

export default async function LoginPage() {
  const authT = await getTranslations("auth");

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">{authT("portalTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{authT("loginSubtitle")}</p>
      </div>
      <LoginForm />
    </div>
  );
}
