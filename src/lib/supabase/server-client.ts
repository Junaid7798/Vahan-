import { createServerClient as createServerClientFn } from "@supabase/ssr";
import { cookies } from "next/headers";
import { mockSupabase } from "./mock-client";

export async function createServerClient() {
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true" || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return mockSupabase;
  }

  const cookieStore = await cookies();

  return createServerClientFn(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}