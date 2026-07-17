import { Router } from "express";

import { getPaginatedUsageEvents } from "../services/usage/usageQueries";

import {
  getCurrentUsageSummary,
  getUsageHistory,
} from "../services/usage/usageSummary";

import {
  isUsageEventType,
  type UsageEventType,
} from "../services/usage/usageTypes";

const router = Router();

function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

/**
 * GET /usage/summary
 *
 * Returns current calendar-month usage.
 * Paid billing periods will be added later.
 */
router.get("/summary", async (req, res) => {
  try {
    const userId = req.user.id;

    const summary = await getCurrentUsageSummary(userId);

    return res.status(200).json({
      plan: "unassigned",
      billingPeriodType: "calendar_month",
      limitsEnforced: false,
      ...summary,
    });
  } catch (error) {
    console.error("Usage summary failed:", error);

    return res.status(500).json({
      message: "Failed to load usage summary.",
      error:
        error instanceof Error ? error.message : "Unknown usage summary error.",
    });
  }
});

/**
 * GET /usage/events
 *
 * Query:
 * page
 * limit
 * eventType
 * dateFrom
 * dateTo
 */
router.get("/events", async (req, res) => {
  try {
    const userId = req.user.id;

    const page = Number(req.query.page);

    const limit = Number(req.query.limit);

    const rawEventType =
      typeof req.query.eventType === "string" ? req.query.eventType : undefined;

    if (rawEventType !== undefined && !isUsageEventType(rawEventType)) {
      return res.status(400).json({
        message: "Invalid usage event type.",
      });
    }

    const eventType: UsageEventType | undefined =
      rawEventType && isUsageEventType(rawEventType) ? rawEventType : undefined;

    const dateFrom = req.query.dateFrom;

    const dateTo = req.query.dateTo;

    if (dateFrom !== undefined && !isValidDateString(dateFrom)) {
      return res.status(400).json({
        message: "dateFrom must be a valid date.",
      });
    }

    if (dateTo !== undefined && !isValidDateString(dateTo)) {
      return res.status(400).json({
        message: "dateTo must be a valid date.",
      });
    }

    const result = await getPaginatedUsageEvents({
      userId,

      page: Number.isInteger(page) && page > 0 ? page : 1,

      limit: Number.isInteger(limit) && limit > 0 ? limit : 20,

      eventType,

      dateFrom:
        typeof dateFrom === "string"
          ? new Date(dateFrom).toISOString()
          : undefined,

      dateTo:
        typeof dateTo === "string" ? new Date(dateTo).toISOString() : undefined,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Usage events failed:", error);

    return res.status(500).json({
      message: "Failed to load usage events.",
      error:
        error instanceof Error ? error.message : "Unknown usage events error.",
    });
  }
});

/**
 * GET /usage/history?months=6
 */
router.get("/history", async (req, res) => {
  try {
    const userId = req.user.id;

    const requestedMonths = Number(req.query.months);

    const months =
      Number.isInteger(requestedMonths) &&
      requestedMonths >= 1 &&
      requestedMonths <= 24
        ? requestedMonths
        : 6;

    const history = await getUsageHistory(userId, months);

    return res.status(200).json({
      months,
      history,
    });
  } catch (error) {
    console.error("Usage history failed:", error);

    return res.status(500).json({
      message: "Failed to load usage history.",
      error:
        error instanceof Error ? error.message : "Unknown usage history error.",
    });
  }
});

export default router;
