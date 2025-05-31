/**
 * AI SDK Middleware for logging, monitoring, and observability
 * Implements request/response logging for better debugging
 */

import type {
  LanguageModelV3Middleware,
  LanguageModelV3StreamPart,
} from "@ai-sdk/provider";

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

