import type { UserType } from "@/app/(auth)/auth";
import type { ChatModel } from "./models";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: [
      // Legacy/Default Models
      "chat-model",
      "chat-model-reasoning",
      // Basic xAI Models
      "xai-grok-3-mini",
      "xai-grok-3-mini-fast",
      // Fast Groq Models
      "groq-llama-3.1-8b-instant",
      "groq-gemma2-9b-it",
      // Basic Cerebras Models
      "cerebras-llama3.1-8b",
      // DeepSeek Chat
      "deepseek-chat",
    ],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: [
      // xAI Grok Models
      "xai-grok-4",
      "xai-grok-3",
      "xai-grok-3-fast",
      "xai-grok-3-mini",
      "xai-grok-3-mini-fast",
      "xai-grok-2-1212",
      "xai-grok-2-vision-1212",
      "xai-grok-beta",
      "xai-grok-vision-beta",
      // Vercel Models
      "vercel-v0-1.0-md",
      // OpenAI Models
      "openai-gpt-5",
      "openai-gpt-5-mini",
      "openai-gpt-5-nano",
      "openai-gpt-5-codex",
      "openai-gpt-5-chat-latest",
      // Anthropic Models
      "anthropic-claude-opus-4-1",
      "anthropic-claude-opus-4-0",
      "anthropic-claude-sonnet-4-0",
      "anthropic-claude-3-7-sonnet-latest",
      "anthropic-claude-3-5-haiku-latest",
      // Mistral Models
      "mistral-pixtral-large-latest",
      "mistral-large-latest",
      "mistral-medium-latest",
      "mistral-medium-2505",
      "mistral-small-latest",
      "mistral-pixtral-12b-2409",
      // Google Generative AI Models
      "google-gemini-2.0-flash-exp",
      "google-gemini-1.5-flash",
      "google-gemini-1.5-pro",
      // Google Vertex Models
      "google-vertex-gemini-2.0-flash-exp",
      "google-vertex-gemini-1.5-flash",
      "google-vertex-gemini-1.5-pro",
      // DeepSeek Models
      "deepseek-chat",
      "deepseek-reasoner",
      // Cerebras Models
      "cerebras-llama3.1-8b",
      "cerebras-llama3.1-70b",
      "cerebras-llama3.3-70b",
      // Groq Models
      "groq-llama-4-scout-17b-16e-instruct",
      "groq-llama-3.3-70b-versatile",
      "groq-llama-3.1-8b-instant",
      "groq-mixtral-8x7b-32768",
      "groq-gemma2-9b-it",
      // Legacy/Default Models
      "chat-model",
      "chat-model-reasoning",
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   * Premium users would have unlimited access to all models
   */
};
