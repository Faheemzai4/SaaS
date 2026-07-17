import { Router } from "express";
import { isSupportedCountry, type CountryCode } from "libphonenumber-js/max";

import { searchBusinesses } from "../../services/local/businessSearch";
import { resolveExistingLocalLead } from "../../services/local/existingLeadResolver";

import { processWebsite } from "../../services/shared/leadDiscovery";
import { createNoWebsiteLead } from "../../services/shared/noWebsiteLead";
import { safeTrackUsage } from "../../services/usage/usageTracker";

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

    const normalizedBusinessType = String(businessType).trim();
    const normalizedCity = String(city).trim();

    const normalizedState = typeof state === "string" ? state.trim() : "";

    const normalizedCountryCode = String(countryCode)
      .trim()
      .toUpperCase() as CountryCode;

    if (!isSupportedCountry(normalizedCountryCode)) {
      return res.status(400).json({
        message: `Invalid or unsupported countryCode: ${countryCode}`,
      });
    }

    const requestedLimit = Number(limit);
    const searchLimit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : 5;

    await safeTrackUsage({
      userId,
      eventType: "local_search",
      quantity: 1,
      creditsUsed: 1,
      source: "local",
      metadata: {
        businessType: normalizedBusinessType,
        city: normalizedCity,
        state: normalizedState,
        countryCode: normalizedCountryCode,
        requestedLimit: searchLimit,
        forceRefresh: forceRefresh === true,
        mode: "mock",
      },
    });

    /*
     * The project now uses dummy/generated business data.
     * No Foursquare request and no search cache are used here.
     */
    const businesses = await searchBusinesses({
      businessType: normalizedBusinessType,
      city: normalizedCity,
      state: normalizedState,
      countryCode: normalizedCountryCode,
      limit: searchLimit,
    });

    const results = [];

    for (const business of businesses) {
      if (!business.website) {
        const lead = await createNoWebsiteLead({
          userId,
          businessName: business.name,
          businessType: normalizedBusinessType,
          city: normalizedCity,
          state: normalizedState,
          countryCode: normalizedCountryCode,
          phone: business.phone,
          address: business.address,
        });

        results.push({
          businessName: business.name,
          website: null,
          businessType: normalizedBusinessType,
          city: normalizedCity,
          state: normalizedState,
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
        results.push({
          businessName: business.name,
          website: existingResolution.existingLead.url,
          businessType: normalizedBusinessType,
          city: normalizedCity,
          state: normalizedState,
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
        results.push({
          businessName: business.name,
          website: existingResolution.existingLead.url,
          businessType: normalizedBusinessType,
          city: normalizedCity,
          state: normalizedState,
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

      const lead = await processWebsite(business.website, userId, {
        businessName: business.name,
        businessType: normalizedBusinessType,
        city: normalizedCity,
        state: normalizedState,
        countryCode: normalizedCountryCode,
        phone: business.phone,
        address: business.address,
      });

      results.push({
        businessName: business.name,
        website: lead?.url || business.website,
        businessType: normalizedBusinessType,
        city: normalizedCity,
        state: normalizedState,
        countryCode: normalizedCountryCode,
        phone: business.phone,
        address: business.address,
        success: lead?.status !== "Needs Manual Review",
        reused: false,
        skipped: false,
        lead,
      });
    }

    const successfulCount = results.filter((result) => result.success).length;

    const reusedCount = results.filter((result) => result.reused).length;

    const skippedCount = results.filter((result) => result.skipped).length;

    const noWebsiteCount = results.filter(
      (result) => result.website === null,
    ).length;

    const processedCount = results.filter(
      (result) =>
        result.success &&
        !result.reused &&
        !result.skipped &&
        result.website !== null,
    ).length;

    return res.json({
      businessType: normalizedBusinessType,
      city: normalizedCity,
      state: normalizedState,
      countryCode: normalizedCountryCode,
      limit: searchLimit,
      forceRefresh: forceRefresh === true,
      mode: "mock",

      total: results.length,
      successful: successfulCount,
      failed: results.length - successfulCount,
      reused: reusedCount,
      processed: processedCount,
      skipped: skippedCount,
      noWebsite: noWebsiteCount,

      cache: "disabled",
      results,
    });
  } catch (error) {
    console.error(
      "Local discovery failed:",
      error instanceof Error ? error.message : error,
    );

    return res.status(500).json({
      message: "Local discovery failed",
      error: error instanceof Error ? error.message : JSON.stringify(error),
    });
  }
});

export default router;
