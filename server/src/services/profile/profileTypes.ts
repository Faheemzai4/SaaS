export const PROFILE_TONES = [
  "professional",
  "friendly",
  "direct",
  "consultative",
] as const;

export type ProfileTone =
  (typeof PROFILE_TONES)[number];

export interface UserProfileRecord {
  user_id: string;

  business_name: string | null;
  service_type: string | null;
  service_description: string | null;
  target_customer: string | null;

  preferred_tone: ProfileTone;

  created_at: string;
  updated_at: string;
}

export interface UpdateUserProfileInput {
  businessName?: string;
  serviceType?: string;
  serviceDescription?: string;
  targetCustomer?: string;
  preferredTone?: ProfileTone;
}

export interface UserProfileResponse {
  businessName: string;
  serviceType: string;
  serviceDescription: string;
  targetCustomer: string;
  preferredTone: ProfileTone;
}

export function isProfileTone(
  value: unknown,
): value is ProfileTone {
  return (
    typeof value === "string" &&
    PROFILE_TONES.includes(
      value as ProfileTone,
    )
  );
}