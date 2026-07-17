import { supabase } from "../../config/supabase";

const DEFAULT_FRESHNESS_DAYS = 7;

export interface ExistingOnlineLead {
  id: string;
  user_id: string;
  name: string;
  website_url: string;
  primary_domain: string;
  analysis_status: string | null;
  updated_at: string | null;
  [key: string]: unknown;
}

interface ResolveExistingLeadInput {
  websiteUrl: string;
  userId: string;
  forceRefresh?: boolean;
  freshnessDays?: number;
}

export interface ExistingLeadResolution {
  primaryDomain: string;
  existingLead: ExistingOnlineLead | null;
  shouldReuse: boolean;
  reason:
    | "force_refresh"
    | "not_found"
    | "not_completed"
    | "missing_updated_at"
    | "stale"
    | "fresh_completed";
}

export function getPrimaryDomain(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isFreshDate(dateValue: string, freshnessDays: number): boolean {
  const updatedTime = new Date(dateValue).getTime();

  if (Number.isNaN(updatedTime)) {
    return false;
  }

  const freshnessWindowMs = freshnessDays * 24 * 60 * 60 * 1000;

  return Date.now() - updatedTime <= freshnessWindowMs;
}

export async function resolveExistingOnlineLead({
  websiteUrl,
  userId,
  forceRefresh = false,
  freshnessDays = DEFAULT_FRESHNESS_DAYS,
}: ResolveExistingLeadInput): Promise<ExistingLeadResolution> {
  const primaryDomain = getPrimaryDomain(websiteUrl);

  if (!primaryDomain) {
    throw new Error(`Invalid company website: ${websiteUrl}`);
  }

  if (forceRefresh) {
    return {
      primaryDomain,
      existingLead: null,
      shouldReuse: false,
      reason: "force_refresh",
    };
  }

  const { data, error } = await supabase
    .from("online_leads")
    .select("*")
    .eq("user_id", userId)
    .eq("primary_domain", primaryDomain)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Could not check existing online lead for ${primaryDomain}: ${error.message}`,
    );
  }

  const existingLead = data as ExistingOnlineLead | null;

  if (!existingLead) {
    return {
      primaryDomain,
      existingLead: null,
      shouldReuse: false,
      reason: "not_found",
    };
  }

  if (existingLead.analysis_status !== "Completed") {
    return {
      primaryDomain,
      existingLead,
      shouldReuse: false,
      reason: "not_completed",
    };
  }

  if (!existingLead.updated_at) {
    return {
      primaryDomain,
      existingLead,
      shouldReuse: false,
      reason: "missing_updated_at",
    };
  }

  if (!isFreshDate(existingLead.updated_at, freshnessDays)) {
    return {
      primaryDomain,
      existingLead,
      shouldReuse: false,
      reason: "stale",
    };
  }

  return {
    primaryDomain,
    existingLead,
    shouldReuse: true,
    reason: "fresh_completed",
  };
}
