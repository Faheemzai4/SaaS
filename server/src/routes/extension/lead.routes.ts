import { Router } from "express";

import { supabase } from "../../config/supabase";
import { createEmailPrompt } from "../../prompts/email.prompt";
import { analyzeWebsite } from "../../services/shared/analyzer";
import type { WebsiteData } from "../../types/website";
import { normalizeWebsiteUrl } from "../../utils/normalizeWebsiteUrl";
import { safeTrackUsage } from "../../services/usage/usageTracker";
import { analyzeWithGroq } from "../../services/shared/groq";
import { getUserProfile } from "../../services/profile/profileService";
import type { UserProfileResponse } from "../../services/profile/profileTypes";

const router = Router();

type ExtensionModule = "local" | "online";

type OnlineBusinessModel =
  | "ecommerce"
  | "saas"
  | "agency"
  | "marketplace"
  | "other";

interface GeneratedEmail {
  subject: string;
  body: string;
}

interface ExtensionLeadRequest {
  module: ExtensionModule;
  website: WebsiteData;
  forceRefresh?: boolean;

  local?: {
    businessName?: string;
    businessType?: string;
    city?: string;
    state?: string;
    countryCode?: string;
    phone?: string;
    address?: string;
  };

  online?: {
    companyName?: string;
    businessModel?: OnlineBusinessModel;
    industry?: string;
    country?: string;
  };
}

function getPrimaryDomain(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function uniqueStrings(values: string[] | undefined): string[] {
  return [
    ...new Set((values || []).map((value) => value.trim()).filter(Boolean)),
  ];
}

function normalizeWebsiteData(website: WebsiteData): WebsiteData {
  return {
    title: website.title?.trim() || "",
    url: normalizeWebsiteUrl(website.url),
    description: website.description?.trim() || "",

    h1: uniqueStrings(website.h1),
    emails: uniqueStrings(website.emails).map((email) => email.toLowerCase()),
    phones: uniqueStrings(website.phones),

    images: Number(website.images) || 0,
    buttons: Number(website.buttons) || 0,
    forms: Number(website.forms) || 0,

    socialLinks: {
      facebook: uniqueStrings(website.socialLinks?.facebook),
      instagram: uniqueStrings(website.socialLinks?.instagram),
      linkedin: uniqueStrings(website.socialLinks?.linkedin),
      x: uniqueStrings(website.socialLinks?.x),
      whatsapp: uniqueStrings(website.socialLinks?.whatsapp),
    },
  };
}

async function generateEmail(
  website: WebsiteData,
  analysis: ReturnType<typeof analyzeWebsite>,
  userId: string,
  module: ExtensionModule,
  profile: UserProfileResponse | null,
): Promise<GeneratedEmail> {
  const fallback: GeneratedEmail = {
    subject: `A possible opportunity for ${website.title || "your business"}`,
    body:
      `Hi,\n\n` +
      `I came across your business and noticed a possible opportunity that may be relevant to the services I provide.`,
  };

  try {
    const prompt = createEmailPrompt(website, analysis, profile);

    return await analyzeWithGroq<GeneratedEmail>(prompt, {
      userId,
      source: "extension",
      module,
      operation: "extension_email_reference",
    });
  } catch (error) {
    console.error("Extension email generation failed:", error);

    return fallback;
  }
}

router.post("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      module,
      website: rawWebsite,
      local,
      online,
    } = req.body as ExtensionLeadRequest;

    if (module !== "local" && module !== "online") {
      return res.status(400).json({
        message: "module must be local or online.",
      });
    }

    if (!rawWebsite || typeof rawWebsite.url !== "string") {
      return res.status(400).json({
        message: "website.url is required.",
      });
    }

    let website: WebsiteData;

    try {
      website = normalizeWebsiteData(rawWebsite);
    } catch {
      return res.status(400).json({
        message: "website.url must be a valid URL.",
      });
    }
    let domain = "";

    try {
      domain = new URL(website.url).hostname
        .toLowerCase()
        .replace(/^www\./, "");
    } catch {
      domain = "";
    }

    await safeTrackUsage({
      userId,
      eventType: "extension_analysis",
      quantity: 1,
      creditsUsed: 1,
      source: "extension",
      metadata: {
        module,
        domain,
      },
    });

    await safeTrackUsage({
      userId,
      eventType: "website_analysis",
      quantity: 1,
      creditsUsed: 1,
      source: "extension",
      metadata: {
        module,
        domain,
      },
    });
    const profile = await getUserProfile(userId);
    const analysis = analyzeWebsite(website);
    const email = await generateEmail(
      website,
      analysis,
      userId,
      module,
      profile,
    );
    const now = new Date().toISOString();

    if (module === "local") {
      const businessName =
        local?.businessName?.trim() || website.title || website.url;

      const mergedPhones = uniqueStrings([
        ...(website.phones || []),
        ...(local?.phone ? [local.phone] : []),
      ]);

      const { data, error } = await supabase
        .from("leads")
        .upsert(
          {
            user_id: userId,

            title: businessName,
            url: website.url,

            businessType: local?.businessType?.trim() || "Extension Lead",

            city: local?.city?.trim() || null,
            state: local?.state?.trim() || null,

            description: website.description || local?.address?.trim() || "",

            h1: website.h1,

            score: analysis.score,
            priority: analysis.priority,
            summary: analysis.summary,
            businessOpportunity: analysis.businessOpportunity,
            estimatedImpact: analysis.estimatedImpact,
            issues: analysis.issues,

            emails: website.emails,
            phones: mergedPhones,
            socialLinks: website.socialLinks,

            status: "Not Contacted",

            emailSubject: email.subject,
            emailBody: email.body,

            analyzedAt: now,
            updatedAt: now,
          },
          {
            onConflict: "user_id,url",
          },
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json({
        module: "local",
        message: "Website saved to Local leads.",
        lead: data,
      });
    }

    const primaryDomain = getPrimaryDomain(website.url);

    if (!primaryDomain) {
      return res.status(400).json({
        message: "Could not determine website domain.",
      });
    }

    const companyName =
      online?.companyName?.trim() || website.title || primaryDomain;

    const businessModel = online?.businessModel || "other";

    const { data, error } = await supabase
      .from("online_leads")
      .upsert(
        {
          user_id: userId,

          name: companyName,

          website_url: website.url,
          primary_domain: primaryDomain,
          source_url: website.url,

          business_model: businessModel,

          industry: online?.industry?.trim() || null,

          country: online?.country?.trim() || null,

          page_title: website.title || companyName,

          description: website.description || null,

          score: analysis.score,
          priority: analysis.priority,
          summary: analysis.summary,

          business_opportunity: analysis.businessOpportunity,

          estimated_impact: analysis.estimatedImpact,

          issues: analysis.issues,
          emails: website.emails,
          phones: website.phones,
          social_links: website.socialLinks,

          email_subject: email.subject,
          email_body: email.body,

          status: "Not Contacted",
          analysis_status: "Completed",
          analysis_error: null,

          updated_at: now,
        },
        {
          onConflict: "user_id,primary_domain",
        },
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      module: "online",
      message: "Website saved to Online leads.",
      lead: data,
    });
  } catch (error) {
    console.error("Extension lead sync failed:", error);

    return res.status(500).json({
      message: "Failed to analyze and save extension lead.",
      error:
        error instanceof Error
          ? error.message
          : "Unknown extension sync error.",
    });
  }
});

export default router;
