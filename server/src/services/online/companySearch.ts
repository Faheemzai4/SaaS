import type {
  OnlineCompanySearchResult,
  OnlineDiscoverInput,
} from "../../types/onlineCompany";
import { generateMockOnlineCompanies, sleep } from "../shared/mockGenerator";

export async function searchOnlineCompanies(
  input: OnlineDiscoverInput,
  userId?: string,
): Promise<OnlineCompanySearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY || "MOCK_BRAVE_SEARCH_API_KEY";
  const keywords = input.keywords.trim();
  const limit = input.limit === undefined ? 5 : Number(input.limit);

  console.log(`\n[API SIMULATOR] Connecting to Brave Web Search API...`);
  console.log(`[API SIMULATOR] API Key: ${apiKey.substring(0, 8)}********************`);
  console.log(`[API SIMULATOR] Endpoint: GET https://api.search.brave.com/res/v1/web/search`);
  console.log(`[API SIMULATOR] Query: "${keywords}" (Model: ${input.businessModel || "any"}, Platform: ${input.platform || "any"})`);
  console.log(`[API SIMULATOR] Requesting page ${input.page || 1} with limit ${limit}`);

  // Simulate network request latency
  await sleep(1200);

  const companies = generateMockOnlineCompanies(
    keywords,
    input.businessModel,
    input.industry,
    input.country,
    input.platform,
    limit
  );

  console.log(`[API SIMULATOR] Brave Search response status: 200 OK`);
  console.log(`[API SIMULATOR] Successfully found ${companies.length} candidate companies.`);
  console.log(`[API SIMULATOR] Simulating AI Classification using Groq model ${process.env.GROQ_MODEL || "llama-3.1-8b-instant"}...`);
  
  await sleep(600);
  
  console.log(`[API SIMULATOR] Classification complete. All candidates classified successfully.\n`);

  return companies;
}
