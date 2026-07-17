import { useEffect, useState, type FormEvent } from "react";

import { getProfile, saveProfile } from "../../services/profileApi";

import {
  PROFILE_TONES,
  type ProfileTone,
  type UserProfile,
} from "../../types/profile";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const emptyProfile: UserProfile = {
  businessName: "",
  serviceType: "",
  serviceDescription: "",
  targetCustomer: "",
  preferredTone: "professional",
};

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");
  const normalizedServiceType = profile.serviceType.trim().toLowerCase();

  const normalizedServiceDescription = profile.serviceDescription
    .trim()
    .toLowerCase();

  const serviceTypeMentionsWeb =
    normalizedServiceType.includes("web developer") ||
    normalizedServiceType.includes("web development") ||
    normalizedServiceType.includes("website developer") ||
    normalizedServiceType.includes("website development");

  const serviceTypeMentionsDesign =
    normalizedServiceType.includes("graphic designer") ||
    normalizedServiceType.includes("graphic design") ||
    normalizedServiceType.includes("design studio") ||
    normalizedServiceType.includes("branding studio");

  const descriptionMentionsWeb =
    normalizedServiceDescription.includes("website") ||
    normalizedServiceDescription.includes("web development") ||
    normalizedServiceDescription.includes("landing page") ||
    normalizedServiceDescription.includes("frontend") ||
    normalizedServiceDescription.includes("ecommerce development");

  const descriptionMentionsDesign =
    normalizedServiceDescription.includes("graphic design") ||
    normalizedServiceDescription.includes("logo design") ||
    normalizedServiceDescription.includes("branding") ||
    normalizedServiceDescription.includes("visual identity") ||
    normalizedServiceDescription.includes("social media graphics");

  const profileWarning =
    serviceTypeMentionsWeb &&
    descriptionMentionsDesign &&
    !descriptionMentionsWeb
      ? "Your service type describes web development, but your service description mainly describes graphic design."
      : serviceTypeMentionsDesign &&
          descriptionMentionsWeb &&
          !descriptionMentionsDesign
        ? "Your service type describes graphic design, but your service description mainly describes web development."
        : "";

  useEffect(() => {
    if (!open) {
      return;
    }

    async function loadProfile() {
      setLoading(true);
      setError("");
      setMessage("");

      try {
        const savedProfile = await getProfile();

        setProfile(savedProfile);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your profile.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [open]);

  if (!open) {
    return null;
  }

  function updateField<K extends keyof UserProfile>(
    field: K,
    value: UserProfile[K],
  ) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await saveProfile(profile);

      setProfile(result.profile);
      setMessage(result.message);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save your profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2
              id="profile-modal-title"
              className="text-xl font-bold text-slate-900"
            >
              Service Profile
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Groq uses this information to personalize emails and AI assistant
              answers.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close profile"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading profile...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <div>
              <label
                htmlFor="businessName"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Business name
              </label>

              <input
                id="businessName"
                type="text"
                maxLength={120}
                value={profile.businessName}
                onChange={(event) =>
                  updateField("businessName", event.target.value)
                }
                placeholder="Faheem Creative Studio"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="serviceType"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Service type
              </label>

              <input
                id="serviceType"
                type="text"
                required
                maxLength={120}
                value={profile.serviceType}
                onChange={(event) =>
                  updateField("serviceType", event.target.value)
                }
                placeholder="Graphic design, software development, SEO..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-xs text-slate-500">
                Describe the main service you sell.
              </p>
            </div>

            <div>
              <label
                htmlFor="serviceDescription"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Service description
              </label>

              <textarea
                id="serviceDescription"
                rows={4}
                maxLength={1000}
                value={profile.serviceDescription}
                onChange={(event) =>
                  updateField("serviceDescription", event.target.value)
                }
                placeholder="Logo design, branding, social media graphics and visual identity services."
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {profile.serviceDescription.length} / 1000
              </p>
            </div>
            
            {profileWarning && (
              <div
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              >
                <p className="font-semibold">
                  Your service information may be inconsistent.
                </p>

                <p className="mt-1">{profileWarning}</p>

                <p className="mt-1">
                  Make both fields describe the same service so generated emails
                  and AI answers stay accurate.
                </p>
              </div>
            )}
            <div>
              <label
                htmlFor="targetCustomer"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Target customers
              </label>

              <textarea
                id="targetCustomer"
                rows={3}
                maxLength={500}
                value={profile.targetCustomer}
                onChange={(event) =>
                  updateField("targetCustomer", event.target.value)
                }
                placeholder="Local businesses, SaaS startups and ecommerce companies"
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="preferredTone"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Preferred email tone
              </label>

              <select
                id="preferredTone"
                value={profile.preferredTone}
                onChange={(event) =>
                  updateField(
                    "preferredTone",
                    event.target.value as ProfileTone,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {PROFILE_TONES.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={saving || !profile.serviceType.trim()}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
