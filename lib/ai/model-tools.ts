/**
 * Defines which tools are available for each model
 */

export type ModelTool =
  | "weather"
  | "documents"
  | "suggestions"
  | "images"
  | "analysis";

export type ModelToolsConfig = {
  modelId: string;
  availableTools: ModelTool[];
  supportsTools: boolean;
};

/**
 * Get available tools for a given model
 * Note: This shows potential tools. Actual availability (e.g., images requiring OpenAI key)
 * is checked server-side in the API route.
 */
export function getModelTools(modelId: string): ModelTool[] {
  // Reasoning models don't support tools
  if (modelId === "chat-model-reasoning" || modelId.includes("reasoner")) {
    return [];
  }

  // All non-reasoning models can potentially use all tools
  // The server will handle actual availability (e.g., OpenAI API key for images)
  return ["weather", "documents", "suggestions", "analysis", "images"];
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
