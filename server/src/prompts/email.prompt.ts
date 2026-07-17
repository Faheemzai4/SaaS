import type { AnalysisResult } from "../types/analysis";
import type { WebsiteData } from "../types/website";

export interface EmailProfileContext {
  businessName: string;
  serviceType: string;
  serviceDescription: string;
  targetCustomer: string;
  preferredTone: string;
}

export function createEmailPrompt(
  website: WebsiteData,
  analysis: AnalysisResult,
  profile?: EmailProfileContext | null,
): string {
  const providerBusinessName =
    profile?.businessName?.trim() || "the service provider";

  const serviceType =
    profile?.serviceType?.trim() || "Not provided";

  const serviceDescription =
    profile?.serviceDescription?.trim() || "Not provided";

  const targetCustomer =
    profile?.targetCustomer?.trim() || "Not provided";

  const preferredTone =
    profile?.preferredTone?.trim() || "professional";

  return `
You are writing an optional reference email for a SaaS user.

The application does not send this email.
The user may review, edit, copy, or export it manually.

SERVICE PROVIDER PROFILE

Business name:
${providerBusinessName}

User-defined service type:
${serviceType}

User-defined service description:
${serviceDescription}

Target customers:
${targetCustomer}

Preferred tone:
${preferredTone}

LEAD INFORMATION

Business name:
${website.title || "Unknown business"}

Website:
${website.url || "Not available"}

Description:
${website.description || "Not available"}

Public emails:
${website.emails?.join(", ") || "None found"}

Public phones:
${website.phones?.join(", ") || "None found"}

WEBSITE ANALYSIS

Score:
${analysis.score}

Priority:
${analysis.priority}

Summary:
${analysis.summary}

Business opportunity:
${analysis.businessOpportunity}

Estimated impact:
${analysis.estimatedImpact}

Issues:
${analysis.issues?.join("\n- ") || "No specific issues found"}

INSTRUCTIONS

Write a concise and personalized reference email explaining how the user's actual service may help this lead.

Rules:
- Use only the user-defined service type and service description.
- Never replace the service type with another profession.
- Never invent a job title such as web developer, designer, marketer, consultant, or agency.
- When the service type is broad or unclear, describe the offered service without assigning a professional title.
- Do not assume that the user provides web development, graphic design, software, SEO, marketing, or any other service unless the profile states it.
- Do not describe an Online company as a local business unless the lead information explicitly says it is local.
- Do not invent prices, guarantees, case studies, results, credentials, or contact information.
- Do not mention AI, scraping, automation, or lead-finding software.
- Mention no more than two relevant observations.
- Use a ${preferredTone} tone.
- Do not use placeholders such as "[Your Name]".
- Sign using "${providerBusinessName}".
- Return one valid JSON object only.

{
  "subject": "...",
  "body": "..."
}
`.trim();
}