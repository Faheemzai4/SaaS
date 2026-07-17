import { Router } from "express";
import { fetchWebsiteData } from "../services/shared/websiteFetcher";
import { analyzeWebsite } from "../services/shared/analyzer";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ message: "URL is required" });
      return;
    }

    const website = await fetchWebsiteData(url);

    const analysis = analyzeWebsite(website);

    res.json({
      website,
      analysis,
    });
  } catch (error) {
    console.error("Analyze URL failed:", error);

    res.status(500).json({
      message: "Failed to analyze URL",
    });
  }
});

export default router;
