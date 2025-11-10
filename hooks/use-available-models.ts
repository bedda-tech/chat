/**
 * Client-Side Hook: Use Available Models
 * Fetches and caches available AI models with SWR
 */

import useSWR from "swr";

interface Model {
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

interface ModelsResponse {
  models: Model[];
  lastUpdated: string;
  cached: boolean;
  cacheAge?: number;
  fallback?: boolean;
  error?: string;
}

const fetcher = async (url: string): Promise<ModelsResponse> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Hook to fetch and cache available models
 *
 * @param enabled - Whether to enable fetching (default: true)
 * @returns Models data with loading, error, and refresh states
 */
export function useAvailableModels(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<ModelsResponse>(
    enabled ? "/api/models" : null,
    fetcher,
    {
      // Cache for 1 hour
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 3600000, // 1 hour in milliseconds
      // Keep previous data while revalidating
      keepPreviousData: true,
      // Deduplicate requests within 2 seconds
      dedupingInterval: 2000,
      // Retry on error with exponential backoff
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      // Fallback to empty array if data is undefined
      fallbackData: undefined,
    }
  );

  // Manual refresh function
  const refresh = async () => {
    try {
      const response = await fetch("/api/models?refresh=true");
      const newData = await response.json();
      mutate(newData, false); // Update without revalidation
      return newData;
    } catch (err) {
      console.error("Failed to refresh models:", err);
      throw err;
    }
  };

  return {
    models: data?.models || [],
    isLoading,
    error,
    isFallback: data?.fallback || false,
    lastUpdated: data?.lastUpdated,
    cacheAge: data?.cacheAge,
    cached: data?.cached || false,
    refresh,
    mutate,
  };
}

/**
 * Hook to get a specific model by ID
 */
export function useModel(modelId: string) {
  const { models, isLoading, error } = useAvailableModels();

  const model = models.find((m) => m.id === modelId || m.gatewayId === modelId);

  return {
    model,
    isLoading,
    error,
    notFound: !isLoading && !error && !model,
  };
}

/**
 * Hook to get models filtered by provider
 */
export function useModelsByProvider(provider: string) {
  const { models, isLoading, error, ...rest } = useAvailableModels();

  const filteredModels = models.filter((m) => m.provider === provider);

  return {
    models: filteredModels,
    isLoading,
    error,
    ...rest,
  };
}

/**
 * Hook to get models filtered by capability
 */
export function useModelsByCapability(
  capability: keyof Model["capabilities"]
) {
  const { models, isLoading, error, ...rest } = useAvailableModels();

  const filteredModels = models.filter((m) => m.capabilities[capability]);

  return {
    models: filteredModels,
    isLoading,
    error,
    ...rest,
  };
}
