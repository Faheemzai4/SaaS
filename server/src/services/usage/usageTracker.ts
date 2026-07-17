import { supabase } from "../../config/supabase";

import {
  isUsageEventType,
  type TrackUsageInput,
  type UsageMetadata,
} from "./usageTypes";

const MAX_METADATA_STRING_LENGTH = 500;
const MAX_METADATA_ARRAY_LENGTH = 50;

function sanitizeMetadataValue(
  value: unknown,
):
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value
      .trim()
      .slice(0, MAX_METADATA_STRING_LENGTH);
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    const limitedValues = value.slice(
      0,
      MAX_METADATA_ARRAY_LENGTH,
    );

    if (
      limitedValues.every(
        (item) => typeof item === "string",
      )
    ) {
      return limitedValues.map((item) =>
        item
          .trim()
          .slice(0, MAX_METADATA_STRING_LENGTH),
      );
    }

    if (
      limitedValues.every(
        (item) =>
          typeof item === "number" &&
          Number.isFinite(item),
      )
    ) {
      return limitedValues;
    }
  }

  return undefined;
}

export function sanitizeUsageMetadata(
  metadata?: Record<string, unknown>,
): UsageMetadata {
  if (!metadata) {
    return {};
  }

  const sanitized: UsageMetadata = {};

  for (const [key, value] of Object.entries(metadata)) {
    const normalizedKey = key
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .slice(0, 100);

    if (!normalizedKey) {
      continue;
    }

    const sanitizedValue =
      sanitizeMetadataValue(value);

    if (sanitizedValue !== undefined) {
      sanitized[normalizedKey] = sanitizedValue;
    }
  }

  return sanitized;
}

function normalizePositiveInteger(
  value: number | undefined,
  fallback: number,
): number {
  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1
  ) {
    return fallback;
  }

  return parsedValue;
}

function normalizeNonNegativeInteger(
  value: number | undefined,
  fallback: number,
): number {
  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 0
  ) {
    return fallback;
  }

  return parsedValue;
}

export async function trackUsage({
  userId,
  eventType,
  quantity = 1,
  creditsUsed = 1,
  source,
  metadata,
}: TrackUsageInput): Promise<void> {
  const normalizedUserId = userId?.trim();

  if (!normalizedUserId) {
    throw new Error(
      "A valid userId is required to track usage.",
    );
  }

  if (!isUsageEventType(eventType)) {
    throw new Error(
      `Invalid usage event type: ${String(eventType)}`,
    );
  }

  const normalizedQuantity =
    normalizePositiveInteger(quantity, 1);

  const normalizedCreditsUsed =
    normalizeNonNegativeInteger(creditsUsed, 1);

  const safeMetadata = sanitizeUsageMetadata(
    metadata,
  );

  const { error } = await supabase
    .from("usage_events")
    .insert({
      user_id: normalizedUserId,
      event_type: eventType,
      quantity: normalizedQuantity,
      credits_used: normalizedCreditsUsed,
      source: source || null,
      metadata: safeMetadata,
    });

  if (error) {
    throw new Error(
      `Failed to track ${eventType}: ${error.message}`,
    );
  }
}

/**
 * Initial usage tracking should not make working
 * lead discovery or analysis requests fail.
 *
 * We will use strict/atomic tracking later when
 * subscription limits are enforced.
 */
export async function safeTrackUsage(
  input: TrackUsageInput,
): Promise<boolean> {
  try {
    await trackUsage(input);

    return true;
  } catch (error) {
    console.error("Usage tracking failed:", {
      eventType: input.eventType,
      userId: input.userId,
      error:
        error instanceof Error
          ? error.message
          : error,
    });

    return false;
  }
}