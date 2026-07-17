import { createOnlineCompanyClassifierPrompt } from "../../prompts/onlineCompanyClassifier.prompt";
import type {
  OnlineCompanyCandidate,
  OnlineCompanyClassification,
  OnlineCompanyClassificationResponse,
  OnlineCompanySearchResult,
  OnlineDiscoverInput,
} from "../../types/onlineCompany";
import { analyzeWithGroq } from "../shared/groq";

function isValidClassification(
  value: unknown,
): value is OnlineCompanyClassification {
  if (!value || typeof value !== "object") {
    return false;
  }

  const classification = value as Partial<OnlineCompanyClassification>;

  return (
    Number.isInteger(classification.index) &&
    typeof classification.isOnlineBusiness === "boolean" &&
    typeof classification.businessModel === "string" &&
    typeof classification.confidence === "number" &&
    Number.isFinite(classification.confidence) &&
    classification.confidence >= 0 &&
    classification.confidence <= 100 &&
    typeof classification.reason === "string"
  );
}

export async function classifyOnlineCompanies(
  companies: OnlineCompanySearchResult[],
  input: OnlineDiscoverInput,
  userId?: string,
): Promise<OnlineCompanySearchResult[]> {
  if (companies.length === 0) {
    return [];
  }

  const candidates: OnlineCompanyCandidate[] = companies.map(
    (company, index) => ({
      index,
      ...company,
    }),
  );

  const prompt = createOnlineCompanyClassifierPrompt(candidates, input);

  try {
    const classificationResponse =
      await analyzeWithGroq<OnlineCompanyClassificationResponse>(
        prompt,
        userId
          ? {
              userId,
              source: "online",
              module: "online",
              operation: "online_classifier",
            }
          : undefined,
      );

    const classifications = Array.isArray(classificationResponse?.results)
      ? classificationResponse.results.filter(isValidClassification)
      : [];

    if (classifications.length === 0) {
      console.warn("Groq returned no valid online-company classifications.");

      return companies;
    }

    const classificationMap = new Map(
      classifications.map((classification) => [
        classification.index,
        classification,
      ]),
    );

    // Replace the old companies.filter(...) section with this block.
    const classifiedCompanies: OnlineCompanySearchResult[] = [];

    for (let index = 0; index < companies.length; index += 1) {
      const company = companies[index];
      const classification = classificationMap.get(index);

      // Keep the candidate when Groq failed to classify it.
      if (!classification) {
        classifiedCompanies.push({
          ...company,
          businessModel:
            company.businessModel || input.businessModel || "other",
        });

        continue;
      }

      console.log("Online company classification:", {
        company: company.name,
        isOnlineBusiness: classification.isOnlineBusiness,
        businessModel: classification.businessModel,
        confidence: classification.confidence,
        reason: classification.reason,
      });

      // Reject only when Groq clearly says it is not an
      // internet-first business.
      if (!classification.isOnlineBusiness) {
        console.log("Rejected non-business candidate:", {
          company: company.name,
          website: company.websiteUrl,
          reason: classification.reason,
        });

        continue;
      }

      classifiedCompanies.push({
        ...company,

        businessModel:
          classification.businessModel !== "unknown"
            ? classification.businessModel
            : company.businessModel || input.businessModel || "other",
      });
    }

    return classifiedCompanies;
  } catch (error) {
    console.error("Groq online-company classification failed:", error);

    return companies;
  }
}
