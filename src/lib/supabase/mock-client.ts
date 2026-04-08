import { type Session, type SupabaseClient, type User } from "@supabase/supabase-js";
import { type UserProfile, type UserRole } from "@/lib/supabase/permissions";

type QueryValue = string | number | boolean | null;

function getMockRole(idOrEmail: string): UserRole {
  if (idOrEmail.startsWith("admin")) return "admin";
  if (idOrEmail.startsWith("staff") || idOrEmail.startsWith("manager")) return "manager";
  return "user";
}

function buildMockProfile(id: string): UserProfile {
  const role = getMockRole(id);

  return {
    id,
    full_name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
    phone: null,
    city: null,
    role,
    approval_status: "approved",
    can_view_financials: role !== "user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

const mockAuth = {
  getSession: async () => ({
    data: { session: null as Session | null },
    error: null,
  }),
  getUser: async () => ({
    data: { user: null as User | null },
    error: null,
  }),
  signInWithPassword: async ({ email }: { email: string }) => {
    const role = getMockRole(email);
    const mockUser: User = {
      id: `mock-${role}-123`,
      email,
      role: "authenticated",
      aud: "authenticated",
      app_metadata: { role },
      user_metadata: {
        full_name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
        role,
      },
      created_at: new Date().toISOString(),
    };

    return {
      data: {
        user: mockUser,
        session: {
          access_token: "mock-token",
          refresh_token: "mock-refresh",
          expires_in: 3600,
          token_type: "bearer",
          user: mockUser,
        } as Session,
      },
      error: null,
    };
  },
  signOut: async () => ({ error: null }),
};

const mockFrom = (table: string) => ({
  select: () => ({
    eq: (_column: string, value: QueryValue) => ({
      single: async () => {
        if (table === "user_profiles" && typeof value === "string") {
          return {
            data: buildMockProfile(value),
            error: null,
          };
        }

        return { data: null, error: null };
      },
      maybeSingle: async () => {
        if (table === "user_profiles" && typeof value === "string") {
          return {
            data: buildMockProfile(value),
            error: null,
          };
        }

        return { data: null, error: null };
      },
      order: () => ({ data: [], error: null }),
    }),
    order: () => ({ data: [], error: null }),
    limit: () => ({ data: [], error: null }),
  }),
  insert: () => ({
    select: () => ({
      single: async () => ({ data: { id: "mock-id" }, error: null }),
    }),
  }),
  update: () => ({
    eq: () => ({
      select: () => ({
        single: async () => ({ data: { id: "mock-id" }, error: null }),
      }),
    }),
  }),
});

const mockStorage = {
  from: () => ({
    upload: async () => ({ data: { path: "mock-path" }, error: null }),
    getPublicUrl: () => ({ data: { publicUrl: "https://via.placeholder.com/150" } }),
  }),
};

export const mockSupabase = {
  auth: mockAuth,
  from: mockFrom,
  storage: mockStorage,
} as unknown as SupabaseClient;
