import type { CountryCode } from "libphonenumber-js/max";
import type { WebsiteData } from "../../types/website";
import { generateMockWebsiteData, sleep } from "./mockGenerator";

export async function fetchWebsiteData(
  url: string,
  defaultCountry?: CountryCode,
  context?: any,
): Promise<WebsiteData> {
  console.log(`\n[SCRAPER SIMULATOR] Fetching website HTML: GET ${url}`);
  console.log(`[SCRAPER SIMULATOR] Simulating browser page load and DOM parsing...`);
  
  await sleep(1000);

  // Extract a clean domain name for business name mock
  let cleanName = "Company";
  try {
    const domain = new URL(url).hostname.replace(/^www\./, "");
    cleanName = domain.split(".")[0]
      .split(/[-_]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  } catch {
    // Keep default
  }

  const mockData = generateMockWebsiteData(
    url,
    cleanName,
    "Business",
    "Local",
    (defaultCountry as string) || "US"
  );

  console.log(`[SCRAPER SIMULATOR] Scraped page title: "${mockData.title}"`);
  console.log(`[SCRAPER SIMULATOR] Found ${mockData.emails.length} email addresses and ${mockData.phones.length} phone numbers.\n`);

  return mockData;
}
