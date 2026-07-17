import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { sleep } from "./mockGenerator";

export type GroqOperation =
  | "email_reference"
  | "online_classifier"
  | "no_website_email_reference"
  | "extension_email_reference"
  | "dashboard_chat"
  | "website_analysis"
  | "other";

export interface GroqUsageContext {
  userId: string;
  source: string;
  module?: string;
  operation: GroqOperation;
}

interface GroqJsonOptions {
  temperature?: number;
  maxTokens?: number;
}

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

export async function analyzeWithGroq<T>(
  prompt: string,
  context?: GroqUsageContext,
  options: GroqJsonOptions = {},
): Promise<T> {
  console.log(`\n[AI SIMULATOR] Connection: POST https://api.groq.com/openai/v1/chat/completions`);
  console.log(`[AI SIMULATOR] Groq Model: ${GROQ_MODEL}`);
  console.log(`[AI SIMULATOR] Prompt length: ${prompt.length} chars`);
  
  await sleep(800);

  let mockResponse: any = {};

  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes("email") || lowerPrompt.includes("subject")) {
    // Return a mock email structure
    mockResponse = {
      subject: "Boosting web conversions and bookings",
      body: "Hi Team,\n\nI was looking at your website and noticed a few simple changes that could significantly increase your client bookings. Specifically, improving mobile layout and adding a direct scheduling form.\n\nI build high-converting websites for businesses in your industry. Would you be open to a 10-minute chat this week to review some free recommendations?\n\nBest regards,\nSales Consultant"
    };
  } else {
    // Return a mock audit analysis
    mockResponse = {
      score: 65,
      priority: "Medium",
      issues: [
        "Page response speed is below optimal threshold on mobile.",
        "Missing call-to-action button in primary banner.",
        "No structured local business schema metadata found."
      ],
      summary: "The website has a professional brand image but lacks basic conversion rate optimization elements and mobile performance adjustments.",
      businessOpportunity: "Improve SEO indexing with correct meta tags and embed a clear online booking call-to-action.",
      estimatedImpact: "Medium"
    };
  }

  console.log(`[AI SIMULATOR] Groq response: 200 OK (Simulated JSON returned)\n`);
  return mockResponse as T;
}

export async function chatWithGroq(
  messages: ChatCompletionMessageParam[],
  context?: GroqUsageContext,
): Promise<string> {
  console.log(`\n[AI SIMULATOR] Chat completion request: POST https://api.groq.com/openai/v1/chat/completions`);
  console.log(`[AI SIMULATOR] Messages count: ${messages.length}`);
  
  await sleep(1000);

  const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content || "";
  const userText = String(lastUserMessage).toLowerCase();

  let reply = "I've analyzed your current leads database. Most of your leads have medium priority. I suggest we initiate a cold-email sequence targeting the local businesses that are currently missing contact forms, as they have the highest interest in optimization.";

  if (userText.includes("hello") || userText.includes("hi")) {
    reply = "Hello! I am your AI Sales assistant. I can help you analyze leads, draft email copy, or identify search strategies. What would you like to do today?";
  } else if (userText.includes("email") || userText.includes("pitch")) {
    reply = "To write a high-converting cold email pitch, we should focus on a specific technical issue we found on their website (like a missing contact form or slow speed), explain how it costs them money, and offer a quick call to resolve it.";
  } else if (userText.includes("leads") || userText.includes("best")) {
    reply = "Based on our latest searches, the best opportunities are local services with a lead score below 60. They have solid local reputations but outdated websites that are easy to improve.";
  }

  console.log(`[AI SIMULATOR] Chat response: 200 OK (Simulated reply generated)\n`);
  return reply;
}
