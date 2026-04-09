import "server-only";

import { createAdminClient } from "@/lib/supabase/admin-client";

interface ActivityInput {
  action: string;
  details?: Record<string, unknown>;
  entityId?: string;
  entityType?: string;
  userId?: string;
}

export async function logPortalActivity(input: ActivityInput) {
  const client = createAdminClient();
  const { error } = await client.from("activity_logs").insert({
    user_id: input.userId ?? null,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    details: input.details ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }
}
