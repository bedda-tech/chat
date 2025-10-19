import modelsData from "./models-data.json";

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
  // First, try to find the model in our JSON data
  const modelData = modelsData.models.find(
    (m) => m.id === modelId || m.gatewayId === modelId
  );

  if (modelData) {
    return {
      maxSteps: modelData.config.maxSteps,
      temperature: modelData.config.temperature,
      supportsVision: modelData.capabilities.vision,
      supportsToolCalling: modelData.capabilities.toolCalling,
      supportsReasoning: modelData.capabilities.reasoning,
      supportsImageGeneration: modelData.capabilities.imageGeneration,
      idealFor: modelData.config.idealFor,
    };
  }

  // Fallback to pattern matching for legacy models and edge cases
  // Claude Sonnet 4.5 and 4
  if (modelId.includes("sonnet-4.5") || modelId.includes("sonnet-4")) {
    return {
      maxSteps: 8,
      temperature: 0.7,
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: true, // Extended thinking capability
      supportsImageGeneration: false,
      idealFor: ["complex reasoning", "extended thinking", "analysis", "research"],
    };
  }

  // Claude 3.7 Sonnet
  if (modelId.includes("3.7-sonnet")) {
    return {
      maxSteps: 8,
      temperature: 0.7,
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: true, // Extended thinking capability
      supportsImageGeneration: false,
      idealFor: ["complex reasoning", "extended thinking", "analysis", "research"],
    };
  }

  // Claude Haiku 4.5
  if (modelId.includes("haiku-4.5")) {
    return {
      maxSteps: 6,
      temperature: 0.6,
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: false,
      supportsImageGeneration: false,
      idealFor: ["fast responses", "high throughput", "efficient processing"],
    };
  }

  // Claude 3.5 Haiku
  if (modelId.includes("3.5-haiku")) {
    return {
      maxSteps: 5,
      temperature: 0.6,
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: false,
      supportsImageGeneration: false,
      idealFor: ["fast responses", "everyday tasks", "efficient processing"],
    };
  }

  // Claude 3 Haiku
  if (modelId.includes("3-haiku")) {
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

  // GPT-5 models
  if (modelId.includes("gpt-5")) {
    if (modelId.includes("nano")) {
      return {
        maxSteps: 4,
        temperature: 0.7,
        supportsVision: false,
        supportsToolCalling: true,
        supportsReasoning: false,
        supportsImageGeneration: false,
        idealFor: ["ultra-fast responses", "simple tasks", "high throughput"],
      };
    }
    if (modelId.includes("mini")) {
      return {
        maxSteps: 6,
        temperature: 0.7,
        supportsVision: true,
        supportsToolCalling: true,
        supportsReasoning: false,
        supportsImageGeneration: false,
        idealFor: ["efficient processing", "everyday tasks", "balanced performance"],
      };
    }
    return {
      maxSteps: 8,
      temperature: 0.7,
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: true,
      supportsImageGeneration: false,
      idealFor: ["complex tasks", "advanced reasoning", "multimodal"],
    };
  }

  // GPT-4.1 models
  if (modelId.includes("gpt-4.1")) {
    if (modelId.includes("mini")) {
      return {
        maxSteps: 5,
        temperature: 0.7,
        supportsVision: true,
        supportsToolCalling: true,
        supportsReasoning: false,
        supportsImageGeneration: false,
        idealFor: ["efficient processing", "everyday tasks", "multimodal"],
      };
    }
    return {
      maxSteps: 7,
      temperature: 0.7,
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: false,
      supportsImageGeneration: false,
      idealFor: ["multimodal tasks", "vision", "structured outputs"],
    };
  }

  // GPT-4o models
  if (modelId.includes("gpt-4o")) {
    return {
      maxSteps: 7,
      temperature: 0.7,
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: false,
      supportsImageGeneration: false,
      idealFor: ["multimodal tasks", "vision", "structured outputs", "function calling"],
    };
  }

  // Gemini 2.5 Flash Image Preview
  if (modelId.includes("flash-image-preview")) {
    return {
      maxSteps: 5,
      temperature: 0.9,
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: false,
      supportsImageGeneration: true,
      idealFor: ["image generation", "multimodal", "visual content creation"],
    };
  }

  // Gemini 2.5 Pro
  if (modelId.includes("2.5-pro")) {
    return {
      maxSteps: 7,
      temperature: 0.7,
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: true,
      supportsImageGeneration: false,
      idealFor: ["advanced reasoning", "complex tasks", "multimodal"],
    };
  }

  // Gemini 2.5 Flash
  if (modelId.includes("2.5-flash")) {
    return {
      maxSteps: 6,
      temperature: 0.7,
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: true,
      supportsImageGeneration: false,
      idealFor: ["fast responses", "Google Search grounding", "multimodal"],
    };
  }

  // Gemini 2.0 Flash
  if (modelId.includes("2.0-flash")) {
    return {
      maxSteps: 6,
      temperature: 0.7,
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: true,
      supportsImageGeneration: false,
      idealFor: ["fast responses", "thinking capabilities", "multimodal"],
    };
  }

  // Grok 4 models
  if (modelId.includes("grok-4")) {
    if (modelId.includes("fast-reasoning")) {
      return {
        maxSteps: 7,
        temperature: 0.7,
        supportsVision: false,
        supportsToolCalling: true,
        supportsReasoning: true,
        supportsImageGeneration: false,
        idealFor: ["fast reasoning", "chain-of-thought", "analysis"],
      };
    }
    if (modelId.includes("fast-non-reasoning")) {
      return {
        maxSteps: 5,
        temperature: 0.7,
        supportsVision: false,
        supportsToolCalling: true,
        supportsReasoning: false,
        supportsImageGeneration: false,
        idealFor: ["fast responses", "conversational", "general purpose"],
      };
    }
    if (modelId.includes("code-fast")) {
      return {
        maxSteps: 6,
        temperature: 0.3,
        supportsVision: false,
        supportsToolCalling: true,
        supportsReasoning: false,
        supportsImageGeneration: false,
        idealFor: ["code generation", "programming", "fast coding"],
      };
    }
    return {
      maxSteps: 7,
      temperature: 0.7,
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: true,
      supportsImageGeneration: false,
      idealFor: ["advanced reasoning", "complex tasks", "multimodal"],
    };
  }

  // DeepSeek V3 models
  if (modelId.includes("deepseek-v3")) {
    return {
      maxSteps: 7,
      temperature: 0.7,
      supportsVision: false,
      supportsToolCalling: true,
      supportsReasoning: true,
      supportsImageGeneration: false,
      idealFor: ["complex reasoning", "STEM", "coding", "analysis"],
    };
  }

  // Kimi K2 Turbo
  if (modelId.includes("kimi-k2")) {
    return {
      maxSteps: 6,
      temperature: 0.7,
      supportsVision: false,
      supportsToolCalling: true,
      supportsReasoning: false,
      supportsImageGeneration: false,
      idealFor: ["fast responses", "general purpose", "efficient processing"],
    };
  }

  // GLM 4.6
  if (modelId.includes("glm-4.6")) {
    return {
      maxSteps: 6,
      temperature: 0.7,
      supportsVision: false,
      supportsToolCalling: true,
      supportsReasoning: false,
      supportsImageGeneration: false,
      idealFor: ["general purpose", "Chinese language", "multimodal"],
    };
  }

  // GPT OSS 120B
  if (modelId.includes("gpt-oss")) {
    return {
      maxSteps: 5,
      temperature: 0.7,
      supportsVision: false,
      supportsToolCalling: true,
      supportsReasoning: false,
      supportsImageGeneration: false,
      idealFor: ["web search", "browser integration", "open source"],
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
 * Accepts both internal model ID (e.g., "openai-gpt-5") and gateway model ID (e.g., "openai/gpt-5")
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
    } else if (modelId.startsWith("xai-")) {
      normalizedId = modelId.replace("xai-", "xai/");
    } else if (modelId.startsWith("moonshotai-")) {
      normalizedId = modelId.replace("moonshotai-", "moonshotai/");
    } else if (modelId.startsWith("zai-")) {
      normalizedId = modelId.replace("zai-", "zai/");
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
