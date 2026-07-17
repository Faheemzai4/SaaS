import type { WebsiteData } from "../types/website";

export function createAnalyzePrompt(data: WebsiteData) {
  return `
You are an expert website consultant and web design sales specialist.

Analyze the provided website data and return ONLY valid JSON.

==========================
WEBSITE DATA
==========================

Title:
${data.title}

URL:
${data.url}

Description:
${data.description}

H1 Count: ${data.h1.length}
H1 Headings:
${data.h1.length ? data.h1.join(", ") : "None"}

Email Count: ${data.emails.length}
Emails:
${data.emails.length ? data.emails.join(", ") : "None"}

Phone Count: ${data.phones.length}
Phone Numbers:
${data.phones.length ? data.phones.join(", ") : "None"}

Image Count: ${data.images}
Button Count: ${data.buttons}
Form Count: ${data.forms}

Facebook:
${data.socialLinks.facebook.length ? data.socialLinks.facebook.join(", ") : "None"}

Instagram:
${data.socialLinks.instagram.length ? data.socialLinks.instagram.join(", ") : "None"}

LinkedIn:
${data.socialLinks.linkedin.length ? data.socialLinks.linkedin.join(", ") : "None"}

X / Twitter:
${data.socialLinks.x.length ? data.socialLinks.x.join(", ") : "None"}

==========================
STRICT RULES
==========================

- Only analyze the data provided.
- Do NOT invent missing information.
- If URL starts with "https://", do NOT say HTTPS is missing.
- If Phone Count >= 1, do NOT say phone number is missing.
- If Email Count >= 1, do NOT say email is missing.
- If H1 Count >= 1, do NOT say H1 is missing.
- If Image Count >= 5, do NOT say there are very few images.
- If Button Count >= 3, do NOT say call-to-action is weak because of button count.
- If Form Count = 0, mention that a contact form is missing.
- Mention only genuine issues supported by the data.

==========================
SCORING GUIDE
==========================

Start from 100.

Deduct:
- 20 points if Form Count = 0
- 10 points if Email Count = 0
- 10 points if Phone Count = 0
- 10 points if Button Count < 3
- 10 points if Image Count < 5
- 15 points if H1 Count = 0

Priority:
- High = score below 60
- Medium = score 60 to 79
- Low = score 80 or above

==========================
RETURN ONLY JSON
==========================

{
  "score": number,
  "priority": "High" | "Medium" | "Low",
  "issues": [
    "issue 1",
    "issue 2"
  ]
}

Do not include markdown.
Do not include explanations.
Do not wrap JSON in backticks.
Return ONLY the JSON object.
`;
}