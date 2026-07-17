import { useState } from "react";

import {
  executeAiAssistantAction,
  previewAiAssistantAction,
  sendAiAssistantChat,
} from "../services/aiAssistantApi";

import type {
  AiActionExecuteResponse,
  AiAssistantMessage,
  AiAssistantModule,
  AiChatConversationMessage,
} from "../types/aiAssistant";

export type AiAssistantMode = "chat" | "actions";

interface UseAiAssistantOptions {
  module: AiAssistantModule;

  onActionExecuted?: (result: AiActionExecuteResponse) => void | Promise<void>;
}

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
            error?: string;
          };
        };
      }
    ).response;

    return (
      response?.data?.error || response?.data?.message || "AI request failed."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "AI request failed.";
}

export function useAiAssistant({
  module,
  onActionExecuted,
}: UseAiAssistantOptions) {
  const [mode, setMode] = useState<AiAssistantMode>("chat");

  const [messages, setMessages] = useState<AiAssistantMessage[]>([]);

  const [loading, setLoading] = useState(false);

  const [executingActionId, setExecutingActionId] = useState<string | null>(
    null,
  );

  function getConversation(): AiChatConversationMessage[] {
    return messages
      .filter(
        (
          message,
        ): message is Extract<
          AiAssistantMessage,
          {
            type: "user" | "assistant";
          }
        > => message.type === "user" || message.type === "assistant",
      )
      .slice(-10)
      .map((message) => ({
        role: message.type === "user" ? "user" : "assistant",

        content: message.content,
      }));
  }

  async function submit(
    rawInput: string,
    leadIds: string[] = [],
  ): Promise<void> {
    const input = rawInput.trim();

    if (!input || loading) {
      return;
    }

    const userMessage: AiAssistantMessage = {
      id: createMessageId(),
      type: "user",
      content: input,
    };

    setMessages((current) => [...current, userMessage]);

    setLoading(true);

    try {
      if (mode === "actions") {
        const preview = await previewAiAssistantAction(input);

        setMessages((current) => [
          ...current,
          {
            id: createMessageId(),
            type: "action",
            instruction: input,
            preview,
          },
        ]);

        return;
      }

      const result = await sendAiAssistantChat({
        message: input,
        module,
        leadIds,
        conversation: getConversation(),
      });

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          type: "assistant",
          content: result.answer,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          type: "error",
          content: getErrorMessage(error),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function confirmAction(
    messageId: string,
    actionId: string,
  ): Promise<void> {
    if (!actionId || executingActionId) {
      return;
    }

    setExecutingActionId(actionId);

    try {
      const execution = await executeAiAssistantAction(actionId);

      setMessages((current) =>
        current.map((message) => {
          if (message.id !== messageId || message.type !== "action") {
            return message;
          }

          return {
            ...message,
            execution,
          };
        }),
      );

      await onActionExecuted?.(execution);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          type: "error",
          content: getErrorMessage(error),
        },
      ]);
    } finally {
      setExecutingActionId(null);
    }
  }

  function cancelAction(messageId: string): void {
    setMessages((current) =>
      current.map((message) => {
        if (
          message.id !== messageId ||
          message.type !== "action" ||
          message.execution
        ) {
          return message;
        }

        return {
          ...message,

          execution: {
            action: message.preview.action,

            module: message.preview.filters.module,

            affectedCount: 0,

            message: "Action cancelled.",
          },
        };
      }),
    );
  }

  function clearMessages(): void {
    setMessages([]);
  }

  return {
    mode,
    setMode,

    messages,

    loading,
    executingActionId,

    submit,
    confirmAction,
    cancelAction,
    clearMessages,
  };
}
