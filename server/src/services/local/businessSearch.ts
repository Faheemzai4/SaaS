import type { CountryCode } from "libphonenumber-js/max";
import { generateMockLocalBusinesses, sleep } from "../shared/mockGenerator";

export interface BusinessLead {
  name: string;
  website?: string;
  phone?: string;
  address?: string;
}

export interface BusinessSearchInput {
  businessType: string;
  city: string;
  state?: string;
  countryCode: CountryCode;
  limit?: number;
}

export async function searchBusinesses(
  input: BusinessSearchInput,
): Promise<BusinessLead[]> {
  const apiKey = process.env.FOURSQUARE_API_KEY || "MOCK_FOURSQUARE_API_KEY";
  const query = input.businessType.trim();
  const near = [input.city?.trim(), input.state?.trim(), input.countryCode]
    .filter((value): value is string => Boolean(value))
    .join(", ");

  console.log(`\n[API SIMULATOR] Connecting to Foursquare Places Search API...`);
  console.log(`[API SIMULATOR] API Key: ${apiKey.substring(0, 8)}********************`);
  console.log(`[API SIMULATOR] Endpoint: GET https://places-api.foursquare.com/places/search`);
  console.log(`[API SIMULATOR] Query Params: { query: "${query}", near: "${near}", limit: ${input.limit || 5} }`);

  // Simulate network request latency
  await sleep(1000);

  const businesses = generateMockLocalBusinesses(
    input.businessType,
    input.city,
    input.state,
    input.countryCode,
    input.limit || 5
  );

  console.log(`[API SIMULATOR] Foursquare response status: 200 OK`);
  console.log(`[API SIMULATOR] Successfully fetched ${businesses.length} places from Foursquare.\n`);

  return businesses;
}

