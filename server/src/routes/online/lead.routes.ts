import { Router } from "express";

import { supabase } from "../../config/supabase";
import { processOnlineCompany } from "../../services/online/onlineLeadDiscovery";
import type {
  OnlineBusinessModel,
  OnlineCompanySearchResult,
  OnlineDiscoverInput,
} from "../../types/onlineCompany";
import { validateBulkLeadIds } from "../../utils/validateBulkLeadIds";
import { OnlineLeadStatus } from "../../types/onlineLead";

const router = Router();

const validStatuses = [
  "Processing",
  "Not Contacted",
  "Email Sent",
  "Interested",
  "Meeting Booked",
  "Closed",
  "Needs Manual Review",
] as const satisfies readonly OnlineLeadStatus[];

function isValidStatus(value: unknown): value is OnlineLeadStatus {
  return (
    typeof value === "string" &&
    validStatuses.includes(value as OnlineLeadStatus)
  );
}

function parsePositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function normalizeSearchValue(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  return normalized || undefined;
}

/**
 * GET /online/leads
 *
 * Supported query parameters:
 * page
 * limit
 * search
 * businessModel
 * industry
 * country
 * priority
 * status
 * analysisStatus
 * date
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parsePositiveInteger(req.query.page, 1);

    const requestedLimit = parsePositiveInteger(req.query.limit, 10);
    const limit = Math.min(requestedLimit, 100);

    const search = normalizeSearchValue(req.query.search);
    const businessModel = normalizeSearchValue(req.query.businessModel);
    const industry = normalizeSearchValue(req.query.industry);
    const country = normalizeSearchValue(req.query.country);
    const priority = normalizeSearchValue(req.query.priority);
    const status = normalizeSearchValue(req.query.status);
    const analysisStatus = normalizeSearchValue(req.query.analysisStatus);
    const date = normalizeSearchValue(req.query.date);

    if (status && !isValidStatus(status)) {
      return res.status(400).json({
        message: "Invalid status.",
      });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("online_leads")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    if (search) {
      const safeSearch = search.replace(/[%_,]/g, " ");

      query = query.or(
        [
          `name.ilike.%${safeSearch}%`,
          `website_url.ilike.%${safeSearch}%`,
          `primary_domain.ilike.%${safeSearch}%`,
          `description.ilike.%${safeSearch}%`,
        ].join(","),
      );
    }

    if (businessModel) {
      query = query.eq("business_model", businessModel);
    }

    if (industry) {
      query = query.ilike("industry", `%${industry}%`);
    }

    if (country) {
      query = query.ilike("country", `%${country}%`);
    }

    if (priority) {
      query = query.eq("priority", priority);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (analysisStatus) {
      query = query.eq("analysis_status", analysisStatus);
    }

    if (date) {
      const startDate = new Date(`${date}T00:00:00.000Z`);
      const endDate = new Date(`${date}T23:59:59.999Z`);

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        return res.status(400).json({
          message: "date must use YYYY-MM-DD format.",
        });
      }

      query = query
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
    }

    const { data, error, count } = await query
      .order("created_at", {
        ascending: false,
      })
      .range(from, to);

    if (error) {
      throw error;
    }

    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages,
      leads: data || [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load online leads.";

    console.error("Get online leads failed:", error);

    return res.status(500).json({
      message,
    });
  }
});

/**
 * PATCH /online/leads/bulk/status
 *
 * Body:
 * {
 *   "ids": ["uuid-1", "uuid-2"],
 *   "status": "Interested"
 * }
 */
