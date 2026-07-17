import { getLeadByUrl } from "../shared/cache/leadCache";

const DEFAULT_FRESHNESS_DAYS = 7;
const DEFAULT_FAILED_RETRY_HOURS = 24;

interface ResolveExistingLocalLeadInput {
  websiteUrl: string;
  userId: string;
  forceRefresh?: boolean;
  freshnessDays?: number;
  failedRetryHours?: number;
}

export interface LocalLeadResolution {
  existingLead: Record<string, unknown> | null;

  shouldReuse: boolean;
  shouldSkip: boolean;

  reason:
    | "force_refresh"
    | "not_found"
    | "processing"
    | "failed_cooldown"
    | "failed_retry_ready"
    | "not_analyzed"
    | "missing_analyzed_at"
    | "stale"
    | "fresh_completed";
}

function isWithinAge(
  dateValue: string,
  amount: number,
  unit: "hours" | "days",
): boolean {
  const timestamp = new Date(dateValue).getTime();

  if (Number.isNaN(timestamp)) {
    return false;
  }

  const multiplier = unit === "hours" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  return Date.now() - timestamp <= amount * multiplier;
}

export async function resolveExistingLocalLead({
  websiteUrl,
  userId,
  forceRefresh = false,
  freshnessDays = DEFAULT_FRESHNESS_DAYS,
  failedRetryHours = DEFAULT_FAILED_RETRY_HOURS,
}: ResolveExistingLocalLeadInput): Promise<LocalLeadResolution> {
  if (forceRefresh) {
    return {
      existingLead: null,
      shouldReuse: false,
      shouldSkip: false,
      reason: "force_refresh",
    };
  }

  const existingLead = await getLeadByUrl(websiteUrl, userId);

  if (!existingLead) {
    return {
      existingLead: null,
      shouldReuse: false,
      shouldSkip: false,
      reason: "not_found",
    };
  }

  if (existingLead.status === "Processing") {
    return {
      existingLead,
      shouldReuse: false,
      shouldSkip: true,
      reason: "processing",
    };
  }

  if (existingLead.status === "Needs Manual Review") {
    const failedRecently =
      typeof existingLead.updatedAt === "string" &&
      isWithinAge(existingLead.updatedAt, failedRetryHours, "hours");

    if (failedRecently) {
      return {
        existingLead,
        shouldReuse: false,
        shouldSkip: true,
        reason: "failed_cooldown",
      };
    }

    return {
      existingLead,
      shouldReuse: false,
      shouldSkip: false,
      reason: "failed_retry_ready",
    };
  }

  if (existingLead.score === null || existingLead.score === undefined) {
    return {
      existingLead,
      shouldReuse: false,
      shouldSkip: false,
      reason: "not_analyzed",
    };
  }

  if (typeof existingLead.analyzedAt !== "string") {
    return {
      existingLead,
      shouldReuse: false,
      shouldSkip: false,
      reason: "missing_analyzed_at",
    };
  }

  const analysisIsFresh = isWithinAge(
    existingLead.analyzedAt,
    freshnessDays,
    "days",
  );

  if (!analysisIsFresh) {
    return {
      existingLead,
      shouldReuse: false,
      shouldSkip: false,
      reason: "stale",
    };
  }

  return {
    existingLead,
    shouldReuse: true,
    shouldSkip: false,
    reason: "fresh_completed",
  };
}
