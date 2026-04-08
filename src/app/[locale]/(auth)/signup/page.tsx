import { getTranslations } from "next-intl/server";
import { SignupForm } from "@/modules/auth/components/signup-form";

export default async function SignupPage() {
  const authT = await getTranslations("auth");

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">{authT("portalTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{authT("signupSubtitle")}</p>
      </div>
      <SignupForm />
    </div>
  );
}
