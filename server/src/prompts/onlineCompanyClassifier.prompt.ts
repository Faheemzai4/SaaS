import type {
  OnlineCompanyCandidate,
  OnlineDiscoverInput,
} from "../types/onlineCompany";

export function createOnlineCompanyClassifierPrompt(
  candidates: OnlineCompanyCandidate[],
  input: OnlineDiscoverInput,
): string {
  return `
You are classifying web-search results for an online-business lead finder.

The user wants internet-first businesses only.

Requested search:
- Keywords: ${input.keywords}
- Business model: ${input.businessModel || "any online business"}
- Industry: ${input.industry || "any"}
- Country: ${input.country || "any"}
- Ecommerce platform: ${input.platform || "any"}

Accept genuine internet-first businesses such as:
- SaaS companies
- ecommerce brands and online stores
- Shopify stores
- WooCommerce stores
- digital agencies
- software companies
- online marketplaces
- online service companies
- digital platforms

Reject:
- blog articles
- news articles
- guides
- comparison pages
- "best tools" or "top companies" articles
- review pages
- directories
- listicles
- social-media pages
- job boards
- marketplaces that only list other businesses
- physical local businesses such as restaurants, dentists, clinics and salons
- government pages
- educational articles
- irrelevant pages

Strict business-model rules:

When the requested business model is "saas":
- Accept only a company that owns and sells its own software product.
- Reject software directories.
- Reject software comparison and review platforms.
- Reject websites that primarily list, rank, review, or compare other software.
- Reject pricing guides and "best software" articles.
- A directory or marketplace must not be classified as SaaS merely because it discusses SaaS products.

Examples:
- Wrike: accept as SaaS.
- ProjectManager: accept as SaaS.
- Crozdesk: reject for a SaaS search because it lists and compares software.
- G2: reject.
- Capterra: reject.
- GetApp: reject.

A result can still be accepted when its original search URL points to a product,
pricing or signup page, but only when the domain clearly belongs to a genuine
online business.


The requested business model is ${
    input.businessModel || "not restricted"
}. Prefer results matching that model.

Return valid JSON only.

Required response format:

{
  "results": [
    {
      "index": 0,
      "isOnlineBusiness": true,
      "businessModel": "saas",
      "confidence": 95,
      "reason": "Official website of a SaaS product."
    }
  ]
}

Rules:
- Return exactly one classification for every supplied candidate.
- Preserve the supplied index.
- confidence must be an integer between 0 and 100.
- businessModel must be ecommerce, saas, agency, marketplace, other, or unknown.
- Do not add markdown.
- Do not add explanation outside the JSON.

Candidates:

${JSON.stringify(candidates, null, 2)}
`.trim();
}