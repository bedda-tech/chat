"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
  onModelChange?: (modelId: string) => void;
};

type SuggestionConfig = {
  text: string;
  modelId?: string;
  emoji: string;
};

function PureSuggestedActions({ 
  chatId, 
  sendMessage,
  onModelChange,
}: SuggestedActionsProps) {
  const suggestedActions: SuggestionConfig[] = [
    {
      emoji: "🎨",
      text: "Generate a beautiful sunset image over mountains",
      modelId: "google-gemini-2.5-flash-image",
    },
    {
      emoji: "💻",
      text: "Write a React component with TypeScript for a todo list",
      modelId: "openai-gpt-5-codex",
    },
    {
      emoji: "🧠",
      text: "Explain quantum computing using deep reasoning",
      modelId: "deepseek-reasoner",
    },
    {
      emoji: "🌤️",
      text: "What's the weather in San Francisco right now?",
    },
  ];

  return (
    <div
      className="grid w-full gap-2 sm:grid-cols-2"
      data-testid="suggested-actions"
    >
      {suggestedActions.map((config, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          initial={{ opacity: 0, y: 20 }}
          key={config.text}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left"
            onClick={(suggestion) => {
              // If a specific model is recommended, switch to it
              if (config.modelId && onModelChange) {
                onModelChange(config.modelId);
              }
              
              window.history.replaceState({}, "", `/chat/${chatId}`);
              sendMessage({
                role: "user",
                parts: [{ type: "text", text: suggestion }],
              });
            }}
            suggestion={config.text}
          >
            <span className="mr-2 text-lg">{config.emoji}</span>
            {config.text}
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
