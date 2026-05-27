import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============ Marketing Profile ============

const ProfileInput = z.object({
  business_name: z.string().max(200).optional().nullable(),
  website_url: z.string().max(500).optional().nullable(),
  industry: z.string().max(200).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  services: z.string().max(2000).optional().nullable(),
  target_audience: z.string().max(2000).optional().nullable(),
  main_goal: z.string().max(2000).optional().nullable(),
  budget_range: z.string().max(100).optional().nullable(),
  brand_tone: z.string().max(200).optional().nullable(),
  brand_colors: z.array(z.string().max(40)).max(20).optional(),
  logo_url: z.string().max(1000).optional().nullable(),
  media_urls: z.array(z.string().max(1000)).max(50).optional(),
  competitors: z.string().max(2000).optional().nullable(),
  usps: z.string().max(2000).optional().nullable(),
  offers: z.string().max(2000).optional().nullable(),
  platforms: z.array(z.string().max(40)).max(20).optional(),
  posting_frequency: z.string().max(60).optional().nullable(),
  content_types: z.array(z.string().max(40)).max(20).optional(),
  approval_required: z.boolean().optional(),
  creation_mode: z.enum(["ai", "human", "ai_human"]).optional(),
  target_keywords: z.array(z.string().max(120)).max(100).optional(),
  seo_competitors: z.string().max(2000).optional().nullable(),
  target_locations: z.array(z.string().max(120)).max(50).optional(),
  ppc_budget: z.number().min(0).max(10_000_000).optional().nullable(),
  lead_type: z.string().max(200).optional().nullable(),
  landing_page_url: z.string().max(500).optional().nullable(),
  conversion_goal: z.string().max(200).optional().nullable(),
  client_portal_enabled: z.boolean().optional(),
  human_consultation_requested: z.boolean().optional(),
  onboarding_step: z.number().int().min(0).max(10).optional(),
});

export const getMarketingProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("marketing_profiles")
      .select("*")
      .eq("user_id", userId)
      .is("client_id", null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: data };
  });

export const saveMarketingProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfileInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const existing = await supabase
      .from("marketing_profiles")
      .select("id")
      .eq("user_id", userId)
      .is("client_id", null)
      .maybeSingle();
    if (existing.error) throw new Error(existing.error.message);

    if (existing.data) {
      const { data: row, error } = await supabase
        .from("marketing_profiles")
        .update(data)
        .eq("id", existing.data.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return { profile: row };
    }
    const { data: row, error } = await supabase
      .from("marketing_profiles")
      .insert({ ...data, user_id: userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { profile: row };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile, error: pErr } = await supabase
      .from("marketing_profiles")
      .select("*")
      .eq("user_id", userId)
      .is("client_id", null)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile) throw new Error("Profile not found");

    // Auto-create a client row from the profile if one doesn't exist yet
    let clientId: string | null = null;
    if (profile.business_name) {
      const existingClient = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", userId)
        .eq("business_name", profile.business_name)
        .maybeSingle();
      if (existingClient.data) {
        clientId = existingClient.data.id;
      } else {
        const { data: c } = await supabase
          .from("clients")
          .insert({
            user_id: userId,
            business_name: profile.business_name,
            website: profile.website_url,
            industry: profile.industry,
            target_audience: profile.target_audience,
            brand_voice: profile.brand_tone,
            brand_colors: Array.isArray(profile.brand_colors)
              ? (profile.brand_colors as string[]).join(", ")
              : null,
            keywords: Array.isArray(profile.target_keywords)
              ? (profile.target_keywords as string[]).join(", ")
              : null,
            competitors: profile.competitors,
            services: profile.services,
            preferred_tone: profile.brand_tone,
            monthly_budget: profile.ppc_budget ?? 0,
          })
          .select("id")
          .single();
        clientId = c?.id ?? null;
      }
    }

    await supabase
      .from("marketing_profiles")
      .update({ onboarding_completed: true })
      .eq("id", profile.id);

    // Ensure workspace mode row exists in real mode
    await supabase
      .from("workspace_mode")
      .upsert({ user_id: userId, mode: "real" }, { onConflict: "user_id" });

    return { ok: true, clientId };
  });

