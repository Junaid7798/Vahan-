import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server-client";

const DEMO_SESSION_COOKIE = "vahan-demo-session";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  isDemo: boolean;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getDemoSessionCookie(email: string) {
  return {
    name: DEMO_SESSION_COOKIE,
    value: email,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    },
  };
}

export function clearDemoSessionCookie() {
  return {
    name: DEMO_SESSION_COOKIE,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    },
  };
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies();
    const email = cookieStore.get(DEMO_SESSION_COOKIE)?.value;

    if (!email) {
      return null;
    }

    return {
      id: `demo-${email}`,
      email,
      isDemo: true,
    };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    isDemo: false,
  };
}
