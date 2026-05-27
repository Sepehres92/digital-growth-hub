import { Link } from "@tanstack/react-router";
import { Sparkles, Pencil } from "lucide-react";
import { useMarketingProfile, type MarketingProfile } from "@/hooks/use-marketing-profile";

type Field = keyof MarketingProfile;

/**
 * Shows which saved profile values are powering the current tool, and a link
 * to edit them. Makes the app feel like one guided system instead of 40 forms.
 */
export function ProfileAutofillBanner({
  highlight,
  toolName,
}: {
  /** Which profile fields this tool consumes. */
  highlight: Field[];
  toolName: string;
}) {
  const { profile, loading } = useMarketingProfile();

  if (loading) return null;

  if (!profile) {
    return (
      <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Finish onboarding so {toolName} can auto-fill from your business profile.
          </span>
        </div>
        <Link to="/onboarding" className="text-sm font-medium text-primary hover:underline">
          Start onboarding
        </Link>
      </div>
    );
  }

  const summary = highlight
    .map((k) => {
      const v = profile[k];
      if (v == null || v === "") return null;
      if (Array.isArray(v)) return v.length ? `${labelFor(k)}: ${v.slice(0, 3).join(", ")}` : null;
      if (typeof v === "boolean") return v ? labelFor(k) : null;
      return `${labelFor(k)}: ${String(v).slice(0, 60)}`;
    })
    .filter(Boolean) as string[];

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-start gap-2">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="font-medium text-foreground">
            {toolName} is using your saved business profile
          </div>
          {summary.length > 0 && (
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {summary.join(" • ")}
            </div>
          )}
        </div>
      </div>
      <Link
        to="/business-profile"
        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <Pencil className="size-3" /> Edit profile
      </Link>
    </div>
  );
}

function labelFor(k: Field): string {
  const map: Partial<Record<Field, string>> = {
    business_name: "Business",
    industry: "Industry",
    target_audience: "Audience",
    brand_tone: "Voice",
    brand_colors: "Brand colors",
    platforms: "Platforms",
    posting_frequency: "Cadence",
    content_types: "Content",
    target_keywords: "Keywords",
    target_locations: "Locations",
    ppc_budget: "PPC budget",
    competitors: "Competitors",
    services: "Services",
    usps: "USPs",
    offers: "Offers",
    main_goal: "Goal",
    conversion_goal: "Conversion goal",
    approval_required: "Approvals required",
  };
  return map[k] ?? String(k);
}