// ============ Workspace Mode ============

export const getWorkspaceMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("workspace_mode")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return { mode: data?.mode ?? "real", demoTemplate: data?.demo_template ?? null };
  });

export const setWorkspaceMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        mode: z.enum(["real", "demo"]),
        demoTemplate: z.string().max(60).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("workspace_mode")
      .upsert(
        {
          user_id: userId,
          mode: data.mode,
          demo_template: data.demoTemplate ?? null,
        },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ Demo Seeding ============

const DEMO_TEMPLATES = {
  roofing: {
    business_name: "Summit Roofing Co.",
    industry: "Home Services / Roofing",
    services: "Roof repair, replacement, gutter installation",
    target_audience: "Homeowners aged 35-65 in suburban areas",
    brand_tone: "Trustworthy, expert, friendly",
    platforms: ["facebook", "instagram"],
    keywords: ["roof repair", "roofing contractor", "emergency roof leak"],
  },
  real_estate: {
    business_name: "Coastal Realty Group",
    industry: "Real Estate",
    services: "Residential sales, luxury homes, property management",
    target_audience: "Buyers and sellers in coastal markets",
    brand_tone: "Aspirational, professional, warm",
    platforms: ["instagram", "facebook", "youtube"],
    keywords: ["homes for sale", "luxury real estate", "first-time buyer"],
  },
  restaurant: {
    business_name: "Olive & Vine Bistro",
    industry: "Restaurant / Hospitality",
    services: "Mediterranean dining, private events, catering",
    target_audience: "Local foodies and date-night couples 25-55",
    brand_tone: "Warm, inviting, sensory",
    platforms: ["instagram", "tiktok", "facebook"],
    keywords: ["best mediterranean", "date night restaurant", "private dining"],
  },
  fitness: {
    business_name: "PeakFit Coaching",
    industry: "Health & Fitness",
    services: "1:1 online coaching, nutrition plans, group challenges",
    target_audience: "Busy professionals 28-45 wanting sustainable fitness",
    brand_tone: "Motivating, science-backed, real",
    platforms: ["instagram", "tiktok", "youtube"],
    keywords: ["online fitness coach", "sustainable weight loss", "strength training"],
  },
  contractor: {
    business_name: "Hammer & Co. Contracting",
    industry: "General Contracting",
    services: "Kitchen remodels, bath renovations, additions",
    target_audience: "Homeowners planning $30k+ renovations",
    brand_tone: "Reliable, craft-focused, clear",
    platforms: ["facebook", "instagram"],
    keywords: ["kitchen remodel", "general contractor near me", "home renovation"],
  },
  agency: {
    business_name: "Northwind Digital",
    industry: "Digital Marketing Agency",
    services: "SEO, PPC, social media, content production",
    target_audience: "SMB owners scaling from $1M to $10M revenue",
    brand_tone: "Sharp, results-driven, transparent",
    platforms: ["instagram", "x", "youtube"],
    keywords: ["digital marketing agency", "fractional cmo", "seo for smb"],
  },
} as const;

type DemoKey = keyof typeof DEMO_TEMPLATES;

export const seedDemoWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        template: z.enum([
          "roofing",
          "real_estate",
          "restaurant",
          "fitness",
          "contractor",
          "agency",
        ]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tpl = DEMO_TEMPLATES[data.template as DemoKey];

    // Demo client
    const { data: client, error: cErr } = await supabase
      .from("clients")
      .insert({
        user_id: userId,
        business_name: `[DEMO] ${tpl.business_name}`,
        industry: tpl.industry,
        services: tpl.services,
        target_audience: tpl.target_audience,
        brand_voice: tpl.brand_tone,
        preferred_tone: tpl.brand_tone,
        keywords: tpl.keywords.join(", "),
        monthly_budget: 2500,
        is_demo: true,
      })
      .select("id")
      .single();
    if (cErr) throw new Error(cErr.message);

    // Demo campaign (auto-creates folder via trigger)
    const { data: campaign } = await supabase
      .from("campaigns")
      .insert({
        user_id: userId,
        client_id: client.id,
        name: `[DEMO] ${tpl.business_name} Launch Campaign`,
        type: "social_media",
        source_type: "ai",
        status: "active",
        monthly_budget: 1500,
        goal: `Drive awareness and leads for ${tpl.business_name}`,
        is_demo: true,
      })
      .select("id, campaign_folder_id")
      .single();

    if (campaign?.campaign_folder_id) {
      await supabase
        .from("campaign_folders")
        .update({ is_demo: true, status: "active" })
        .eq("id", campaign.campaign_folder_id);
    }

    // Demo posts (3 sample posts spread across the next week)
    const platforms = tpl.platforms;
    const now = Date.now();
    const samplePosts = [
      {
        title: "Welcome post",
        caption: `Meet ${tpl.business_name} — ${tpl.services.split(",")[0]}.`,
      },
      {
        title: "Customer win",
        caption: `Another happy customer this week. Here's what they said about working with us.`,
      },
      {
        title: "Tip of the week",
        caption: `Quick tip for our ${tpl.target_audience.split(" ")[0]} community — save this one.`,
      },
    ];
    const postRows = samplePosts.map((p, i) => ({
      user_id: userId,
      client_id: client.id,
      campaign_id: campaign?.id ?? null,
      campaign_folder_id: campaign?.campaign_folder_id ?? null,
      platform: platforms[i % platforms.length],
      title: `[DEMO] ${p.title}`,
      caption: p.caption,
      hashtags: tpl.keywords.map((k) => `#${k.replace(/\s+/g, "")}`).join(" "),
      status: "scheduled",
      ai_generated: true,
      scheduled_for: new Date(now + (i + 1) * 86400000).toISOString(),
      is_demo: true,
    }));
    await supabase.from("content_posts").insert(postRows);

    // Demo SEO campaign
    await supabase.from("campaigns").insert({
      user_id: userId,
      client_id: client.id,
      name: `[DEMO] ${tpl.business_name} SEO Push`,
      type: "seo",
      source_type: "ai",
      status: "active",
      monthly_budget: 800,
      goal: `Rank for: ${tpl.keywords.join(", ")}`,
      is_demo: true,
    });

    // Demo PPC campaign
    await supabase.from("campaigns").insert({
      user_id: userId,
      client_id: client.id,
      name: `[DEMO] ${tpl.business_name} Google Ads`,
      type: "ppc",
      source_type: "ai",
      status: "active",
      monthly_budget: 1200,
      goal: "Generate qualified leads at <$40 CPL",
      is_demo: true,
    });

    // Flip workspace into demo mode
    await supabase
      .from("workspace_mode")
      .upsert(
        { user_id: userId, mode: "demo", demo_template: data.template },
        { onConflict: "user_id" },
      );

    return { ok: true, clientId: client.id };
  });

export const convertDemoToReal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ purgeDemo: z.boolean().default(false) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.purgeDemo) {
      await supabase.from("content_posts").delete().eq("user_id", userId).eq("is_demo", true);
      await supabase.from("campaigns").delete().eq("user_id", userId).eq("is_demo", true);
      await supabase.from("campaign_folders").delete().eq("user_id", userId).eq("is_demo", true);
      await supabase.from("clients").delete().eq("user_id", userId).eq("is_demo", true);
    }
    await supabase
      .from("workspace_mode")
      .upsert(
        { user_id: userId, mode: "real", demo_template: null },
        { onConflict: "user_id" },
      );
    return { ok: true };
  });
