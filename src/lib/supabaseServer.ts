import { createClient, SupabaseClient } from "@supabase/supabase-js";

class SupabaseServiceEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseServiceEnvError";
  }
}

let serviceClient: SupabaseClient | null = null;

export const getServiceSupabaseClient = () => {
  if (serviceClient) {
    return serviceClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new SupabaseServiceEnvError("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY が設定されていません");
  }

  serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  return serviceClient;
};

export { SupabaseServiceEnvError };
