import type { WebsiteData } from "../../types/website";
import type { AnalysisResult } from "../../types/analysis";

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

  let summary = "";
let businessOpportunity = "";

const estimatedImpact: "High" | "Medium" | "Low" = priority;

if (issues.length === 0) {
  summary =
    "The website appears well structured, with no major issues detected during the automated analysis.";

  businessOpportunity =
    "The website may still have opportunities for further improvement depending on the service provider's offering.";
} else if (score >= 80) {
  summary =
    "The website has a solid foundation, with a few areas that may affect usability, trust, or visitor engagement.";

  businessOpportunity =
    "The identified observations may provide a relevant opportunity depending on the service provider's offering.";
} else if (score >= 60) {
  summary =
    "The website has several noticeable issues that may affect usability, credibility, or visitor engagement.";

  businessOpportunity =
    "Addressing the identified issues may create a meaningful improvement opportunity for this business.";
} else {
  summary =
    "The website has multiple important issues that may negatively affect usability, credibility, or visitor engagement.";

  businessOpportunity =
    "The identified issues suggest a significant improvement opportunity, depending on the service being offered.";
}

  return {
    score,
    priority,
    issues,
    summary,
    businessOpportunity,
    estimatedImpact,
  };
}