import modelsData from "./models-data.json";

export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

// Import models from centralized JSON and map to ChatModel format
export const chatModels: ChatModel[] = [
  ...modelsData.models.map((model) => ({
    id: model.id,
    name: model.name,
    description: model.description,
  })),
  // Legacy/Default Models (keeping for backward compatibility)
  {
    id: "chat-model",
    name: "Grok Vision (Default)",
    description: "Advanced multimodal model with vision and text capabilities",
  },
  {
    id: "chat-model-reasoning",
    name: "Grok Reasoning (Default)",
    description: "Uses advanced chain-of-thought reasoning for complex problems",
  },
];
