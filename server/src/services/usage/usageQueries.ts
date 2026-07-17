import { supabase } from "../../config/supabase";

import type {
  UsageEventRecord,
  UsageEventType,
} from "./usageTypes";

export interface UsageDateRange {
  periodStart: Date;
  periodEnd: Date;
}

export interface GetUsageEventsInput {
  userId: string;
  page?: number;
  limit?: number;
  eventType?: UsageEventType;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedUsageEvents {
  events: UsageEventRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function parsePositiveInteger(
  value: number | undefined,
  fallback: number,
): number {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

export function getCalendarMonthRange(
  date = new Date(),
): UsageDateRange {
  const periodStart = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      1,
      0,
      0,
      0,
      0,
    ),
  );

  const periodEnd = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      1,
      0,
      0,
      0,
      0,
    ),
  );

  return {
    periodStart,
    periodEnd,
  };
}

export async function getUsageEventsForPeriod(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<UsageEventRecord[]> {
  const { data, error } = await supabase
    .from("usage_events")
    .select(
      `
        id,
        user_id,
        event_type,
        quantity,
        credits_used,
        source,
        metadata,
        created_at
      `,
    )
    .eq("user_id", userId)
    .gte(
      "created_at",
      periodStart.toISOString(),
    )
    .lt(
      "created_at",
      periodEnd.toISOString(),
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Failed to load usage events: ${error.message}`,
    );
  }

  return (data || []) as UsageEventRecord[];
}

export async function getCurrentMonthUsageEvents(
  userId: string,
): Promise<{
  periodStart: Date;
  periodEnd: Date;
  events: UsageEventRecord[];
}> {
  const { periodStart, periodEnd } =
    getCalendarMonthRange();

  const events = await getUsageEventsForPeriod(
    userId,
    periodStart,
    periodEnd,
  );

  return {
    periodStart,
    periodEnd,
    events,
  };
}

export async function getPaginatedUsageEvents({
  userId,
  page = 1,
  limit = 20,
  eventType,
  dateFrom,
  dateTo,
}: GetUsageEventsInput): Promise<PaginatedUsageEvents> {
  const normalizedPage =
    parsePositiveInteger(page, 1);

  const normalizedLimit = Math.min(
    parsePositiveInteger(limit, 20),
    100,
  );

  const rangeStart =
    (normalizedPage - 1) * normalizedLimit;

  const rangeEnd =
    rangeStart + normalizedLimit - 1;

  let query = supabase
    .from("usage_events")
    .select(
      `
        id,
        user_id,
        event_type,
        quantity,
        credits_used,
        source,
        metadata,
        created_at
      `,
      {
        count: "exact",
      },
    )
    .eq("user_id", userId);

  if (eventType) {
    query = query.eq(
      "event_type",
      eventType,
    );
  }

  if (dateFrom) {
    query = query.gte(
      "created_at",
      dateFrom,
    );
  }

  if (dateTo) {
    query = query.lte(
      "created_at",
      dateTo,
    );
  }

  const {
    data,
    error,
    count,
  } = await query
    .order("created_at", {
      ascending: false,
    })
    .range(rangeStart, rangeEnd);

  if (error) {
    throw new Error(
      `Failed to load usage history: ${error.message}`,
    );
  }

  const total = count || 0;

  return {
    events: (data || []) as UsageEventRecord[],
    page: normalizedPage,
    limit: normalizedLimit,
    total,
    totalPages:
      total === 0
        ? 0
        : Math.ceil(
            total / normalizedLimit,
          ),
  };
}