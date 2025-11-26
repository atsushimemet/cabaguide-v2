"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getBrowserSupabaseClient } from "@/lib/supabaseClient";

type SupabaseState = {
  client: SupabaseClient | null;
  error: string | null;
};

export const useSupabaseBrowserClient = () => {
  const [state] = useState<SupabaseState>(() => {
    try {
      const client = getBrowserSupabaseClient();
      return { client, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Supabase の初期化に失敗しました";
      return { client: null, error: message };
    }
  });

  return state;
};
