/**
 * AI SDK Middleware for logging, monitoring, observability, and caching
 * Implements request/response logging for better debugging and caching for cost reduction
 */

import type {
  LanguageModelV3Middleware,
  LanguageModelV3StreamPart,
} from "@ai-sdk/provider";
import { simulateReadableStream } from "ai";

/**
 * Logging middleware for AI SDK language model calls
 * Logs parameters and generated text for both generate and stream operations
 */
export const loggingMiddleware: LanguageModelV3Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    const startTime = Date.now();
    
    console.log("[AI SDK] Generate request started", {
      modelId: params.modelId,
      mode: params.mode.type,
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await doGenerate();
      const duration = Date.now() - startTime;

      console.log("[AI SDK] Generate request completed", {
        modelId: params.modelId,
        duration: `${duration}ms`,
        textLength: result.text?.length || 0,
        finishReason: result.finishReason,
        usage: result.usage,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error("[AI SDK] Generate request failed", {
        modelId: params.modelId,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      
      throw error;
    }
  },

  wrapStream: async ({ doStream, params }) => {
    const startTime = Date.now();
    
    console.log("[AI SDK] Stream request started", {
      modelId: params.modelId,
      mode: params.mode.type,
      timestamp: new Date().toISOString(),
    });

    try {
      const { stream, ...rest } = await doStream();

      let generatedText = "";
      let chunkCount = 0;
      const textBlocks = new Map<string, string>();

      const transformStream = new TransformStream<
        LanguageModelV3StreamPart,
        LanguageModelV3StreamPart
      >({
        transform(chunk, controller) {
          chunkCount++;
          
          switch (chunk.type) {
            case "text-start": {
              textBlocks.set(chunk.id, "");
              break;
            }
            case "text-delta": {
              const existing = textBlocks.get(chunk.id) || "";
              textBlocks.set(chunk.id, existing + chunk.delta);
              generatedText += chunk.delta;
              break;
            }
            case "text-end": {
              console.log("[AI SDK] Text block completed", {
                blockId: chunk.id,
                length: textBlocks.get(chunk.id)?.length || 0,
              });
              break;
            }
            case "tool-call": {
              console.log("[AI SDK] Tool called", {
                toolName: chunk.toolName,
                toolCallId: chunk.toolCallId,
              });
              break;
            }
            case "tool-result": {
              console.log("[AI SDK] Tool result received", {
                toolName: chunk.toolName,
                toolCallId: chunk.toolCallId,
              });
              break;
            }
            default: {
              // Handle other chunk types silently
              break;
            }
          }

          controller.enqueue(chunk);
        },

        flush() {
          const duration = Date.now() - startTime;
          
          console.log("[AI SDK] Stream request completed", {
            modelId: params.modelId,
            duration: `${duration}ms`,
            textLength: generatedText.length,
            chunkCount,
            textBlocks: textBlocks.size,
          });
        },
      });

      return {
        stream: stream.pipeThrough(transformStream),
        ...rest,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error("[AI SDK] Stream request failed", {
        modelId: params.modelId,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      
      throw error;
    }
  },
};

/**
 * Performance monitoring middleware
 * Tracks timing and usage statistics
 */
export const performanceMiddleware: LanguageModelV3Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    const startTime = performance.now();
    const result = await doGenerate();
    const duration = performance.now() - startTime;

    console.log("[AI Performance]", {
      operation: "generate",
      modelId: params.modelId,
      duration: `${duration.toFixed(2)}ms`,
      usage: result.usage,
    });

    return result;
  },

  wrapStream: async ({ doStream, params }) => {
    const startTime = performance.now();
    const { stream, ...rest } = await doStream();

    const transformStream = new TransformStream<
      LanguageModelV3StreamPart,
      LanguageModelV3StreamPart
    >({
      flush() {
        const duration = performance.now() - startTime;
        console.log("[AI Performance]", {
          operation: "stream",
          modelId: params.modelId,
          duration: `${duration.toFixed(2)}ms`,
        });
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
};

/**
 * In-memory caching middleware for AI SDK
 * Caches responses to reduce API calls and costs
 * Note: For production, consider using Redis or another persistent cache
 */
const memoryCache = new Map<string, any>();
const CACHE_TTL_MS = 3_600_000; // 1 hour

export const cachingMiddleware: LanguageModelV3Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    // Create cache key from params (excluding timestamp and other dynamic fields)
    const cacheKey = JSON.stringify({
      modelId: params.modelId,
      prompt: params.prompt,
      mode: params.mode,
    });

    const cached = memoryCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log("[AI Cache] Cache hit for generate");
      return {
        ...cached.result,
        response: {
          ...cached.result.response,
          timestamp: cached.result.response?.timestamp
            ? new Date(cached.result.response.timestamp)
            : undefined,
        },
      };
    }

    console.log("[AI Cache] Cache miss for generate");
    const result = await doGenerate();

    // Store in cache with timestamp
    memoryCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    return result;
  },

  wrapStream: async ({ doStream, params }) => {
    const cacheKey = JSON.stringify({
      modelId: params.modelId,
      prompt: params.prompt,
      mode: params.mode,
    });

    const cached = memoryCache.get(cacheKey);

    // If cached and not expired, simulate the stream
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log("[AI Cache] Cache hit for stream");

      const formattedChunks = (cached.chunks as LanguageModelV3StreamPart[]).map(
        (p) => {
          if (p.type === "response-metadata" && p.timestamp) {
            return { ...p, timestamp: new Date(p.timestamp) };
          }
          return p;
        }
      );

      return {
        stream: simulateReadableStream({
          initialDelayInMs: 0,
          chunkDelayInMs: 10,
          chunks: formattedChunks,
        }),
      };
    }

    console.log("[AI Cache] Cache miss for stream");
    const { stream, ...rest } = await doStream();

    const fullResponse: LanguageModelV3StreamPart[] = [];

    const transformStream = new TransformStream<
      LanguageModelV3StreamPart,
      LanguageModelV3StreamPart
    >({
      transform(chunk, controller) {
        fullResponse.push(chunk);
        controller.enqueue(chunk);
      },
      flush() {
        // Store the full response in cache
        memoryCache.set(cacheKey, {
          chunks: fullResponse,
          timestamp: Date.now(),
        });
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
};

/**
 * Clear the in-memory cache
 * Useful for testing or when memory needs to be freed
 */
export function clearCache(): void {
  memoryCache.clear();
  console.log("[AI Cache] Cache cleared");
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ key: string; age: number }>;
} {
  const entries = Array.from(memoryCache.entries()).map(([key, value]) => ({
    key: key.slice(0, 100), // Truncate key for readability
    age: Date.now() - value.timestamp,
  }));

  return {
    size: memoryCache.size,
    entries,
  };
}

