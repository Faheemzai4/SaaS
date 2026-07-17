export const PROFILE_TONES = [
  "professional",
  "friendly",
  "direct",
  "consultative",
] as const;

export type ProfileTone =
  (typeof PROFILE_TONES)[number];

export interface UserProfile {
  businessName: string;
  serviceType: string;
  serviceDescription: string;
  targetCustomer: string;
  preferredTone: ProfileTone;
}

export interface ProfileResponse {
  profile: UserProfile;
}

export interface SaveProfileResponse {
  message: string;
  profile: UserProfile;
}