import { supabase } from "../../config/supabase";
import type {
  OnlineCompanySearchResult,
  OnlineDiscoverInput,
} from "../../types/onlineCompany";
import {
  generateMockWebsiteData,
  generateMockAnalysis,
  generateMockEmail,
  sleep,
} from "../shared/mockGenerator";
import {
  resolveExistingOnlineLead,
} from "./existingLeadResolver";

interface ProcessOnlineCompanyInput {
  company: OnlineCompanySearchResult;
  searchInput: OnlineDiscoverInput;
  userId: string;
}

export async function processOnlineCompany({
  company,
  searchInput,
  userId,
}: ProcessOnlineCompanyInput) {
  const existingResolution = await resolveExistingOnlineLead({
    websiteUrl: company.websiteUrl,
    userId,
    forceRefresh: searchInput.forceRefresh,
  });

  const primaryDomain = existingResolution.primaryDomain;

  if (existingResolution.shouldReuse && existingResolution.existingLead) {
    console.log(`[API SIMULATOR] Reusing fresh completed Online lead: ${primaryDomain}`);
    return {
      success: true,
      reused: true,
      lead: existingResolution.existingLead,
    };
  }

  console.log(`\n[SCRAPER SIMULATOR] Initiating web scraper for Online company: ${company.name} (${company.websiteUrl})...`);
  console.log(`[SCRAPER SIMULATOR] Crawling homepage and looking for Contact and About pages...`);
  
  // Simulate scraping delay
  await sleep(1000);

  const mockWebData = generateMockWebsiteData(
    company.websiteUrl,
    company.name,
    searchInput.industry || "Online Business",
    searchInput.country || "Global",
    searchInput.countryCode || "US"
  );

  console.log(`[ANALYZER SIMULATOR] Performing SEO, conversion rate, and performance audits...`);
  await sleep(500);

  const mockAnalysis = generateMockAnalysis(
    company.name,
    searchInput.businessModel || "other",
    searchInput.country || "Global",
    "online"
  );

  console.log(`[AI SIMULATOR] Connecting to Groq Cloud API...`);
  console.log(`[AI SIMULATOR] AI Model: ${process.env.GROQ_MODEL || "llama-3.1-8b-instant"}`);
  console.log(`[AI SIMULATOR] Generating personalized digital agency pitch email...`);

  await sleep(1000);

  const mockEmail = generateMockEmail(
    company.name,
    searchInput.businessModel || "other",
    searchInput.country || "Global",
    mockAnalysis.businessOpportunity
  );

  console.log(`[AI SIMULATOR] Email copy generated successfully.`);
  console.log(`[DATABASE] Saving lead to Supabase 'online_leads' table...`);

  const { data, error } = await supabase
    .from("online_leads")
    .upsert(
      {
        user_id: userId,
        name: company.name,
        website_url: company.websiteUrl,
        primary_domain: primaryDomain,
        source_url: company.sourceUrl,
        business_model: company.businessModel || searchInput.businessModel || "other",
        industry: searchInput.industry || null,
        country: searchInput.country || null,
        page_title: mockWebData.title || company.title || company.name,
        description: mockWebData.description || company.description || null,
        score: mockAnalysis.score,
        priority: mockAnalysis.priority,
        summary: mockAnalysis.summary,
        business_opportunity: mockAnalysis.businessOpportunity,
        estimated_impact: mockAnalysis.estimatedImpact,
        issues: mockAnalysis.issues || [],
        emails: mockWebData.emails || [],
        phones: mockWebData.phones || [],
        social_links: mockWebData.socialLinks,
        email_subject: mockEmail.subject,
        email_body: mockEmail.body,
        status: "Not Contacted",
        analysis_status: "Completed",
        analysis_error: null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,primary_domain",
      },
    )
    .select()
    .single();

  if (error) {
    console.error(`[DATABASE ERROR] Failed to save online lead:`, error.message);
    throw error;
  }

  console.log(`[DATABASE] Online lead saved successfully. ID: ${data.id}\n`);

  return {
    success: true,
    reused: false,
    lead: data,
  };
}

export async function processOnlineCompanies(
  companies: OnlineCompanySearchResult[],
  searchInput: OnlineDiscoverInput,
  userId: string,
) {
  const results = [];

  for (const company of companies) {
    try {
      const result = await processOnlineCompany({
        company,
        searchInput,
        userId,
      });

      results.push({
        companyName: result.lead?.name || company.name,
        website: company.websiteUrl,
        ...result,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Online company processing failed.";

      console.error(`Could not process ${company.name}:`, error);

      results.push({
        companyName: company.name,
        website: company.websiteUrl,
        success: false,
        reused: false,
        lead: null,
        error: message,
      });
    }
  }

  return results;
}
