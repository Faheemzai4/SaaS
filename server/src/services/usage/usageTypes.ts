export const USAGE_EVENT_TYPES = [
  "local_search",
  "online_search",
  "website_analysis",
  "playwright_fallback",

  // Keep this temporarily for historical usage records.
  "ollama_generation",

  "groq_generation",
  "dashboard_chat",
  "retry_analysis",
  "csv_export",
  "extension_analysis",
] as const;

export type UsageEventType =
  (typeof USAGE_EVENT_TYPES)[number];

export type UsageSource =
  | "local"
  | "online"
  | "extension"
  | "retry"
  | "dashboard"
  | "system"
  | "csv"
  | "direct";

export type UsageMetadataValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[];

export type UsageMetadata = Record<
  string,
  UsageMetadataValue
>;

export interface UsageTrackingContext {
  userId: string;
  source: UsageSource;
  module?: "local" | "online";
}

export interface TrackUsageInput {
  userId: string;
  eventType: UsageEventType;
  quantity?: number;
  creditsUsed?: number;
  source?: UsageSource;
  metadata?: UsageMetadata;
}

export interface UsageEventRecord {
  id: string;
  user_id: string;
  event_type: UsageEventType;
  quantity: number;
  credits_used: number;
  source: string | null;
  metadata: UsageMetadata;
  created_at: string;
}

export interface UsageEventTotals {
  quantity: number;
  creditsUsed: number;
}

export type UsageBreakdown = Record<
  UsageEventType,
  UsageEventTotals
>;

export interface UsageSummary {
  periodStart: string;
  periodEnd: string;

  totalEvents: number;
  totalQuantity: number;
  totalCreditsUsed: number;

  breakdown: UsageBreakdown;
}

export interface UsageHistoryItem {
  month: string;
  periodStart: string;
  periodEnd: string;

  totalEvents: number;
  totalQuantity: number;
  totalCreditsUsed: number;

  breakdown: UsageBreakdown;
}

export function isUsageEventType(
  value: unknown,
): value is UsageEventType {
  return (
    typeof value === "string" &&
    USAGE_EVENT_TYPES.includes(
      value as UsageEventType,
    )
  );
}

export function createEmptyUsageBreakdown(): UsageBreakdown {
  return {
    local_search: {
      quantity: 0,
      creditsUsed: 0,
    },

    online_search: {
      quantity: 0,
      creditsUsed: 0,
    },

    website_analysis: {
      quantity: 0,
      creditsUsed: 0,
    },

    playwright_fallback: {
      quantity: 0,
      creditsUsed: 0,
    },

    ollama_generation: {
      quantity: 0,
      creditsUsed: 0,
    },

    groq_generation: {
      quantity: 0,
      creditsUsed: 0,
    },

    dashboard_chat: {
      quantity: 0,
      creditsUsed: 0,
    },

    retry_analysis: {
      quantity: 0,
      creditsUsed: 0,
    },

    csv_export: {
      quantity: 0,
      creditsUsed: 0,
    },

    extension_analysis: {
      quantity: 0,
      creditsUsed: 0,
    },
  };
}