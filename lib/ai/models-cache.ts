/**
 * Server-Side Model Cache
 * Caches AI Gateway model discovery results to reduce API calls
 */

import { gateway } from "ai";
import modelsData from "./models-data.json";

interface AvailableModel {
  id: string;
  name: string;
  description?: string;
  pricing?: {
    input: number;
    output: number;
    cachedInputTokens?: number;
    cacheCreationInputTokens?: number;
  };
}

interface CachedModels {
  models: AvailableModel[];
  timestamp: number;
}

interface EnrichedModel {
  id: string;
  gatewayId: string;
  name: string;
  description: string;
  provider: string;
  contextWindow?: number;
  pricing: {
    input: number;
    output: number;
    cachedInput?: number | null;
    cachedOutput?: number | null;
  };
  capabilities: {
    vision: boolean;
    toolCalling: boolean;
    reasoning: boolean;
    imageGeneration: boolean;
  };
  config: {
    maxSteps: number;
    temperature?: number;
    idealFor: string[];
  };
}

let cache: CachedModels | null = null;
const CACHE_DURATION = 3600000; // 1 hour

/**
 * Infer tool capabilities based on model ID
 */
function inferToolCapabilities(modelId: string): string[] {
  const tools: string[] = [];

  // Most models support these tools
  tools.push(
    "weather",
    "documents",
    "suggestions",
    "analysis",
    "structured-data"
  );

  // Image generation models
  if (
    modelId.includes("dall-e") ||
    modelId.includes("imagen") ||
    modelId.includes("image") ||
    modelId.includes("gemini-2.5-flash-image")
  ) {
    tools.push("images");
  }

  // Audio models
  if (modelId.includes("whisper") || modelId.includes("tts")) {
    tools.push("audio");
  }

  // Embedding models
  if (modelId.includes("embedding")) {
    tools.push("embeddings", "similarity");
  }

  return tools;
}

/**
 * Infer capabilities from model ID
 */
function inferCapabilities(modelId: string): EnrichedModel["capabilities"] {
  return {
    vision:
      modelId.includes("gpt-4") ||
      modelId.includes("gemini") ||
      modelId.includes("claude") && !modelId.includes("3-haiku"),
    toolCalling: true, // Most modern models support tools
    reasoning:
      modelId.includes("sonnet-4") ||
      modelId.includes("sonnet-3.7") ||
      modelId.includes("gpt-5") ||
      modelId.includes("gemini-2") ||
      modelId.includes("deepseek") ||
      modelId.includes("reasoning"),
    imageGeneration:
      modelId.includes("image") || modelId.includes("flash-image"),
  };
}

/**
 * Infer configuration from model ID
 */
function inferConfig(modelId: string): EnrichedModel["config"] {
  // Haiku/Fast models
  if (modelId.includes("haiku") || modelId.includes("fast") || modelId.includes("nano") || modelId.includes("lite")) {
    return {
      maxSteps: 5,
      temperature: 0.6,
      idealFor: ["fast responses", "efficient processing", "high throughput"],
    };
  }

  // Reasoning/Sonnet models
  if (
    modelId.includes("sonnet") ||
    modelId.includes("reasoning") ||
    modelId.includes("gpt-5")
  ) {
    return {
      maxSteps: 8,
      temperature: 0.7,
      idealFor: ["complex reasoning", "analysis", "advanced tasks"],
    };
  }

  // Pro/Advanced models
  if (modelId.includes("pro") || modelId.includes("gpt-4")) {
    return {
      maxSteps: 7,
      temperature: 0.7,
      idealFor: ["multimodal", "advanced tasks", "vision"],
    };
  }

  // Default
  return {
    maxSteps: 6,
    temperature: 0.7,
    idealFor: ["general purpose", "everyday tasks"],
  };
}

/**
 * Get available models with caching
 */
export async function getAvailableModels(
  forceRefresh = false
): Promise<EnrichedModel[]> {
  const now = Date.now();

  // Return cached if still valid and not forcing refresh
  if (
    !forceRefresh &&
    cache &&
    now - cache.timestamp < CACHE_DURATION
  ) {
    console.log("✅ Returning cached models from server-side cache");
    return transformToEnrichedModels(cache.models);
  }

  try {
    console.log("🔄 Fetching models from AI Gateway...");
    const availableModels = await gateway.getAvailableModels();

    // Update cache
    cache = {
      models: availableModels.models,
      timestamp: now,
    };

    console.log(
      `✅ Fetched ${availableModels.models.length} models from AI Gateway`
    );
    return transformToEnrichedModels(availableModels.models);
  } catch (error) {
    console.error("❌ Failed to fetch dynamic models:", error);

    // If cache exists but is stale, return it anyway
    if (cache) {
      console.warn("⚠️ Returning stale cached models");
      return transformToEnrichedModels(cache.models);
    }

    // Ultimate fallback to static JSON
    console.warn("⚠️ Falling back to static models configuration");
    return modelsData.models as EnrichedModel[];
  }
}

/**
 * Transform gateway models to enriched format with static metadata
 */
function transformToEnrichedModels(
  gatewayModels: AvailableModel[]
): EnrichedModel[] {
  return gatewayModels.map((model) => {
    // Find matching static model for custom metadata
    const staticModel = modelsData.models.find(
      (m) =>
        m.gatewayId === model.id ||
        m.id === model.id.replace("/", "-")
    );

    // Extract provider from gateway ID (e.g., "anthropic/claude-sonnet-4" -> "anthropic")
    const provider = model.id.split("/")[0];

    // Use static metadata if available, otherwise infer
    const capabilities = staticModel
      ? staticModel.capabilities
      : inferCapabilities(model.id);

    const config = staticModel ? staticModel.config : inferConfig(model.id);

    return {
      id: staticModel?.id || model.id.replace("/", "-"),
      gatewayId: model.id,
      name: model.name || staticModel?.name || model.id,
      description:
        model.description ||
        staticModel?.description ||
        `${model.name} model from ${provider}`,
      provider,
      contextWindow: staticModel?.contextWindow,
      pricing: {
        input: model.pricing?.input || staticModel?.pricing?.input || 0,
        output: model.pricing?.output || staticModel?.pricing?.output || 0,
        cachedInput:
          model.pricing?.cachedInputTokens ||
          staticModel?.pricing?.cachedInput ||
          null,
        cachedOutput: staticModel?.pricing?.cachedOutput || null,
      },
      capabilities,
      config,
    };
  });
}

/**
 * Clear the model cache (useful for admin actions or deployment)
 */
export function clearModelsCache() {
  cache = null;
  console.log("🗑️ Model cache cleared");
}

/**
 * Get cache status for debugging
 */
export function getCacheStatus() {
  if (!cache) {
    return { cached: false, age: 0, count: 0 };
  }

  const age = Date.now() - cache.timestamp;
  return {
    cached: true,
    age,
    count: cache.models.length,
    isStale: age > CACHE_DURATION,
  };
}
