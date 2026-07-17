import axios from "axios";
import { Router } from "express";
import { isSupportedCountry, type CountryCode } from "libphonenumber-js/max";

import { searchBusinesses } from "../../services/local/businessSearch";
import { processWebsite } from "../../services/shared/leadDiscovery";
import { createNoWebsiteLead } from "../../services/shared/noWebsiteLead";
import { generateCacheKey } from "../../services/local/cache/cacheKey";

import type { BusinessLead } from "../../services/local/businessSearch";
import { remainingDays } from "../../services/local/cache/cacheExpiry";
import { queueRefresh } from "../../services/local/cache/refreshWorker";
import { resolveExistingLocalLead } from "../../services/local/existingLeadResolver";
import { safeTrackUsage } from "../../services/usage/usageTracker";
import {
  getCachedSearch,
  saveCachedSearch,
} from "../../services/local/cache/searchCache";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const { businessType, city, state, countryCode, limit, forceRefresh } =
      req.body;

    if (!businessType || !city || !countryCode) {
      return res.status(400).json({
        message: "businessType, city, and countryCode are required",
      });
    }

    if (forceRefresh !== undefined && typeof forceRefresh !== "boolean") {
      return res.status(400).json({
        message: "forceRefresh must be a boolean.",
      });
    }

    const normalizedCountryCode = String(countryCode)
      .trim()
      .toUpperCase() as CountryCode;

    if (!isSupportedCountry(normalizedCountryCode)) {
      return res.status(400).json({
        message: `Invalid or unsupported countryCode: ${countryCode}`,
      });
    }

    const searchLimit = Number(limit) || 5;
    await safeTrackUsage({
      userId,
      eventType: "local_search",
      quantity: 1,
      creditsUsed: 1,
      source: "local",
      metadata: {
        businessType: String(businessType).trim(),

        city: String(city).trim(),

        state: typeof state === "string" ? state.trim() : "",

        countryCode: normalizedCountryCode,

        requestedLimit: searchLimit,

        forceRefresh: forceRefresh === true,
      },
    });

    const cacheKey = generateCacheKey({
      businessType,
      city,
      state,
      countryCode: normalizedCountryCode,
    });

    //
    let businesses: BusinessLead[];

    const cachedSearch = await getCachedSearch(cacheKey);

    const cachedBusinesses: BusinessLead[] = Array.isArray(
      cachedSearch?.results,
    )
      ? (cachedSearch.results as BusinessLead[])
      : [];

    let cacheStatus: "hit" | "partial" | "miss";

    if (cachedBusinesses.length >= searchLimit) {
      console.log(
        `✅ Cache hit: returning ${searchLimit} from ${cachedBusinesses.length}`,
      );

      cacheStatus = "hit";
      businesses = cachedBusinesses.slice(0, searchLimit);

      if (cachedSearch && remainingDays(cachedSearch.expires_at) <= 2) {
        queueRefresh({
          businessType,
          city,
          state,
          countryCode: normalizedCountryCode,
        });
      }
    } else {
      cacheStatus = cachedBusinesses.length > 0 ? "partial" : "miss";

      const missingCount = searchLimit - cachedBusinesses.length;

      console.log(
        `🌍 Cache ${cacheStatus}: have ${cachedBusinesses.length}, need ${missingCount} more`,
      );

      const freshBusinesses = await searchBusinesses({
        businessType,
        city,
        state,
        countryCode: normalizedCountryCode,

        // Request the complete desired amount because the endpoint
        // cannot start from result number 6.
        limit: searchLimit,
      });

      const cachedKeys = new Set(
        cachedBusinesses.map((business) => {
          if (business.website) {
            return `website:${business.website.trim().toLowerCase()}`;
          }

          return `business:${business.name.trim().toLowerCase()}:${(
            business.address || ""
          )
            .trim()
            .toLowerCase()}`;
        }),
      );

      const newBusinesses = freshBusinesses.filter((business) => {
        const key = business.website
          ? `website:${business.website.trim().toLowerCase()}`
          : `business:${business.name.trim().toLowerCase()}:${(
              business.address || ""
            )
              .trim()
              .toLowerCase()}`;

        return !cachedKeys.has(key);
      });

      const additionalBusinesses = newBusinesses.slice(0, missingCount);

      businesses = [...cachedBusinesses, ...additionalBusinesses].slice(
        0,
        searchLimit,
      );

      const updatedCache = [...cachedBusinesses, ...additionalBusinesses];

      await saveCachedSearch({
        cacheKey,
        businessType,
        city,
        state,
        results: updatedCache,
      });

      console.log(
        `💾 Cache updated: ${cachedBusinesses.length} cached + ${additionalBusinesses.length} new = ${businesses.length}`,
      );
    }
    //

    const results = [];

    for (const business of businesses) {
      if (!business.website) {
        const lead = await createNoWebsiteLead({
          userId,

          businessName: business.name,
          businessType,
          city,
          state,
          countryCode: normalizedCountryCode,

          phone: business.phone,
          address: business.address,
        });

        results.push({
          businessName: business.name,
          website: null,
          businessType,
          city,
          state,
          countryCode: normalizedCountryCode,
          phone: business.phone,
          address: business.address,
          success: true,
          reused: false,
          skipped: false,
          lead,
        });

        continue;
      }

      const existingResolution = await resolveExistingLocalLead({
        websiteUrl: business.website,
        userId,
        forceRefresh: forceRefresh === true,
      });

      if (existingResolution.shouldReuse && existingResolution.existingLead) {
        console.log(
          `⚡ Reusing fresh completed Local lead: ${business.website}`,
        );

        results.push({
          businessName: business.name,
          website: existingResolution.existingLead.url,
          businessType,
          city,
          state,
          countryCode: normalizedCountryCode,
          phone: business.phone,
          address: business.address,
          success: true,
          reused: true,
          skipped: false,
          lead: existingResolution.existingLead,
        });

        continue;
      }

      if (existingResolution.shouldSkip && existingResolution.existingLead) {
        console.log(`⏸ Skipping Local lead processing: ${business.website}`, {
          reason: existingResolution.reason,
        });

        results.push({
          businessName: business.name,
          website: existingResolution.existingLead.url,
          businessType,
          city,
          state,
          countryCode: normalizedCountryCode,
          phone: business.phone,
          address: business.address,

          success:
            existingResolution.existingLead.status !== "Needs Manual Review",

          reused: false,
          skipped: true,

          skipReason: existingResolution.reason,

          lead: existingResolution.existingLead,
        });

        continue;
      }
      console.log(`Processing Local lead: ${business.website}`, {
        reason: existingResolution.reason,
        forceRefresh: forceRefresh === true,
      });

      const lead = await processWebsite(business.website, userId, {
        businessName: business.name,
        businessType,
        city,
        state,
        countryCode: normalizedCountryCode,
        phone: business.phone,
        address: business.address,
      });

      results.push({
        businessName: business.name,
        website: lead?.url || business.website,
        businessType,
        city,
        state,
        countryCode: normalizedCountryCode,
        phone: business.phone,
        address: business.address,
        success: lead?.status !== "Needs Manual Review",
        reused: false,
        skipped: false,
        lead,
      });
    }

    const noWebsiteCount = results.filter(
      (result) => result.website === null,
    ).length;

    const processedWebsiteCount = results.filter(
      (result) =>
        result.success &&
        !result.reused &&
        !result.skipped &&
        result.website !== null,
    ).length;
    const skippedCount = results.filter((result) => result.skipped).length;

    return res.json({
      businessType,
      city,
      state,
      countryCode: normalizedCountryCode,
      limit: searchLimit,
      forceRefresh: forceRefresh === true,

      total: results.length,

      successful: results.filter((result) => result.success).length,

      failed: results.filter((result) => !result.success).length,

      reused: results.filter((result) => result.reused).length,

      processed: processedWebsiteCount,

      skipped: skippedCount,

      noWebsite: noWebsiteCount,

      cache: cacheStatus,
      results,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Discovery failed:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
      });
    } else {
      console.error(
        "Discovery failed:",
        error instanceof Error ? error.message : error,
      );
    }

    return res.status(500).json({
      message: "Discovery failed",
      error: error instanceof Error ? error.message : JSON.stringify(error),
    });
  }
});

export default router;
