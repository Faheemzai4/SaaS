import { Router } from "express";
import { isSupportedCountry, type CountryCode } from "libphonenumber-js/max";

import { searchOnlineCompanies } from "../../services/online/companySearch";
import { processOnlineCompanies } from "../../services/online/onlineLeadDiscovery";
import { safeTrackUsage } from "../../services/usage/usageTracker";

import type {
  EcommercePlatform,
  OnlineBusinessModel,
  OnlineDiscoverInput,
} from "../../types/onlineCompany";

const router = Router();

const validBusinessModels: OnlineBusinessModel[] = [
  "ecommerce",
  "saas",
  "agency",
  "marketplace",
  "other",
];

const validPlatforms: EcommercePlatform[] = [
  "shopify",
  "woocommerce",
  "any",
];

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

    if (
      forceRefresh !== undefined &&
      typeof forceRefresh !== "boolean"
    ) {
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

    if (
      businessModel &&
      !validBusinessModels.includes(businessModel)
    ) {
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

    const parsedPage =
      page === undefined ? 1 : Number(page);

    const parsedLimit =
      limit === undefined ? 5 : Number(limit);

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
      typeof countryCode === "string"
        ? countryCode.trim().toUpperCase()
        : "";

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

      industry:
        typeof industry === "string"
          ? industry.trim()
          : undefined,

      country:
        typeof country === "string"
          ? country.trim()
          : undefined,

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
        mode: "mock",
      },
    });

    /*
     * The project now generates mock online companies.
     * No Brave Search API and no search cache are used.
     */
    const companies = await searchOnlineCompanies(
      searchInput,
      userId,
    );

    const limitedCompanies = companies.slice(0, parsedLimit);

    const results = await processOnlineCompanies(
      limitedCompanies,
      searchInput,
      userId,
    );

    const successfulCount = results.filter(
      (result) => result.success,
    ).length;

    const reusedCount = results.filter(
      (result) => result.reused,
    ).length;

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

      mode: "mock",

      page: parsedPage,
      limit: parsedLimit,

      discovered: limitedCompanies.length,
      successful: successfulCount,
      failed: results.length - successfulCount,
      reused: reusedCount,
      processed: results.filter(
        (result) => result.success && !result.reused,
      ).length,

      cache: "disabled",

      results,
    });
  } catch (error) {
    console.error("ONLINE DISCOVER ERROR:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Online company discovery failed.";

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

export default router;