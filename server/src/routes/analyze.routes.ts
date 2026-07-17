import { Router } from "express";
import type { WebsiteData } from "../types/website";
import { createAnalyzePrompt } from "../prompts/analyze.prompt";
import {
  analyzeWithGroq,
} from "../services/shared/groq";
import { analyzeWebsite } from "../services/shared/analyzer";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const website = req.body as WebsiteData;

    const prompt = createAnalyzePrompt(website);

    const result = await analyzeWithGroq(prompt);

    res.json(result);
  } catch (error) {
    console.error("AI analysis failed:", error);

    const fallbackResult = analyzeWebsite(req.body as WebsiteData);

    res.json(fallbackResult);
  }
});

export default router;