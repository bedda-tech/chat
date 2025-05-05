import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        // xAI Grok Models
        "xai-grok-4": gateway.languageModel("xai/grok-4"),
        "xai-grok-3": gateway.languageModel("xai/grok-3"),
        "xai-grok-3-fast": gateway.languageModel("xai/grok-3-fast"),
        "xai-grok-3-mini": gateway.languageModel("xai/grok-3-mini"),
        "xai-grok-3-mini-fast": gateway.languageModel("xai/grok-3-mini-fast"),
        "xai-grok-2-1212": gateway.languageModel("xai/grok-2-1212"),
        "xai-grok-2-vision-1212": gateway.languageModel("xai/grok-2-vision-1212"),
        "xai-grok-beta": gateway.languageModel("xai/grok-beta"),
        "xai-grok-vision-beta": gateway.languageModel("xai/grok-vision-beta"),

        // Vercel Models
        "vercel-v0-1.0-md": gateway.languageModel("vercel/v0-1.0-md"),

        // OpenAI Models
        "openai-gpt-5": gateway.languageModel("openai/gpt-5"),
        "openai-gpt-5-mini": gateway.languageModel("openai/gpt-5-mini"),
        "openai-gpt-5-nano": gateway.languageModel("openai/gpt-5-nano"),
        "openai-gpt-5-codex": gateway.languageModel("openai/gpt-5-codex"),
        "openai-gpt-5-chat-latest": gateway.languageModel("openai/gpt-5-chat-latest"),

        // Anthropic Models
        "anthropic-claude-opus-4-1": gateway.languageModel("anthropic/claude-opus-4-1"),
        "anthropic-claude-opus-4-0": gateway.languageModel("anthropic/claude-opus-4-0"),
        "anthropic-claude-sonnet-4-0": gateway.languageModel("anthropic/claude-sonnet-4-0"),
        "anthropic-claude-3-7-sonnet-latest": gateway.languageModel("anthropic/claude-3-7-sonnet-latest"),
        "anthropic-claude-3-5-haiku-latest": gateway.languageModel("anthropic/claude-3-5-haiku-latest"),

        // Mistral Models
        "mistral-pixtral-large-latest": gateway.languageModel("mistral/pixtral-large-latest"),
        "mistral-large-latest": gateway.languageModel("mistral/mistral-large-latest"),
        "mistral-medium-latest": gateway.languageModel("mistral/mistral-medium-latest"),
        "mistral-medium-2505": gateway.languageModel("mistral/mistral-medium-2505"),
        "mistral-small-latest": gateway.languageModel("mistral/mistral-small-latest"),
        "mistral-pixtral-12b-2409": gateway.languageModel("mistral/pixtral-12b-2409"),

        // Google Generative AI Models
        "google-gemini-2.0-flash-exp": gateway.languageModel("google/gemini-2.0-flash-exp"),
        "google-gemini-1.5-flash": gateway.languageModel("google/gemini-1.5-flash"),
        "google-gemini-1.5-pro": gateway.languageModel("google/gemini-1.5-pro"),

        // Google Vertex Models
        "google-vertex-gemini-2.0-flash-exp": gateway.languageModel("google-vertex/gemini-2.0-flash-exp"),
        "google-vertex-gemini-1.5-flash": gateway.languageModel("google-vertex/gemini-1.5-flash"),
        "google-vertex-gemini-1.5-pro": gateway.languageModel("google-vertex/gemini-1.5-pro"),

        // DeepSeek Models
        "deepseek-chat": gateway.languageModel("deepseek/deepseek-chat"),
        "deepseek-reasoner": gateway.languageModel("deepseek/deepseek-reasoner"),

        // Cerebras Models
        "cerebras-llama3.1-8b": gateway.languageModel("cerebras/llama3.1-8b"),
        "cerebras-llama3.1-70b": gateway.languageModel("cerebras/llama3.1-70b"),
        "cerebras-llama3.3-70b": gateway.languageModel("cerebras/llama3.3-70b"),

        // Groq Models
        "groq-llama-4-scout-17b-16e-instruct": gateway.languageModel("groq/meta-llama/llama-4-scout-17b-16e-instruct"),
        "groq-llama-3.3-70b-versatile": gateway.languageModel("groq/llama-3.3-70b-versatile"),
        "groq-llama-3.1-8b-instant": gateway.languageModel("groq/llama-3.1-8b-instant"),
        "groq-mixtral-8x7b-32768": gateway.languageModel("groq/mixtral-8x7b-32768"),
        "groq-gemma2-9b-it": gateway.languageModel("groq/gemma2-9b-it"),

        // Legacy/Default Models (keeping for backward compatibility)
        "chat-model": gateway.languageModel("xai/grok-2-vision-1212"),
        "chat-model-reasoning": wrapLanguageModel({
          model: gateway.languageModel("xai/grok-3-mini"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "title-model": gateway.languageModel("xai/grok-2-1212"),
        "artifact-model": gateway.languageModel("xai/grok-2-1212"),
      },
    });
