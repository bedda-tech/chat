/**
 * AI Gateway Configuration
 * Manages provider fallback, routing, and advanced features
 */

export type ProviderName =
  | "anthropic"
  | "vertex"
  | "google"
  | "openai"
  | "xai"
  | "mistral"
  | "deepseek"
  | "groq"
  | "cerebras";

export type GatewayConfig = {
  order?: ProviderName[];
  includeMetadata?: boolean;
};

/**
 * Get provider fallback order for a given model
 * This allows automatic failover if the primary provider is unavailable
 */
export function getProviderFallbackOrder(
  modelId: string
): ProviderName[] | undefined {
  // Anthropic models: try Vertex AI first (often more stable), then Anthropic
  if (modelId.includes("anthropic/claude")) {
    return ["vertex", "anthropic"];
  }

  // Google models: try Vertex AI first, then Google Generative AI
  if (modelId.includes("google/gemini")) {
    return ["vertex", "google"];
  }

  // For other providers, use the default provider (no fallback specified)
  return;
}

/**
 * Build gateway configuration for a model request
 */
export function buildGatewayConfig(modelId: string): GatewayConfig {
  return {
    order: getProviderFallbackOrder(modelId),
    includeMetadata: true, // Always include metadata for cost tracking
  };
}

/**
 * Get thinking budget for Anthropic models
 * Controls how many tokens the model can use for extended reasoning
 */
export function getThinkingBudget(modelId: string): number | undefined {
  if (!modelId.includes("anthropic")) {
    return;
  }

  // Different budgets for different model tiers
  if (modelId.includes("opus")) {
    return 2000; // Opus models get more thinking budget
  }

  if (modelId.includes("sonnet")) {
    return 1000; // Sonnet models get standard budget
  }

  if (modelId.includes("haiku")) {
    return 500; // Haiku models get smaller budget for speed
  }

  return 1000; // Default for other Anthropic models
}