router.patch("/bulk/status", async (req, res) => {
  try {
    const userId = req.user.id;
    const ids = validateBulkLeadIds(req.body.ids);
    const status: unknown = req.body.status;

    if (!ids) {
      return res.status(400).json({
        message: "A non-empty ids array is required.",
      });
    }

    if (!isValidStatus(status)) {
      return res.status(400).json({
        message: `status must be one of: ${validStatuses.join(", ")}.`,
      });
    }

    const { data, error } = await supabase
      .from("online_leads")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .in("id", ids)
      .select("*");

    if (error) {
      throw error;
    }

    return res.status(200).json({
      message: `${data?.length ?? 0} online leads updated.`,
      updatedCount: data?.length ?? 0,
      leads: data ?? [],
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update selected online leads.";

    console.error("Bulk online lead status update failed:", error);

    return res.status(500).json({
      message,
    });
  }
});
/**
 * GET /online/leads/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data, error } = await supabase
      .from("online_leads")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        message: "Online lead not found.",
      });
    }

    return res.status(200).json({
      lead: data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load online lead.";

    console.error("Get online lead failed:", error);

    return res.status(500).json({
      message,
    });
  }
});

/**
 * PATCH /online/leads/:id/status
 *
 * Body:
 * {
 *   "status": "Interested"
 * }
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body as {
      status?: unknown;
    };

    if (!isValidStatus(status)) {
      return res.status(400).json({
        message: `status must be one of: ${validStatuses.join(", ")}.`,
      });
    }

    const { data, error } = await supabase
      .from("online_leads")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        message: "Online lead not found.",
      });
    }

    return res.status(200).json({
      message: "Online lead status updated.",
      lead: data,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update online lead status.";

    console.error("Update online lead status failed:", error);

    return res.status(500).json({
      message,
    });
  }
});

/**
 * POST /online/leads/bulk/retry
 *
 * Body:
 * {
 *   "ids": ["uuid-1", "uuid-2"]
 * }
 */
router.post("/bulk/retry", async (req, res) => {
  try {
    const userId = req.user.id;
    const ids = validateBulkLeadIds(req.body.ids);

    if (!ids) {
      return res.status(400).json({
        message: "A non-empty ids array is required.",
      });
    }

    const { data: existingLeads, error: findError } = await supabase
      .from("online_leads")
      .select("*")
      .eq("user_id", userId)
      .in("id", ids);

    if (findError) {
      throw findError;
    }

    const results = [];

    for (const existingLead of existingLeads ?? []) {
      if (!existingLead.website_url) {
        results.push({
          id: existingLead.id,
          success: false,
          lead: existingLead,
          error: "Lead does not have a website.",
        });

        continue;
      }

      try {
        const company: OnlineCompanySearchResult = {
          name: existingLead.name,
          websiteUrl: existingLead.website_url,
          title: existingLead.page_title || existingLead.name,
          description: existingLead.description || "",
          sourceUrl: existingLead.source_url || existingLead.website_url,
          businessModel:
            (existingLead.business_model as OnlineBusinessModel) || "other",
        };

        const searchInput: OnlineDiscoverInput = {
          keywords: existingLead.name,
          businessModel:
            (existingLead.business_model as OnlineBusinessModel) || "other",
          industry: existingLead.industry || undefined,
          country: existingLead.country || undefined,
          platform: "any",
          page: 1,
          limit: 1,
          forceRefresh: true,
        };

        const result = await processOnlineCompany({
          company,
          searchInput,
          userId,
        });

        results.push({
          id: existingLead.id,
          ...result,
        });
      } catch (error) {
        results.push({
          id: existingLead.id,
          success: false,
          lead: existingLead,
          error: error instanceof Error ? error.message : "Retry failed.",
        });
      }
    }

    const successful = results.filter((result) => result.success).length;

    return res.status(200).json({
      message: `${successful} of ${results.length} online leads retried successfully.`,
      total: results.length,
      successful,
      failed: results.length - successful,
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retry selected online leads.";

    console.error("Bulk online lead retry failed:", error);

    return res.status(500).json({
      message,
    });
  }
});

/**
 * POST /online/leads/:id/retry
 */
router.post("/:id/retry", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: existingLead, error: findError } = await supabase
      .from("online_leads")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (!existingLead) {
      return res.status(404).json({
        message: "Online lead not found.",
      });
    }

    if (!existingLead.website_url) {
      return res.status(400).json({
        message: "This lead does not have a website to retry.",
      });
    }

    const company: OnlineCompanySearchResult = {
      name: existingLead.name,
      websiteUrl: existingLead.website_url,
      title: existingLead.page_title || existingLead.name,
      description: existingLead.description || "",
      sourceUrl: existingLead.source_url || existingLead.website_url,
      businessModel:
        (existingLead.business_model as OnlineBusinessModel) || "other",
    };

    const searchInput: OnlineDiscoverInput = {
      keywords: existingLead.name,
      businessModel:
        (existingLead.business_model as OnlineBusinessModel) || "other",
      industry: existingLead.industry || undefined,
      country: existingLead.country || undefined,
      platform: "any",
      page: 1,
      limit: 1,
      forceRefresh: true,
    };

    const result = await processOnlineCompany({
      company,
      searchInput,
      userId,
    });

    return res.status(result.success ? 200 : 422).json({
      message: result.success
        ? "Online lead reprocessed successfully."
        : "Online lead retry completed but analysis still failed.",
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retry online lead.";

    console.error("Retry online lead failed:", error);

    return res.status(500).json({
      message,
    });
  }
});

/**
 * DELETE /online/leads/bulk
 *
 * Body:
 * {
 *   "ids": ["uuid-1", "uuid-2"]
 * }
 */
router.delete("/bulk", async (req, res) => {
  try {
    const userId = req.user.id;
    const ids = validateBulkLeadIds(req.body.ids);

    if (!ids) {
      return res.status(400).json({
        message: "A non-empty ids array is required.",
      });
    }

    const { data, error } = await supabase
      .from("online_leads")
      .delete()
      .eq("user_id", userId)
      .in("id", ids)
      .select("id");

    if (error) {
      throw error;
    }

    const deletedIds = data?.map((lead) => lead.id) ?? [];

    return res.status(200).json({
      message: `${deletedIds.length} online leads deleted.`,
      deletedCount: deletedIds.length,
      deletedIds,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete selected online leads.";

    console.error("Bulk online lead deletion failed:", error);

    return res.status(500).json({
      message,
    });
  }
});
/**
 * DELETE /online/leads/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data, error } = await supabase
      .from("online_leads")
      .delete()
      .eq("user_id", userId)
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        message: "Online lead not found.",
      });
    }

    return res.status(200).json({
      message: "Online lead deleted.",
      id: data.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete online lead.";

    console.error("Delete online lead failed:", error);

    return res.status(500).json({
      message,
    });
  }
});

export default router;
