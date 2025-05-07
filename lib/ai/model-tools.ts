/**
 * Defines which tools are available for each model
 */

export type ModelTool = "weather" | "documents" | "suggestions" | "images" | "analysis";

export type ModelToolsConfig = {
  modelId: string;
  availableTools: ModelTool[];
  supportsTools: boolean;
};

const hasOpenAIKey = typeof window === "undefined" 
  ? Boolean(process.env.OPENAI_API_KEY)
  : false;

/**
 * Get available tools for a given model
 */
export function getModelTools(modelId: string): ModelTool[] {
  // Reasoning models don't support tools
  if (modelId === "chat-model-reasoning" || modelId.includes("reasoner")) {
    return [];
  }

  const baseTools: ModelTool[] = ["weather", "documents", "suggestions", "analysis"];
  
  // Add image generation if OpenAI key is available
  if (hasOpenAIKey) {
    return [...baseTools, "images"];
  }
  
  return baseTools;
}

/**
 * Check if a model supports tools at all
 */
export function modelSupportsTools(modelId: string): boolean {
  return getModelTools(modelId).length > 0;
}

/**
 * Get display name for a tool
 */
export function getToolDisplayName(tool: ModelTool): string {
  const names: Record<ModelTool, string> = {
    weather: "Weather",
    documents: "Documents",
    suggestions: "Suggestions",
    images: "Images",
    analysis: "Analysis",
  };
  return names[tool];
}

/**
 * Get icon/emoji for a tool
 */
export function getToolIcon(tool: ModelTool): string {
  const icons: Record<ModelTool, string> = {
    weather: "🌤️",
    documents: "📄",
    suggestions: "💡",
    images: "🖼️",
    analysis: "📊",
  };
  return icons[tool];
}

