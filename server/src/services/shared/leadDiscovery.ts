import { supabase } from "../../config/supabase";
import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";
import { normalizeWebsiteUrl } from "../../utils/normalizeWebsiteUrl";
import {
  generateMockWebsiteData,
  generateMockAnalysis,
  generateMockEmail,
  sleep,
} from "./mockGenerator";

type ProcessWebsiteMeta = {
  businessName?: string;
  businessType?: string;
  city?: string;
  state?: string;
  countryCode?: CountryCode;
  phone?: string;
  address?: string;
  source?: "local" | "retry";
};

function normalizePhone(
  rawPhone: string,
  countryCode?: CountryCode,
): string | null {
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

export async function processWebsite(
  url: string,
  userId: string,
  meta?: ProcessWebsiteMeta,
) {
  const normalizedInputUrl = normalizeWebsiteUrl(url);
  const businessName = meta?.businessName || normalizedInputUrl;
  const businessType = meta?.businessType || "Business";
  const city = meta?.city || "Local";
  const countryCode = meta?.countryCode || "US";

  console.log(`\n[SCRAPER SIMULATOR] Initiating web scraper for URL: ${normalizedInputUrl}...`);
  console.log(`[SCRAPER SIMULATOR] Crawling homepage and looking for Contact pages...`);
  
  // Simulate scraping delay
  await sleep(1000);
  
  console.log(`[SCRAPER SIMULATOR] Extracting contact emails, phone numbers, and social links...`);
  const mockWebData = generateMockWebsiteData(
    normalizedInputUrl,
    businessName,
    businessType,
    city,
    countryCode
  );

  // Merge in any metadata phones
  if (meta?.phone) {
    const normalizedMetaPhone = normalizePhone(meta.phone, meta.countryCode);
    if (normalizedMetaPhone && !mockWebData.phones.includes(normalizedMetaPhone)) {
      mockWebData.phones.push(normalizedMetaPhone);
    }
  }

  console.log(`[ANALYZER SIMULATOR] Performing SEO and page load audit...`);
  await sleep(500);

  const mockAnalysis = generateMockAnalysis(
    businessName,
    businessType,
    city,
    "local"
  );

  console.log(`[AI SIMULATOR] Connecting to Groq Cloud API...`);
  console.log(`[AI SIMULATOR] AI Model: ${process.env.GROQ_MODEL || "llama-3.1-8b-instant"}`);
  console.log(`[AI SIMULATOR] System Prompt: email.prompt`);
  console.log(`[AI SIMULATOR] Generating personalized email pitch for ${businessName}...`);
  
  await sleep(1000);

  const mockEmail = generateMockEmail(
    businessName,
    businessType,
    city,
    mockAnalysis.businessOpportunity
  );

  console.log(`[AI SIMULATOR] Email pitch generated successfully.`);
  console.log(`[DATABASE] Saving results to Supabase 'leads' table...`);

  const { data, error } = await supabase
    .from("leads")
    .upsert(
      {
        user_id: userId,
        title: businessName,
        url: normalizedInputUrl,
        businessType: businessType,
        city: city,
        state: meta?.state || "",
        description: mockWebData.description || meta?.address || "",
        h1: mockWebData.h1,
        score: mockAnalysis.score,
        priority: mockAnalysis.priority,
        summary: mockAnalysis.summary,
        businessOpportunity: mockAnalysis.businessOpportunity,
        estimatedImpact: mockAnalysis.estimatedImpact,
        issues: mockAnalysis.issues,
        emails: mockWebData.emails,
        phones: mockWebData.phones,
        socialLinks: mockWebData.socialLinks,
        status: "Not Contacted",
        emailSubject: mockEmail.subject,
        emailBody: mockEmail.body,
        analyzedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { onConflict: "user_id,url" },
    )
    .select()
    .single();

  if (error) {
    console.error(`[DATABASE ERROR] Failed to save lead to Supabase:`, error.message);
    throw error;
  }

  console.log(`[DATABASE] Lead saved successfully. ID: ${data.id}\n`);
  return data;
}
