import type { CountryCode } from "libphonenumber-js/max";
import type { BusinessLead } from "../local/businessSearch";
import type { OnlineCompanySearchResult } from "../../types/onlineCompany";
import type { WebsiteData } from "../../types/website";
import type { AnalysisResult } from "../../types/analysis";

// Helper to delay execution (simulate network requests)
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper to capitalize words
function capitalize(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Generate a slug from a name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// Custom lists for generating realistic local businesses
const LOCAL_NAME_TEMPLATES = [
  "{city} {type} Pros",
  "{city} Elite {type}",
  "The {type} Hub {city}",
  "Apex {type} Co.",
  "Downtown {type} & Wellness",
  "Metro {type} Services",
  "Summit {type} of {city}",
  "Blue Ribbon {type}",
  "Heritage {type} & Design",
  "Precision {type} Group"
];

const STREET_NAMES = [
  "Main St", "Broadway", "Oak Ave", "Maple Rd", "Pine St",
  "Cedar Ln", "Washington Blvd", "Elm St", "Park Ln", "Sunset Dr"
];

// Generate fake local businesses
export function generateMockLocalBusinesses(
  businessType: string,
  city: string,
  state: string = "",
  countryCode: CountryCode = "US",
  limit: number = 5
): BusinessLead[] {
  const normalizedType = capitalize(businessType);
  const normalizedCity = capitalize(city);
  const results: BusinessLead[] = [];

  for (let i = 0; i < limit; i++) {
    const template = LOCAL_NAME_TEMPLATES[i % LOCAL_NAME_TEMPLATES.length];
    const name = template
      .replace("{city}", normalizedCity)
      .replace("{type}", normalizedType);

    const slug = slugify(name);
    const domain = `${slug}.com`;
    const streetNum = Math.floor(Math.random() * 800) + 100;
    const street = STREET_NAMES[(i + Math.floor(Math.random() * 5)) % STREET_NAMES.length];
    const address = `${streetNum} ${street}, ${normalizedCity}${state ? `, ${state.toUpperCase()}` : ""}, ${countryCode}`;

    // Fake phone number formatting based on country code
    const areaCode = Math.floor(Math.random() * 800) + 200;
    const phonePrefix = Math.floor(Math.random() * 800) + 200;
    const phoneLine = Math.floor(Math.random() * 9000) + 1000;
    const phone = countryCode === "US" 
      ? `+1 (${areaCode}) ${phonePrefix}-${phoneLine}`
      : `+44 20 ${phonePrefix} ${phoneLine}`;

    results.push({
      name,
      website: `http://${domain}`,
      phone,
      address
    });
  }

  return results;
}

// Generate fake online companies
export function generateMockOnlineCompanies(
  keywords: string,
  businessModel: string = "other",
  industry: string = "",
  country: string = "United States",
  platform: string = "any",
  limit: number = 5
): OnlineCompanySearchResult[] {
  const normalizedKeyword = capitalize(keywords);
  const results: OnlineCompanySearchResult[] = [];

  const SaaSNames = ["{keyword}ly", "Core{keyword}", "{keyword}Flow", "Apex{keyword}", "{keyword} Hub", "Smart{keyword}"];
  const EcommerceNames = ["{keyword} Shop", "{keyword} Essentials", "Sleek{keyword}", "The {keyword} Co", "{keyword} Collective", "Pure{keyword}"];
  const AgencyNames = ["{keyword} Studio", "{keyword} Partners", "Bold{keyword}", "Horizon {keyword}", "{keyword} Labs", "Altitude {keyword}"];
  const GeneralNames = ["{keyword} Solutions", "{keyword} Group", "{keyword} Ventures", "{keyword} Direct", "Global {keyword}", "{keyword} Systems"];

  let templates = GeneralNames;
  if (businessModel === "saas") templates = SaaSNames;
  else if (businessModel === "ecommerce") templates = EcommerceNames;
  else if (businessModel === "agency") templates = AgencyNames;

  for (let i = 0; i < limit; i++) {
    const template = templates[i % templates.length];
    const name = template.replace("{keyword}", normalizedKeyword);
    const slug = slugify(name);
    const domain = `${slug}.com`;
    const websiteUrl = `https://www.${domain}`;

    let title = "";
    let description = "";

    if (businessModel === "saas") {
      title = `${name} | The Modern AI-Powered ${normalizedKeyword} Platform`;
      description = `Streamline your business operations with ${name}. The leading cloud solution for automated ${keywords} workflows and real-time team collaboration. Get started for free.`;
    } else if (businessModel === "ecommerce") {
      title = `${name} - Handcrafted ${normalizedKeyword} & Gear`;
      description = `Discover premium quality ${keywords} products at ${name}. Free shipping on orders over $50. Sustainably sourced and built to last. Shop our catalog today!`;
    } else if (businessModel === "agency") {
      title = `${name} | Award-Winning Digital ${normalizedKeyword} Agency`;
      description = `We partner with world-class brands to deliver custom ${keywords} consulting, design, and growth marketing strategies. Grow your revenue with our expert team.`;
    } else {
      title = `${name} | Professional ${normalizedKeyword} & Industry Services`;
      description = `Welcome to ${name}. We provide specialized ${keywords} products and comprehensive solutions tailored to enterprise and retail clients worldwide.`;
    }

    results.push({
      name,
      websiteUrl,
      title,
      description,
      sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(keywords)}`,
      businessModel: businessModel as any
    });
  }

  return results;
}

// Generate fake website crawl details
export function generateMockWebsiteData(
  url: string,
  name: string,
  businessType: string = "Business",
  city: string = "Local",
  countryCode: string = "US"
): WebsiteData {
  const domain = url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
  const slug = slugify(name);

  // Generate mock images and buttons counts
  const images = Math.floor(Math.random() * 8) + 2; // 2 to 9
  const buttons = Math.floor(Math.random() * 5); // 0 to 4
  const forms = Math.random() > 0.3 ? 1 : 0; // 70% chance of form

  const phone = countryCode === "US" ? `+1 (555) 234-${Math.floor(Math.random() * 9000) + 1000}` : `+44 20 7946 ${Math.floor(Math.random() * 900) + 100}`;
  const emails = [`contact@${domain}`, `info@${domain}`];
  const phones = [phone];

  return {
    title: `${name} | Professional ${capitalize(businessType)} in ${capitalize(city)}`,
    url,
    description: `Contact ${name} for premium ${businessType} services in ${capitalize(city)}. Family owned and operated, serving the community with dedication.`,
    h1: [`Welcome to ${name}`, `Expert ${capitalize(businessType)} Services in ${capitalize(city)}`],
    emails,
    phones,
    images,
    buttons,
    forms,
    socialLinks: {
      facebook: [`https://facebook.com/${slug}`],
      instagram: [`https://instagram.com/${slug}`],
      linkedin: [`https://linkedin.com/company/${slug}`],
      x: [`https://x.com/${slug}`],
      whatsapp: [`https://wa.me/${phone.replace(/[^0-9]/g, "")}`]
    }
  };
}

// Generate mock SEO / lead analysis results
export function generateMockAnalysis(
  name: string,
  businessType: string,
  city: string,
  model: string = "local"
): AnalysisResult {
  const scores = [45, 58, 62, 75, 82];
  const score = scores[Math.floor(Math.random() * scores.length)];

  let priority: "High" | "Medium" | "Low";
  if (score < 60) priority = "High";
  else if (score < 80) priority = "Medium";
  else priority = "Low";

  const allIssues = [
    "No mobile-responsive layout detected.",
    "Missing Google Maps schema markup.",
    "Images are missing descriptive alt tags, hurting search engine discoverability.",
    "Extremely slow mobile page load time (8.4 seconds first contentful paint).",
    "Missing Call to Action (CTA) buttons on the homepage hero section.",
    "SSL certificate is missing or misconfigured on the ordering portal.",
    "No visible online booking/reservation or contact form widget.",
    "Duplicate H1 tags detected on the primary services index page."
  ];

  // Pick 2-4 random issues
  const numIssues = Math.floor(Math.random() * 3) + 2;
  const issues = allIssues
    .sort(() => 0.5 - Math.random())
    .slice(0, numIssues);

  let summary = "";
  let businessOpportunity = "";
  let estimatedImpact: "High" | "Medium" | "Low" = priority;

  const normalizedType = businessType.toLowerCase();

  if (model === "saas") {
    summary = `The landing page for ${name} has a professional design but suffers from slow response times and has missing structural schema tags. There are no conversion-optimized lead capture forms above the fold.`;
    businessOpportunity = `Implement a fast static-generation landing page, integrate a direct interactive product demo widget, and configure clear pricing calculator sliders to boost signup conversions by 30%.`;
  } else if (model === "ecommerce") {
    summary = `${name}'s online store has a decent catalog layout, but lacks clear checkout buttons and has unoptimized product images which significantly slow down mobile catalog browsing.`;
    businessOpportunity = `Enable modern ecommerce micro-interactions, optimize image assets for next-gen formats, and add checkout urgency cues to recover cart abandonment losses.`;
  } else {
    // Local / Default
    summary = `${name}'s local page has high customer reviews on Google but their actual website is outdated, lacks structured schema data, and does not allow users to book ${normalizedType} appointments online.`;
    businessOpportunity = `Build a custom modern mobile-optimized site, implement a direct scheduling widget (e.g. Calendly or custom booking flow), and optimize Google Business Profile syncing.`;
  }

  return {
    score,
    priority,
    issues,
    summary,
    businessOpportunity,
    estimatedImpact
  };
}

// Generate highly personalized sales pitch emails
export function generateMockEmail(
  name: string,
  businessType: string,
  city: string,
  opportunity: string
): { subject: string; body: string } {
  const templates = [
    {
      subject: `Proposal: Grow ${name} in ${capitalize(city)}`,
      body: `Hi Team,\n\nI was looking at the website for ${name} in ${capitalize(city)} and was very impressed by your local reputation. However, I noticed a key opportunity: ${opportunity.toLowerCase().replace(/\.$/, "")}.\n\nI build fast, high-converting platforms for local ${businessType.toLowerCase()} companies to resolve this exact problem, usually boosting conversions by 20-30% within the first month.\n\nAre you available for a quick 10-minute call this Thursday at 2:00 PM to talk about how we can set this up for ${name}?\n\nBest regards,\n[Your Name]`
    },
    {
      subject: `Quick feedback regarding the website for ${name}`,
      body: `Hello,\n\nI hope you're having a great week. I recently browsed ${name} while looking for services in ${capitalize(city)} and noticed a few technical issues that might be causing you to lose potential customers (specifically: ${opportunity.toLowerCase().replace(/\.$/, "")}).\n\nI specialize in optimizing local web pages for ${businessType.toLowerCase()} businesses to capture lost leads.\n\nWould you be open to a brief chat next Tuesday to review some free improvements you can make?\n\nSincerely,\n[Your Name]`
    }
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}
