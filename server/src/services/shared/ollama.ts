import { safeTrackUsage } from "../usage/usageTracker";

import type {
  UsageTrackingContext,
} from "../usage/usageTypes";

type OllamaGenerateResponse = {
  response?: string;
};

export interface OllamaUsageContext
  extends UsageTrackingContext {
  operation:
    | "email_reference"
    | "online_classifier"
    | "no_website_email_reference"
    | "extension_email_reference"
    | "other";
}

function extractJson<T>(text: string): T {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (
    jsonStart === -1 ||
    jsonEnd === -1 ||
    jsonEnd < jsonStart
  ) {
    throw new Error(
      "No JSON found in Ollama response",
    );
  }

  const jsonText = cleaned.slice(
    jsonStart,
    jsonEnd + 1,
  );

  return JSON.parse(jsonText) as T;
}

async function trackOllamaUsage(
  context?: OllamaUsageContext,
): Promise<void> {
  if (!context) {
    return;
  }

  await safeTrackUsage({
    userId: context.userId,
    eventType: "ollama_generation",
    quantity: 1,
    creditsUsed: 1,
    source: context.source,
    metadata: {
      operation: context.operation,
      module: context.module || "",
      model: "llama3.2",
    },
  });
}

async function requestOllama(
  prompt: string,
): Promise<string> {
  const response = await fetch(
    "http://localhost:11434/api/generate",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt,
        stream: false,
        format: "json",
        options: {
          temperature: 0.2,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Ollama request failed with status ${response.status}`,
    );
  }

  const data =
    (await response.json()) as OllamaGenerateResponse;

  if (!data.response) {
    throw new Error(
      "Ollama returned an empty response",
    );
  }

  return data.response;
}

export async function analyzeWithGroq<T>(
  prompt: string,
  context?: OllamaUsageContext,
): Promise<T> {
  let lastError: unknown;

  // One logical generation is counted even if JSON parsing
  // requires the internal retry below.
  await trackOllamaUsage(context);

  for (
    let attempt = 1;
    attempt <= 2;
    attempt++
  ) {
    try {
      const retryPrompt =
        attempt === 1
          ? prompt
          : `${prompt}

IMPORTANT:
Return one valid JSON object only.
Do not include markdown.
Do not include explanations.
Do not include text before or after the JSON object.`;

      const text =
        await requestOllama(
          retryPrompt,
        );

      return extractJson<T>(text);
    } catch (error) {
      lastError = error;

      console.error(
        `Ollama JSON attempt ${attempt} failed:`,
        error,
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        "Ollama JSON parsing failed",
      );
}

export async function callOllama(
  prompt: string,
  context?: OllamaUsageContext,
): Promise<string> {
  await trackOllamaUsage(context);

  const response = await fetch(
    "http://localhost:11434/api/generate",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt,
        stream: false,
        options: {
          temperature: 0.4,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Ollama request failed with status ${response.status}`,
    );
  }

  const data =
    (await response.json()) as OllamaGenerateResponse;

  if (!data.response) {
    throw new Error(
      "Ollama returned an empty response",
    );
  }

  return data.response;
}