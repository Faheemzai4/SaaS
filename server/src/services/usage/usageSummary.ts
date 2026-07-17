import {
  createEmptyUsageBreakdown,
  type UsageEventRecord,
  type UsageHistoryItem,
  type UsageSummary,
} from "./usageTypes";

import {
  getCalendarMonthRange,
  getCurrentMonthUsageEvents,
  getUsageEventsForPeriod,
} from "./usageQueries";

export function buildUsageSummary(
  events: UsageEventRecord[],
  periodStart: Date,
  periodEnd: Date,
): UsageSummary {
  const breakdown =
    createEmptyUsageBreakdown();

  let totalQuantity = 0;
  let totalCreditsUsed = 0;

  for (const event of events) {
    const quantity =
      Number(event.quantity) || 0;

    const creditsUsed =
      Number(event.credits_used) || 0;

    totalQuantity += quantity;
    totalCreditsUsed += creditsUsed;

    const eventSummary =
      breakdown[event.event_type];

    eventSummary.quantity += quantity;
    eventSummary.creditsUsed += creditsUsed;
  }

  return {
    periodStart:
      periodStart.toISOString(),

    periodEnd:
      periodEnd.toISOString(),

    totalEvents: events.length,
    totalQuantity,
    totalCreditsUsed,
    breakdown,
  };
}

export async function getCurrentUsageSummary(
  userId: string,
): Promise<UsageSummary> {
  const {
    periodStart,
    periodEnd,
    events,
  } = await getCurrentMonthUsageEvents(
    userId,
  );

  return buildUsageSummary(
    events,
    periodStart,
    periodEnd,
  );
}

function getMonthLabel(
  date: Date,
): string {
  return [
    date.getUTCFullYear(),
    String(
      date.getUTCMonth() + 1,
    ).padStart(2, "0"),
  ].join("-");
}

export async function getUsageHistory(
  userId: string,
  months = 6,
): Promise<UsageHistoryItem[]> {
  const normalizedMonths = Math.min(
    Math.max(
      Number.isInteger(months)
        ? months
        : 6,
      1,
    ),
    24,
  );

  const now = new Date();
  const history: UsageHistoryItem[] = [];

  for (
    let monthOffset =
      normalizedMonths - 1;
    monthOffset >= 0;
    monthOffset--
  ) {
    const monthDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() -
          monthOffset,
        1,
      ),
    );

    const {
      periodStart,
      periodEnd,
    } = getCalendarMonthRange(
      monthDate,
    );

    const events =
      await getUsageEventsForPeriod(
        userId,
        periodStart,
        periodEnd,
      );

    const summary = buildUsageSummary(
      events,
      periodStart,
      periodEnd,
    );

    history.push({
      month: getMonthLabel(
        periodStart,
      ),

      ...summary,
    });
  }

  return history;
}