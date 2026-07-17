import { Router } from "express";

import { supabase } from "../../config/supabase";

const router = Router();

interface OnlineStatsResponse {
  total: number;
  highPriority: number;
  withEmail: number;
  manualReview: number;
  interested: number;
  closed: number;
}

router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      totalResult,
      highPriorityResult,
      withEmailResult,
      manualReviewResult,
      interestedResult,
      closedResult,
    ] = await Promise.all([
      supabase
        .from("online_leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", userId),

      supabase
        .from("online_leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", userId)
        .eq("priority", "High"),

      supabase
        .from("online_leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", userId)
        .not("emails", "is", null)
        .neq("emails", "{}"),

      supabase
        .from("online_leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", userId)
        .eq("status", "Needs Manual Review"),

      supabase
        .from("online_leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", userId)
        .eq("status", "Interested"),

      supabase
        .from("online_leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", userId)
        .eq("status", "Closed"),
    ]);

    const results = [
      totalResult,
      highPriorityResult,
      withEmailResult,
      manualReviewResult,
      interestedResult,
      closedResult,
    ];

    const failedResult = results.find((result) => result.error);

    if (failedResult?.error) {
      console.error("Online stats Supabase error:", failedResult.error);

      return res.status(500).json({
        message: "Failed to load online dashboard statistics",

        error: failedResult.error.message,
      });
    }

    const stats: OnlineStatsResponse = {
      total: totalResult.count ?? 0,

      highPriority: highPriorityResult.count ?? 0,

      withEmail: withEmailResult.count ?? 0,

      manualReview: manualReviewResult.count ?? 0,

      interested: interestedResult.count ?? 0,

      closed: closedResult.count ?? 0,
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error("GET /online/stats error:", error);

    return res.status(500).json({
      message: "Unexpected error while loading online statistics",
    });
  }
});

export default router;
