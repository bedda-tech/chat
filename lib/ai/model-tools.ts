/**
 * Defines which tools are available for each model
 */

import {
  CloudSun,
  FileText,
  Lightbulb,
  Image as ImageIcon,
  BarChart3,
  Database,
  Mic,
  Hash,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ModelTool =
  | "weather"
  | "documents"
  | "suggestions"
  | "images"
  | "analysis"
  | "structured-data"
  | "audio-transcription"
  | "embeddings"
  | "similarity";

export type ModelToolsConfig = {
  modelId: string;
  availableTools: ModelTool[];
  supportsTools: boolean;
};

/**
 * Get available tools for a given model
 * Note: Image generation is only supported by Google Gemini 2.5 models currently
 */
export function getModelTools(modelId: string): ModelTool[] {
  // Reasoning models don't support tools
  if (modelId === "chat-model-reasoning" || modelId.includes("reasoner")) {
    return [];
  }

  const baseTools: ModelTool[] = [
    "weather",
    "documents",
    "suggestions",
    "analysis",
    "structured-data",
    "audio-transcription",
    "embeddings",
    "similarity",
  ];

  // Only Google Gemini 2.5 models support image generation
  const supportsImageGeneration =
    modelId.includes("gemini-2.5") || modelId.includes("google-gemini-2.5");

  if (supportsImageGeneration) {
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
    "structured-data": "Structured Data",
    "audio-transcription": "Audio",
    embeddings: "Embeddings",
    similarity: "Similarity",
  };
  return names[tool];
}

/**
 * Get icon for a tool
 */
export function getToolIcon(tool: ModelTool): LucideIcon {
  const icons: Record<ModelTool, LucideIcon> = {
    weather: CloudSun,
    documents: FileText,
    suggestions: Lightbulb,
    images: ImageIcon,
    analysis: BarChart3,
    "structured-data": Database,
    "audio-transcription": Mic,
    embeddings: Hash,
    similarity: Search,
  };
  return icons[tool];
}
