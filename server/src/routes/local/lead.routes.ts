import { Router } from "express";

import { supabase } from "../../config/supabase";
import { processWebsite } from "../../services/shared/leadDiscovery";
import { validateBulkLeadIds } from "../../utils/validateBulkLeadIds";

const router = Router();

const validStatuses = [
  "Not Contacted",
  "Email Sent",
  "Interested",
  "Meeting Booked",
  "Closed",
  "Needs Manual Review",
] as const;

type LocalLeadStatus = (typeof validStatuses)[number];

function isValidStatus(value: unknown): value is LocalLeadStatus {
  return (
    typeof value === "string" &&
    validStatuses.includes(value as LocalLeadStatus)
  );
}

function parsePositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

/**
 * POST /leads
 *
 * Saves a Local lead owned by the authenticated user.
 */
router.post("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const { user_id: _ignoredUserId, id: _ignoredId, ...leadInput } = req.body;

    const { data, error } = await supabase
      .from("leads")
      .insert({
        ...leadInput,
        user_id: userId,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json(data);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to save lead",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /leads
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const { date, search, priority, status, businessType } = req.query;

    const pageNumber = parsePositiveInteger(req.query.page, 1);

    const requestedLimit = parsePositiveInteger(req.query.limit, 20);

    const limitNumber = Math.min(requestedLimit, 100);

    const from = (pageNumber - 1) * limitNumber;

    const to = from + limitNumber - 1;

    let query = supabase
      .from("leads")
      .select("*", {
        count: "exact",
      })
      .eq("user_id", userId)
      .order("createdAt", {
        ascending: false,
      })
      .range(from, to);

    if (date) {
      const start = new Date(`${String(date)}T00:00:00.000Z`);

      const end = new Date(`${String(date)}T23:59:59.999Z`);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return res.status(400).json({
          message: "date must use YYYY-MM-DD format.",
        });
      }

      query = query
        .gte("createdAt", start.toISOString())
        .lte("createdAt", end.toISOString());
    }

    if (priority) {
      query = query.eq("priority", String(priority));
    }

    if (status === "No Website") {
      query = query.like("url", "no-website:%");
    } else if (status) {
      query = query.eq("status", String(status));
    }

    if (businessType) {
      query = query.eq("businessType", String(businessType));
    }

    if (search) {
      const safeSearch = String(search).trim().replace(/[%_,]/g, " ");

      if (safeSearch) {
        query = query.or(
          [
            `title.ilike.%${safeSearch}%`,
            `url.ilike.%${safeSearch}%`,
            `businessType.ilike.%${safeSearch}%`,
            `city.ilike.%${safeSearch}%`,
            `state.ilike.%${safeSearch}%`,
          ].join(","),
        );
      }
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return res.json({
      leads: data ?? [],
      total: count ?? 0,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil((count ?? 0) / limitNumber),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load leads",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * PATCH /leads/bulk/status
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
      .from("leads")
      .update({
        status,
        updatedAt: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .in("id", ids)
      .select("*");

    if (error) {
      throw error;
    }

    return res.status(200).json({
      message: `${data?.length ?? 0} local leads updated.`,
      updatedCount: data?.length ?? 0,
      leads: data ?? [],
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update selected local leads.";

    console.error("Bulk Local lead status update failed:", error);

    return res.status(500).json({
      message,
    });
  }
});

/**
 * PATCH /leads/:id/status
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const userId = req.user.id;
    const status: unknown = req.body.status;

    if (!isValidStatus(status)) {
      return res.status(400).json({
        message: `status must be one of: ${validStatuses.join(", ")}.`,
      });
    }

    const { data, error } = await supabase
      .from("leads")
      .update({
        status,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        message: "Lead not found.",
      });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update lead status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /leads/bulk/retry
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
      .from("leads")
      .select("*")
      .eq("user_id", userId)
      .in("id", ids);

    if (findError) {
      throw findError;
    }

    const results = [];

    for (const lead of existingLeads ?? []) {
      if (!lead.url || String(lead.url).startsWith("no-website:")) {
        results.push({
          id: lead.id,
          success: false,
          lead,
          error: "This lead does not have a valid website.",
        });

        continue;
      }

      try {
        const newLeadData = await processWebsite(lead.url, userId, {
          businessName: lead.title || "",
          businessType: lead.businessType || "",
          city: lead.city || "",
          state: lead.state || "",
          phone:
            Array.isArray(lead.phones) && typeof lead.phones[0] === "string"
              ? lead.phones[0]
              : undefined,
          address: lead.description || undefined,
          source: "retry",
        });

        if (!newLeadData) {
          results.push({
            id: lead.id,
            success: false,
            lead,
            error: "Website could not be analyzed.",
          });

          continue;
        }

        results.push({
          id: lead.id,
          success: true,
          lead: newLeadData,
        });
      } catch (error) {
        results.push({
          id: lead.id,
          success: false,
          lead,
          error: error instanceof Error ? error.message : "Retry failed.",
        });
      }
    }

    const successful = results.filter((result) => result.success).length;

    return res.status(200).json({
      message: `${successful} of ${results.length} local leads retried successfully.`,
      total: results.length,
      successful,
      failed: results.length - successful,
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retry selected local leads.";

    console.error("Bulk Local lead retry failed:", error);

    return res.status(500).json({
      message,
    });
  }
});

/**
 * POST /leads/:id/retry
 */
router.post("/:id/retry", async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: lead, error: findError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    if (!lead.url || String(lead.url).startsWith("no-website:")) {
      return res.status(400).json({
        message: "Lead has no valid website URL",
      });
    }

    const newLeadData = await processWebsite(lead.url, userId, {
      businessName: lead.title || "",
      businessType: lead.businessType || "",
      city: lead.city || "",
      state: lead.state || "",
      phone:
        Array.isArray(lead.phones) && typeof lead.phones[0] === "string"
          ? lead.phones[0]
          : undefined,
      address: lead.description || undefined,
      source: "retry",
    });

    if (!newLeadData) {
      return res.status(500).json({
        message: "Retry failed. Website could not be analyzed.",
      });
    }

    return res.json(newLeadData);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retry analysis",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * DELETE /leads/bulk
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
      .from("leads")
      .delete()
      .eq("user_id", userId)
      .in("id", ids)
      .select("id");

    if (error) {
      throw error;
    }

    const deletedIds = data?.map((lead) => lead.id) ?? [];

    return res.status(200).json({
      message: `${deletedIds.length} local leads deleted.`,
      deletedCount: deletedIds.length,
      deletedIds,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete selected local leads.";

    console.error("Bulk Local lead deletion failed:", error);

    return res.status(500).json({
      message,
    });
  }
});

/**
 * DELETE /leads/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("leads")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        message: "Lead not found.",
      });
    }

    return res.json({
      message: "Lead deleted successfully",
      lead: data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete lead",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
