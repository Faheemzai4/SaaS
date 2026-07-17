import { Router } from "express";
import type { WebsiteData } from "../types/website";
import type { AnalysisResult } from "../types/analysis";
import { createEmailPrompt } from "../prompts/email.prompt";
import { analyzeWithGroq } from "../services/shared/groq";

type GeneratedEmail = {
  subject: string;
  body: string;
};

const router = Router();

router.post("/", async (req, res) => {
  try {
    const website = req.body.website as WebsiteData;
    const analysis = req.body.analysis as AnalysisResult;

    if (!website || !analysis) {
      res.status(400).json({
        message: "Website and analysis are required",
      });
      return;
    }

    const prompt = createEmailPrompt(website, analysis);

    const email = await analyzeWithGroq<GeneratedEmail>(prompt);

    res.json(email);
  } catch (error) {
    console.error("Email generation failed:", error);

    res.status(500).json({
      message: "Failed to generate email",
    });
  }
});

export default router;
