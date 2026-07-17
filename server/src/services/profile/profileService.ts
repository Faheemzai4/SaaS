import { supabase } from "../../config/supabase";

import type {
  UpdateUserProfileInput,
  UserProfileRecord,
  UserProfileResponse,
} from "./profileTypes";

function normalizeOptionalText(
  value: unknown,
  maxLength: number,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .trim()
    .slice(0, maxLength);

  return normalized || null;
}

function toProfileResponse(
  profile: UserProfileRecord,
): UserProfileResponse {
  return {
    businessName:
      profile.business_name || "",

    serviceType:
      profile.service_type || "",

    serviceDescription:
      profile.service_description || "",

    targetCustomer:
      profile.target_customer || "",

    preferredTone:
      profile.preferred_tone,
  };
}

export async function getUserProfile(
  userId: string,
): Promise<UserProfileResponse | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load user profile: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  return toProfileResponse(
    data as UserProfileRecord,
  );
}

export async function upsertUserProfile(
  userId: string,
  input: UpdateUserProfileInput,
): Promise<UserProfileResponse> {
  const now = new Date().toISOString();

  const payload = {
    user_id: userId,

    business_name:
      normalizeOptionalText(
        input.businessName,
        120,
      ),

    service_type:
      normalizeOptionalText(
        input.serviceType,
        120,
      ),

    service_description:
      normalizeOptionalText(
        input.serviceDescription,
        1000,
      ),

    target_customer:
      normalizeOptionalText(
        input.targetCustomer,
        500,
      ),

    preferred_tone:
      input.preferredTone ||
      "professional",

    updated_at: now,
  };

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(payload, {
      onConflict: "user_id",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Failed to save user profile: ${error.message}`,
    );
  }

  return toProfileResponse(
    data as UserProfileRecord,
  );
}