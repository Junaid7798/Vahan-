"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button, type ButtonProps } from "@/components/ui/button";

interface SignOutButtonProps extends Omit<ButtonProps, "onClick"> {
  children?: React.ReactNode;
}

export function SignOutButton({
  children,
  disabled,
  ...props
}: SignOutButtonProps) {
  const authT = useTranslations("auth");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } finally {
        router.replace("/login");
      }
    });
  };

  return (
    <Button {...props} disabled={disabled || isPending} onClick={handleClick} type="button">
      {isPending ? authT("signingOut") : children ?? authT("logout")}
    </Button>
  );
}

interface RefreshStatusButtonProps extends Omit<ButtonProps, "onClick"> {
  children?: React.ReactNode;
}

export function RefreshStatusButton({
  children,
  disabled,
  ...props
}: RefreshStatusButtonProps) {
  const authT = useTranslations("auth");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Button {...props} disabled={disabled || isPending} onClick={handleClick} type="button">
      {isPending ? authT("refreshing") : children ?? authT("refreshStatus")}
    </Button>
  );
}
