import type { WebsiteData } from "../types/website";
import type { AnalysisResult } from "../types/analysis";

export function analyzeWebsite(data: WebsiteData): AnalysisResult {
  let score = 100;

  const issues: string[] = [];

  if (data.forms === 0) {
    score -= 20;
    issues.push("No contact form found.");
  }

  if (data.emails.length === 0) {
    score -= 10;
    issues.push("No email address found.");
  }

  if (data.phones.length === 0) {
    score -= 10;
    issues.push("No phone number found.");
  }

  if (data.buttons < 3) {
    score -= 10;
    issues.push("Very few call-to-action buttons.");
  }

  if (data.images < 5) {
    score -= 10;
    issues.push("Very few images on the website.");
  }

  if (data.h1.length === 0) {
    score -= 15;
    issues.push("No H1 heading found.");
  }

  score = Math.max(score, 0);

  let priority: "High" | "Medium" | "Low";

  if (score < 60) {
    priority = "High";
  } else if (score < 80) {
    priority = "Medium";
  } else {
    priority = "Low";
  }

  return {
    score,
    priority,
    issues,
  };
}