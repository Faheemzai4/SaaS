import { Router } from "express";

import {
  getUserProfile,
  upsertUserProfile,
} from "../services/profile/profileService";

import {
  isProfileTone,
  type UpdateUserProfileInput,
} from "../services/profile/profileTypes";

const router = Router();

function validateTextField(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(
      `${fieldName} must be a string.`,
    );
  }

  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw new Error(
      `${fieldName} must be ${maxLength} characters or fewer.`,
    );
  }

  return normalized;
}

/**
 * GET /profile
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const profile =
      await getUserProfile(userId);

    return res.status(200).json({
      profile: profile || {
        businessName: "",
        serviceType: "",
        serviceDescription: "",
        targetCustomer: "",
        preferredTone:
          "professional",
      },
    });
  } catch (error) {
    console.error(
      "Get profile failed:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to load profile.",
      error:
        error instanceof Error
          ? error.message
          : "Unknown profile error.",
    });
  }
});

/**
 * PUT /profile
 */
router.put("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const preferredTone =
      req.body.preferredTone;

    if (
      preferredTone !== undefined &&
      !isProfileTone(preferredTone)
    ) {
      return res.status(400).json({
        message:
          "preferredTone must be professional, friendly, direct, or consultative.",
      });
    }

    let input: UpdateUserProfileInput;

    try {
      input = {
        businessName:
          validateTextField(
            req.body.businessName,
            "businessName",
            120,
          ),

        serviceType:
          validateTextField(
            req.body.serviceType,
            "serviceType",
            120,
          ),

        serviceDescription:
          validateTextField(
            req.body.serviceDescription,
            "serviceDescription",
            1000,
          ),

        targetCustomer:
          validateTextField(
            req.body.targetCustomer,
            "targetCustomer",
            500,
          ),

        preferredTone,
      };
    } catch (validationError) {
      return res.status(400).json({
        message:
          validationError instanceof Error
            ? validationError.message
            : "Invalid profile input.",
      });
    }

    const profile =
      await upsertUserProfile(
        userId,
        input,
      );

    return res.status(200).json({
      message:
        "Profile saved successfully.",
      profile,
    });
  } catch (error) {
    console.error(
      "Save profile failed:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to save profile.",
      error:
        error instanceof Error
          ? error.message
          : "Unknown profile error.",
    });
  }
});

export default router;