import type { UserProfileResponse } from "./profileTypes";

export function createProfilePromptContext(
  profile: UserProfileResponse | null,
): string {
  if (!profile) {
    return `
No service profile was provided.

Do not invent a profession, service, business name, offer, or target customer.
Write neutral content and state only that the sender provides professional services.
`.trim();
  }

  return `
USER-DEFINED SERVICE PROFILE

Business name:
${profile.businessName || "Not provided"}

Service type:
${profile.serviceType || "Not provided"}

Service description:
${profile.serviceDescription || "Not provided"}

Target customer:
${profile.targetCustomer || "Not provided"}

Preferred tone:
${profile.preferredTone || "professional"}

Rules:
- Use these fields exactly as user-provided context.
- Do not replace the service type with another profession.
- Do not invent additional services.
- If fields conflict, describe the service without assigning a job title.
`.trim();
}