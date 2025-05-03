/**
 * Model-specific configuration for AI features
 * Manages maxSteps, temperature, and other model-specific settings
 */

export type ModelConfig = {
  maxSteps: number;
  temperature?: number;
  topP?: number;
  supportsVision: boolean;
  supportsToolCalling: boolean;
  supportsReasoning: boolean;
  supportsImageGeneration: boolean;
  idealFor: string[];
};

/**
 * Get configuration for a specific model
 */
export function getModelConfig(modelId: string): ModelConfig {
  // Reasoning models need more steps for complex thought chains
  if (modelId.includes("reasoner") || modelId.includes("reasoning")) {
    return {
      maxSteps: 10, // Allow more steps for reasoning models
      temperature: 0.7,
      supportsVision: false,
      supportsToolCalling: false, // Most reasoning models don't support tools
      supportsReasoning: true,
      supportsImageGeneration: false,
      idealFor: ["complex reasoning", "math", "logic", "analysis"],
    };
  }

  // Opus models are best for complex tasks
  if (modelId.includes("opus")) {
    return {
      maxSteps: 8,
      temperature: 0.8,
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: true,
      supportsImageGeneration: false,
      idealFor: ["complex tasks", "research", "writing", "code generation"],
    };
  }

  // Sonnet models are balanced
  if (modelId.includes("sonnet")) {
    return {
      maxSteps: 6,
      temperature: 0.7,
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: true,
      supportsImageGeneration: false,
      idealFor: ["general purpose", "balanced performance"],
    };
  }

  // Haiku models are fast and efficient
  if (modelId.includes("haiku")) {
    return {
      maxSteps: 4,
      temperature: 0.6,
      supportsVision: false,
      supportsToolCalling: true,
      supportsReasoning: false,
      supportsImageGeneration: false,
      idealFor: ["quick responses", "simple tasks", "high throughput"],
    };
  }

  // Image generation models
  if (modelId.includes("flash-image")) {
    return {
      maxSteps: 1, // Image generation typically doesn't need multiple steps
      temperature: 0.9, // Higher temperature for creative generation
      supportsVision: false,
      supportsToolCalling: false,
      supportsReasoning: false,
      supportsImageGeneration: true,
      idealFor: ["image generation", "visual content"],
    };
  }

  // Codex models are specialized for code
  if (modelId.includes("codex")) {
    return {
      maxSteps: 5,
      temperature: 0.3, // Lower temperature for more deterministic code
      supportsVision: false,
      supportsToolCalling: true,
      supportsReasoning: false,
      supportsImageGeneration: false,
      idealFor: ["code generation", "debugging", "refactoring"],
    };
  }

  // GPT-5 models
  if (modelId.includes("gpt-5")) {
    return {
      maxSteps: 7,
      temperature: 0.7,
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: false,
      supportsImageGeneration: false,
      idealFor: ["general purpose", "reasoning", "coding"],
    };
  }

  // Gemini models
  if (modelId.includes("gemini")) {
    return {
      maxSteps: 6,
      temperature: 0.7,
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: false,
      supportsImageGeneration: modelId.includes("flash-image"),
      idealFor: ["multimodal tasks", "vision", "general purpose"],
    };
  }

  // Default configuration for unknown models
  return {
    maxSteps: 5,
    temperature: 0.7,
    supportsVision: false,
    supportsToolCalling: true,
    supportsReasoning: false,
    supportsImageGeneration: false,
    idealFor: ["general purpose"],
  };
}

/**
 * Get a human-readable description of what a model is best for
 * Accepts both internal model ID (e.g., "openai-gpt-5-codex") and gateway model ID (e.g., "openai/gpt-5-codex")
 */
export function getModelIdealUse(modelId: string): string {
  // Convert internal model ID to gateway-style for matching
  let normalizedId = modelId;
  
  // Handle internal format (provider-model-name) -> gateway format (provider/model-name)
  if (!modelId.includes("/")) {
    // Map common prefixes
    if (modelId.startsWith("anthropic-")) {
      normalizedId = modelId.replace("anthropic-", "anthropic/");
    } else if (modelId.startsWith("openai-")) {
      normalizedId = modelId.replace("openai-", "openai/");
    } else if (modelId.startsWith("google-")) {
      normalizedId = modelId.replace("google-", "google/");
    } else if (modelId.startsWith("deepseek-")) {
      normalizedId = modelId.replace("deepseek-", "deepseek/");
    } else if (modelId.startsWith("mistral-")) {
      normalizedId = modelId.replace("mistral-", "mistral/");
    } else if (modelId.startsWith("xai-")) {
      normalizedId = modelId.replace("xai-", "xai/");
    } else if (modelId.startsWith("groq-")) {
      normalizedId = modelId.replace("groq-", "groq/");
    } else if (modelId.startsWith("cerebras-")) {
      normalizedId = modelId.replace("cerebras-", "cerebras/");
    }
  }
  
  const config = getModelConfig(normalizedId);
  return config.idealFor.join(", ");
}

/**
 * Check if a model supports a specific feature
 */
export function modelSupportsFeature(
  modelId: string,
  feature: keyof Pick<
    ModelConfig,
    | "supportsVision"
    | "supportsToolCalling"
    | "supportsReasoning"
    | "supportsImageGeneration"
  >
): boolean {
  const config = getModelConfig(modelId);
  return config[feature];
}

