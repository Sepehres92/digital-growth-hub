import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Reads the current user's roles from public.user_roles.
 * Returns { roles, isAdmin, isModerator, loading, userId }.
 *
 * Use for client-side UI gating only — server-side enforcement
 * still relies on RLS + has_role() in policies.
 */
export function useUserRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);

      if (!uid) {
        setRoles([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);

      if (cancelled) return;
      if (error || !data) {
        setRoles([]);
      } else {
        setRoles(data.map((r) => r.role as AppRole));
      }
      setLoading(false);
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setLoading(true);
      load();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    roles,
    userId,
    loading,
    isAdmin: roles.includes("admin" as AppRole),
    isModerator: roles.includes("moderator" as AppRole),
    hasRole: (r: AppRole) => roles.includes(r),
  };
}
