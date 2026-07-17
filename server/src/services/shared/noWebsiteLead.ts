import { supabase } from "../../config/supabase";
import { analyzeWithGroq } from "./groq";
import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";
import { getUserProfile } from "../profile/profileService";
import { createProfilePromptContext } from "../profile/profilePromptContext";

type NoWebsiteInput = {
  userId: string;
  businessName: string;
  businessType: string;
  city: string;
  state?: string;
  countryCode: CountryCode;
  phone?: string;
  address?: string;
};

type GeneratedEmail = {
  subject: string;
  body: string;
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizePhone(
  rawPhone: string | undefined,
  countryCode: CountryCode,
): string | null {
  if (!rawPhone) {
    return null;
  }

  try {
    const parsed = parsePhoneNumberFromString(rawPhone, countryCode);

    if (!parsed || !parsed.isValid()) {
      return null;
    }

    return parsed.formatInternational();
  } catch {
    return null;
  }
}

export async function createNoWebsiteLead(input: NoWebsiteInput) {
  const normalizedPhone = normalizePhone(input.phone, input.countryCode);
  const profile = await getUserProfile(input.userId);
  const profileContext = createProfilePromptContext(profile);

  let email: GeneratedEmail = {
    subject: `A possible opportunity for ${input.businessName}`,
    body:
      `Hi ${input.businessName},\n\n` +
      `I came across your business and noticed a possible opportunity that may be relevant to the services I provide.\n\n` +
      `Would you be open to a brief conversation?`,
  };

  try {
    const prompt = `
You are writing an optional reference email for a service provider.

The lead does not appear to have a website listed.

SERVICE PROVIDER

${profileContext}

LEAD

Business name:
${input.businessName}

Business type:
${input.businessType}

Location:
${input.city}${input.state ? `, ${input.state}` : ""}

Country code:
${input.countryCode}

Address:
${input.address || "Unknown"}

Public phone:
${normalizedPhone || "Unknown"}

INSTRUCTIONS

Write an email explaining how the service provider's actual service may help this business.

Important:
- Use only the user-defined service profile above.
- Do not assume any specific profession or service.
- Do not invent additional services or professional titles.
- Mention the absence of a website only when it is genuinely relevant to the user's service.
- Do not invent prices, guarantees, results, credentials, or contact details.
- Do not include placeholders.
- The SaaS does not send this email.
- Return JSON only.

{
  "subject": "...",
  "body": "..."
}
`.trim();

    email = await analyzeWithGroq<GeneratedEmail>(prompt, {
      userId: input.userId,
      source: "local",
      module: "local",
      operation: "no_website_email_reference",
    });
  } catch (error) {
    console.error("No-website email generation failed:", error);
  }

  const fakeUrl = `no-website:${makeSlug(
    [input.businessName, input.city, input.state, input.countryCode]
      .filter(Boolean)
      .join("-"),
  )}`;

  const { data, error } = await supabase
    .from("leads")
    .upsert(
      {
        user_id: input.userId,
        title: input.businessName,
        url: fakeUrl,
        businessType: input.businessType,
        city: input.city,
        state: input.state || null,
        description: input.address || "",
        h1: [],
        score: null,
        priority: "Medium",
        estimatedImpact: "null",
        summary: "No website was found for this business.",
        businessOpportunity:
          "This business may have an opportunity that is relevant to the service provider's offering.",
        issues: ["No website found."],
        emails: [],
        phones: normalizedPhone ? [normalizedPhone] : [],
        socialLinks: {
          facebook: [],
          instagram: [],
          linkedin: [],
          x: [],
        },
        status: "Not Contacted",
        emailSubject: email.subject,
        emailBody: email.body,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: "user_id,url" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
