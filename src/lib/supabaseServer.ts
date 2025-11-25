import { createClient, SupabaseClient } from "@supabase/supabase-js";

let serviceClient: SupabaseClient | null = null;

export const getServiceSupabaseClient = () => {
  if (serviceClient) {
    return serviceClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role の環境変数が設定されていません");
  }

  serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  return serviceClient;
};
