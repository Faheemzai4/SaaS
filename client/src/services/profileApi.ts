import { apiClient } from "./apiClient";

import type {
  ProfileResponse,
  SaveProfileResponse,
  UserProfile,
} from "../types/profile";

export async function getProfile(): Promise<UserProfile> {
  const response =
    await apiClient.get<ProfileResponse>(
      "/profile",
    );

  return response.data.profile;
}

export async function saveProfile(
  profile: UserProfile,
): Promise<SaveProfileResponse> {
  const response =
    await apiClient.put<SaveProfileResponse>(
      "/profile",
      profile,
    );

  return response.data;
}