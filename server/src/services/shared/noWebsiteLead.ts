import { supabase } from "../../config/supabase";
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

  const location = [input.city, input.state].filter(Boolean).join(", ");

  const emailSubject = `A possible opportunity for ${input.businessName}`;

  const emailBody =
    `Hi ${input.businessName},\n\n` +
    `I came across your business in ${location} and noticed that no website appears to be listed.\n\n` +
    `Based on the service profile below, there may be an opportunity to help improve your online presence or customer experience.\n\n` +
    `${profileContext}\n\n` +
    `Would you be open to a brief conversation?\n\n` +
    `Best regards`;

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
        estimatedImpact: null,
        summary: "No website was found for this business.",
        businessOpportunity:
          "This business may benefit from improving its online presence.",
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
        emailSubject,
        emailBody,
        updatedAt: new Date().toISOString(),
        analyzedAt: new Date().toISOString(),
      },
      {
        onConflict: "user_id,url",
      },
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to save no-website dummy lead:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw error;
  }

  return data;
}