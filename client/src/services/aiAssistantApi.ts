import { apiClient } from "./apiClient";

import type {
  AiActionExecuteResponse,
  AiActionPreviewResponse,
  AiAssistantModule,
  AiChatConversationMessage,
  AiChatResponse,
} from "../types/aiAssistant";

export async function previewAiAssistantAction(
  instruction: string,
): Promise<AiActionPreviewResponse> {
  const response =
    await apiClient.post<AiActionPreviewResponse>(
      "/ai/actions/preview",
      {
        instruction,
      },
    );

  return response.data;
}

export async function executeAiAssistantAction(
  actionId: string,
): Promise<AiActionExecuteResponse> {
  const response =
    await apiClient.post<AiActionExecuteResponse>(
      "/ai/actions/execute",
      {
        actionId,
        confirmation: true,
      },
    );

  return response.data;
}

export async function sendAiAssistantChat(input: {
  message: string;
  module: AiAssistantModule;
  leadIds: string[];
  conversation: AiChatConversationMessage[];
}): Promise<AiChatResponse> {
  const response =
    await apiClient.post<AiChatResponse>(
      "/ai/chat",
      input,
    );

  return response.data;
}