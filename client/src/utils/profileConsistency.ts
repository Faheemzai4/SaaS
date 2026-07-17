export interface ProfileConsistencyInput {
  serviceType: string;
  serviceDescription: string;
}

export interface ProfileConsistencyResult {
  mayBeInconsistent: boolean;
  message: string | null;
}

function includesAny(
  value: string,
  terms: string[],
): boolean {
  return terms.some((term) => value.includes(term));
}

export function checkProfileConsistency({
  serviceType,
  serviceDescription,
}: ProfileConsistencyInput): ProfileConsistencyResult {
  const normalizedType = serviceType.trim().toLowerCase();
  const normalizedDescription = serviceDescription.trim().toLowerCase();

  if (!normalizedType || !normalizedDescription) {
    return {
      mayBeInconsistent: false,
      message: null,
    };
  }

  const typeMentionsWeb = includesAny(normalizedType, [
    "web developer",
    "web development",
    "website developer",
    "website development",
  ]);

  const typeMentionsGraphicDesign = includesAny(normalizedType, [
    "graphic designer",
    "graphic design",
    "branding studio",
    "design studio",
  ]);

  const descriptionMentionsWeb = includesAny(normalizedDescription, [
    "website",
    "web development",
    "landing page",
    "frontend",
    "ecommerce development",
  ]);

  const descriptionMentionsGraphicDesign = includesAny(
    normalizedDescription,
    [
      "graphic design",
      "logo design",
      "branding",
      "visual identity",
      "social media graphics",
    ],
  );

  if (
    typeMentionsWeb &&
    descriptionMentionsGraphicDesign &&
    !descriptionMentionsWeb
  ) {
    return {
      mayBeInconsistent: true,
      message:
        "Your service type describes web development, but your service description mainly describes graphic design.",
    };
  }

  if (
    typeMentionsGraphicDesign &&
    descriptionMentionsWeb &&
    !descriptionMentionsGraphicDesign
  ) {
    return {
      mayBeInconsistent: true,
      message:
        "Your service type describes graphic design, but your service description mainly describes web development.",
    };
  }

  return {
    mayBeInconsistent: false,
    message: null,
  };
}