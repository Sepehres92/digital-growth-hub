import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMarketingProfile } from "@/lib/onboarding.functions";

export type MarketingProfile = {
  business_name?: string | null;
  website_url?: string | null;
  industry?: string | null;
  location?: string | null;
  services?: string | null;
  target_audience?: string | null;
  main_goal?: string | null;
  budget_range?: string | null;
  brand_tone?: string | null;
  brand_colors?: string[] | null;
  logo_url?: string | null;
  competitors?: string | null;
  usps?: string | null;
  offers?: string | null;
  platforms?: string[] | null;
  posting_frequency?: string | null;
  content_types?: string[] | null;
  approval_required?: boolean | null;
  creation_mode?: "ai" | "human" | "ai_human" | null;
  target_keywords?: string[] | null;
  seo_competitors?: string | null;
  target_locations?: string[] | null;
  ppc_budget?: number | null;
  lead_type?: string | null;
  landing_page_url?: string | null;
  conversion_goal?: string | null;
  human_consultation_requested?: boolean | null;
  onboarding_completed?: boolean | null;
};

/** Shared client-side reader for the user's Marketing Intelligence Profile. */
export function useMarketingProfile() {
  const getProfile = useServerFn(getMarketingProfile);
  const [profile, setProfile] = useState<MarketingProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getProfile({});
      setProfile((r.profile as MarketingProfile) ?? null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [getProfile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profile, loading, refresh };
}
