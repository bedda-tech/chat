export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  // xAI Grok Models
  {
    id: "xai-grok-4",
    name: "Grok 4",
    description: "Most advanced xAI model with superior reasoning capabilities",
  },
  {
    id: "xai-grok-3",
    name: "Grok 3",
    description: "Advanced reasoning model with strong performance",
  },
  {
    id: "xai-grok-3-fast",
    name: "Grok 3 Fast",
    description: "Optimized version of Grok 3 for faster responses",
  },
  {
    id: "xai-grok-3-mini",
    name: "Grok 3 Mini",
    description: "Compact version of Grok 3 for efficient processing",
  },
  {
    id: "xai-grok-3-mini-fast",
    name: "Grok 3 Mini Fast",
    description: "Fastest variant of Grok 3 Mini",
  },
  {
    id: "xai-grok-2-1212",
    name: "Grok 2 (Dec 2024)",
    description: "Stable Grok 2 release with enhanced capabilities",
  },
  {
    id: "xai-grok-2-vision-1212",
    name: "Grok 2 Vision (Dec 2024)",
    description: "Multimodal model with vision and text capabilities",
  },
  {
    id: "xai-grok-beta",
    name: "Grok Beta",
    description: "Latest beta version with experimental features",
  },
  {
    id: "xai-grok-vision-beta",
    name: "Grok Vision Beta",
    description: "Beta multimodal model with vision capabilities",
  },

  // Vercel Models
  {
    id: "vercel-v0-1.0-md",
    name: "Vercel v0 1.0 MD",
    description: "Vercel's v0 model optimized for markdown generation",
  },

  // OpenAI Models
  {
    id: "openai-gpt-5",
    name: "GPT-5",
    description: "OpenAI's most advanced model with breakthrough capabilities",
  },
  {
    id: "openai-gpt-5-mini",
    name: "GPT-5 Mini",
    description: "Compact version of GPT-5 for efficient tasks",
  },
  {
    id: "openai-gpt-5-nano",
    name: "GPT-5 Nano",
    description: "Ultra-compact GPT-5 variant for lightweight tasks",
  },
  {
    id: "openai-gpt-5-codex",
    name: "GPT-5 Codex",
    description: "Specialized GPT-5 model optimized for code generation",
  },
  {
    id: "openai-gpt-5-chat-latest",
    name: "GPT-5 Chat Latest",
    description: "Latest GPT-5 model optimized for conversational AI",
  },

  // Anthropic Models
  {
    id: "anthropic-claude-opus-4-1",
    name: "Claude Opus 4.1",
    description: "Latest Claude Opus with enhanced reasoning and capabilities",
  },
  {
    id: "anthropic-claude-opus-4-0",
    name: "Claude Opus 4.0",
    description: "Most powerful Claude model for complex tasks",
  },
  {
    id: "anthropic-claude-sonnet-4-0",
    name: "Claude Sonnet 4.0",
    description: "Balanced Claude model for speed and intelligence",
  },
  {
    id: "anthropic-claude-3-7-sonnet-latest",
    name: "Claude 3.7 Sonnet Latest",
    description: "Latest Claude 3.7 Sonnet with improved performance",
  },
  {
    id: "anthropic-claude-3-5-haiku-latest",
    name: "Claude 3.5 Haiku Latest",
    description: "Fastest Claude model for quick responses",
  },

  // Mistral Models
  {
    id: "mistral-pixtral-large-latest",
    name: "Pixtral Large Latest",
    description: "Mistral's multimodal model with vision capabilities",
  },
  {
    id: "mistral-large-latest",
    name: "Mistral Large Latest",
    description: "Most powerful Mistral model for complex reasoning",
  },
  {
    id: "mistral-medium-latest",
    name: "Mistral Medium Latest",
    description: "Balanced Mistral model for general-purpose tasks",
  },
  {
    id: "mistral-medium-2505",
    name: "Mistral Medium (May 2025)",
    description: "Latest Mistral Medium release with improvements",
  },
  {
    id: "mistral-small-latest",
    name: "Mistral Small Latest",
    description: "Efficient Mistral model for faster responses",
  },
  {
    id: "mistral-pixtral-12b-2409",
    name: "Pixtral 12B",
    description: "Compact multimodal model with vision support",
  },

  // Google Generative AI Models
  {
    id: "google-gemini-2.5-flash-image",
    name: "Gemini 2.5 Flash Image ⭐",
    description: "Only model with image generation support! Multimodal model with text and image capabilities",
  },
  {
    id: "google-gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash Experimental",
    description: "Latest experimental Gemini model with enhanced speed",
  },
  {
    id: "google-gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    description: "Fast and efficient Gemini model for quick tasks",
  },
  {
    id: "google-gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    description: "Advanced Gemini model for complex reasoning",
  },

  // Google Vertex Models
  {
    id: "google-vertex-gemini-2.0-flash-exp",
    name: "Vertex Gemini 2.0 Flash Exp",
    description: "Gemini 2.0 Flash via Google Vertex AI",
  },
  {
    id: "google-vertex-gemini-1.5-flash",
    name: "Vertex Gemini 1.5 Flash",
    description: "Gemini 1.5 Flash via Google Vertex AI",
  },
  {
    id: "google-vertex-gemini-1.5-pro",
    name: "Vertex Gemini 1.5 Pro",
    description: "Gemini 1.5 Pro via Google Vertex AI",
  },

  // DeepSeek Models
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    description: "DeepSeek's conversational model for general chat",
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek Reasoner",
    description: "Advanced reasoning model with chain-of-thought capabilities",
  },

  // Cerebras Models
  {
    id: "cerebras-llama3.1-8b",
    name: "Cerebras Llama 3.1 8B",
    description: "Llama 3.1 8B optimized on Cerebras hardware",
  },
  {
    id: "cerebras-llama3.1-70b",
    name: "Cerebras Llama 3.1 70B",
    description: "Llama 3.1 70B optimized on Cerebras hardware",
  },
  {
    id: "cerebras-llama3.3-70b",
    name: "Cerebras Llama 3.3 70B",
    description: "Latest Llama 3.3 70B optimized on Cerebras hardware",
  },

  // Groq Models
  {
    id: "groq-llama-4-scout-17b-16e-instruct",
    name: "Groq Llama 4 Scout 17B",
    description: "Llama 4 Scout model optimized for Groq's hardware",
  },
  {
    id: "groq-llama-3.3-70b-versatile",
    name: "Groq Llama 3.3 70B Versatile",
    description: "Versatile Llama 3.3 70B on ultra-fast Groq hardware",
  },
  {
    id: "groq-llama-3.1-8b-instant",
    name: "Groq Llama 3.1 8B Instant",
    description: "Lightning-fast Llama 3.1 8B on Groq hardware",
  },
  {
    id: "groq-mixtral-8x7b-32768",
    name: "Groq Mixtral 8x7B",
    description: "Mixtral 8x7B with 32K context on Groq hardware",
  },
  {
    id: "groq-gemma2-9b-it",
    name: "Groq Gemma 2 9B IT",
    description: "Gemma 2 9B instruction-tuned on Groq hardware",
  },

  // Legacy/Default Models (keeping for backward compatibility)
  {
    id: "chat-model",
    name: "Grok Vision (Default)",
    description: "Advanced multimodal model with vision and text capabilities",
  },
  {
    id: "chat-model-reasoning",
    name: "Grok Reasoning (Default)",
    description:
      "Uses advanced chain-of-thought reasoning for complex problems",
  },
];
