import { Router } from "express";

import { searchOnlineCompanies } from "../../services/online/companySearch";
import type {
  EcommercePlatform,
  OnlineBusinessModel,
  OnlineDiscoverInput,
} from "../../types/onlineCompany";
import {
  getOnlineSearchCache,
  renewOnlineSearchCache,
  saveOnlineSearchCache,
} from "../../services/online/cache/searchCache";
import { processOnlineCompanies } from "../../services/online/onlineLeadDiscovery";
import { runOnlineCacheRefreshWorker } from "../../services/online/cache/refreshWorker";
import { isSupportedCountry, type CountryCode } from "libphonenumber-js/max";
import { safeTrackUsage } from "../../services/usage/usageTracker";

const router = Router();

const validBusinessModels: OnlineBusinessModel[] = [
  "ecommerce",
  "saas",
  "agency",
  "marketplace",
  "other",
];

const validPlatforms: EcommercePlatform[] = ["shopify", "woocommerce", "any"];

router.post("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      keywords,
      businessModel,
      industry,
      country,
      countryCode,
      platform,
      page,
      limit,
      forceRefresh,
    } = req.body as OnlineDiscoverInput;

    if (forceRefresh !== undefined && typeof forceRefresh !== "boolean") {
      return res.status(400).json({
        message: "forceRefresh must be a boolean.",
      });
    }

    const normalizedKeywords =
      typeof keywords === "string" ? keywords.trim() : "";

    if (!normalizedKeywords) {
      return res.status(400).json({
        message: "keywords is required.",
      });
    }

    if (businessModel && !validBusinessModels.includes(businessModel)) {
      return res.status(400).json({
        message:
          "businessModel must be ecommerce, saas, agency, marketplace, or other.",
      });
    }

    if (platform && !validPlatforms.includes(platform)) {
      return res.status(400).json({
        message: "platform must be shopify, woocommerce, or any.",
      });
    }

    const parsedPage = page === undefined ? 1 : Number(page);

    const parsedLimit = limit === undefined ? 5 : Number(limit);

    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      return res.status(400).json({
        message: "page must be a positive integer.",
      });
    }

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      return res.status(400).json({
        message: "limit must be an integer between 1 and 100.",
      });
    }

    const normalizedCountryCode =
      typeof countryCode === "string" ? countryCode.trim().toUpperCase() : "";

    if (
      normalizedCountryCode &&
      !isSupportedCountry(normalizedCountryCode as CountryCode)
    ) {
      return res.status(400).json({
        message: `Invalid or unsupported countryCode: ${countryCode}`,
      });
    }

    const searchInput: OnlineDiscoverInput = {
      keywords: normalizedKeywords,
      businessModel,

      industry: typeof industry === "string" ? industry.trim() : undefined,

      country: typeof country === "string" ? country.trim() : undefined,

      countryCode: normalizedCountryCode || undefined,

      platform: platform || "any",
      page: parsedPage,
      limit: parsedLimit,
      forceRefresh: forceRefresh === true,
    };

    await safeTrackUsage({
      userId,
      eventType: "online_search",
      quantity: 1,
      creditsUsed: 1,
      source: "online",
      metadata: {
        keywords: searchInput.keywords,
        businessModel: searchInput.businessModel || "any",
        industry: searchInput.industry || "",
        country: searchInput.country || "",
        countryCode: searchInput.countryCode || "",
        platform: searchInput.platform || "any",
        page: parsedPage,
        requestedLimit: parsedLimit,
        forceRefresh: forceRefresh === true,
      },
    });

    const cache = await getOnlineSearchCache(searchInput);

    let companies = cache.cachedResults;

    if (!cache.hasEnoughResults) {
      console.log("Online cache miss.");

      companies = await searchOnlineCompanies(searchInput, userId);

      await saveOnlineSearchCache(searchInput, companies);
    } else {
      console.log(`Online cache hit (${companies.length} companies).`);

      await renewOnlineSearchCache(cache.cacheKey);

      console.log("Online cache expiry renewed for another 7 days.");

      companies = companies.slice(0, parsedLimit);
    }

    const results = await processOnlineCompanies(
      companies,
      searchInput,
      userId,
    );

    return res.status(200).json({
      filters: {
        keywords: searchInput.keywords,
        businessModel: searchInput.businessModel ?? null,
        industry: searchInput.industry ?? null,
        country: searchInput.country ?? null,
        countryCode: searchInput.countryCode ?? null,
        platform: searchInput.platform ?? "any",
        forceRefresh: searchInput.forceRefresh ?? false,
      },

      page: parsedPage,
      limit: parsedLimit,

      discovered: companies.length,
      successful: results.filter((result) => result.success).length,
      failed: results.filter((result) => !result.success).length,
      reused: results.filter((result) => result.reused).length,
      processed: results.filter((result) => result.success && !result.reused)
        .length,

      results,
    });
  } catch (error) {
    console.error("FULL ONLINE DISCOVER ERROR:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Online company discovery failed.";

    if (message.includes("is missing")) {
      return res.status(500).json({ message });
    }

    if (message.includes("authentication failed")) {
      return res.status(401).json({ message });
    }

    if (message.includes("denied")) {
      return res.status(403).json({ message });
    }

    if (message.includes("rate limit")) {
      return res.status(429).json({ message });
    }

    if (
      message.includes("required") ||
      message.includes("must be") ||
      message.includes("rejected the search parameters")
    ) {
      return res.status(400).json({ message });
    }

    return res.status(500).json({ message });
  }
});

router.post("/refresh-cache", async (req, res) => {
  try {
    const requestedBatchSize = Number(req.body?.batchSize);
    const batchSize =
      Number.isInteger(requestedBatchSize) && requestedBatchSize > 0
        ? requestedBatchSize
        : 10;

    const result = await runOnlineCacheRefreshWorker(batchSize);

    return res.status(200).json({
      message: "Online cache refresh worker completed.",
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Online cache refresh worker failed.";

    console.error("Online cache refresh worker route failed:", error);

    return res.status(500).json({
      message,
    });
  }
});

export default router;
