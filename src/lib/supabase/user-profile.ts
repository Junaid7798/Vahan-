import { createClient } from "@/lib/supabase/browser-client";
import { UserProfile } from "@/lib/supabase/permissions";

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return profile as UserProfile;
}

export async function updateUserProfile(updates: Partial<UserProfile>) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}