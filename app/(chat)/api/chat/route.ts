import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { unstable_cache as cache } from "next/cache";
import { after } from "next/server";
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from "resumable-stream";
import type { ModelCatalog } from "tokenlens/core";
import { fetchModels } from "tokenlens/fetch";
import { getUsage } from "tokenlens/helpers";
import { auth, type UserType } from "@/app/(auth)/auth";
import type { VisibilityType } from "@/components/visibility-selector";
import { buildGatewayConfig, getThinkingBudget } from "@/lib/ai/gateway-config";
import { getModelConfig } from "@/lib/ai/model-config";
import type { ChatModel } from "@/lib/ai/models";
import { type RequestHints, getCacheableSystemPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { analyzeDataTool } from "@/lib/ai/tools/analyze-data";
import { createDocument } from "@/lib/ai/tools/create-document";
import { generateImageTool } from "@/lib/ai/tools/generate-image";
import { generateStructuredDataTool } from "@/lib/ai/tools/generate-structured-data";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import {
  compareTextSimilarityTool,
  generateTextEmbeddingsTool,
} from "@/lib/ai/tools/text-embeddings";
import { transcribeAudioTool } from "@/lib/ai/tools/transcribe-audio";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatLastContextById,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import {
  createRateLimitResponse,
  rateLimitMiddleware,
} from "@/lib/middleware/rate-limit";
import type { ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { recordUsage } from "@/lib/usage/tracking";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

const getTokenlensCatalog = cache(
  async (): Promise<ModelCatalog | undefined> => {
    try {
      return await fetchModels();
    } catch (err) {
      console.warn(
        "TokenLens: catalog fetch failed, using default catalog",
        err
      );
      return; // tokenlens helpers will fall back to defaultCatalog
    }
  },
  ["tokenlens-catalog"],
  { revalidate: 24 * 60 * 60 } // 24 hours
);

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes("REDIS_URL")) {
        console.log(
          " > Resumable streams are disabled due to missing REDIS_URL"
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel["id"];
      selectedVisibilityType: VisibilityType;
    } = requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    // Check rate limits (new tier-based system)
    const rateLimitResult = await rateLimitMiddleware(session.user.id);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    const _userType: UserType = session.user.type;

    const chat = await getChatById({ id });

    if (chat) {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
    } else {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: "user",
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    let finalMergedUsage: AppUsage | undefined;

    // Build active tools list based on model capabilities
    // All tools go through Vercel AI Gateway which handles provider credentials
    const isGemini25FlashImage =
      selectedChatModel === "google-gemini-2.5-flash-image-preview";

    const allTools = [
      "getWeather",
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "analyzeData",
      "generateStructuredData",
      "transcribeAudio",
      "generateTextEmbeddings",
      "compareTextSimilarity",
    ];

    // Gemini 2.5 Flash Image does NOT support function calling at all
    // It generates images via responseModalities in the model response itself
    const activeTools =
      selectedChatModel === "chat-model-reasoning" || isGemini25FlashImage
        ? []
        : [...allTools, "generateImage"];

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        // Build tools object - all tools use Vercel AI Gateway
        const tools: Record<string, any> = {
          getWeather,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({
            session,
            dataStream,
          }),
          analyzeData: analyzeDataTool(),
          generateImage: generateImageTool(),
          generateStructuredData: generateStructuredDataTool(),
          transcribeAudio: transcribeAudioTool(),
          generateTextEmbeddings: generateTextEmbeddingsTool(),
          compareTextSimilarity: compareTextSimilarityTool(),
        };

        // Get the actual gateway model ID
        const gatewayModelId =
          myProvider.languageModel(selectedChatModel).modelId || "";

        // Get model-specific configuration
        const modelConfig = getModelConfig(gatewayModelId);

        // Build provider options with gateway config and fallback
        const gatewayConfig = buildGatewayConfig(gatewayModelId);
        const providerOptions: Record<string, any> = {
          gateway: gatewayConfig,
        };

        // Add image generation for Gemini 2.5 Flash Image
        if (isGemini25FlashImage) {
          providerOptions.google = {
            responseModalities: ["TEXT", "IMAGE"],
          };
        }

        // Add thinking budget for Anthropic models (helps control extended reasoning)
        const thinkingBudget = getThinkingBudget(gatewayModelId);
        if (thinkingBudget) {
          providerOptions.anthropic = {
            thinkingBudget,
          };
        }

        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: getCacheableSystemPrompt({
            selectedChatModel,
            requestHints,
          }),
          messages: convertToModelMessages(uiMessages),
          // Use model-specific maxSteps configuration
          stopWhen: stepCountIs(modelConfig.maxSteps),
          // Use model-specific temperature if available
          ...(modelConfig.temperature && {
            temperature: modelConfig.temperature,
          }),
          // Only pass tools if model supports them
          ...(activeTools.length > 0 && {
            experimental_activeTools: activeTools,
            tools,
          }),
          experimental_transform: smoothStream({ chunking: "word" }),
          providerOptions,
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
            metadata: {
              chatId: id,
              userId: session.user.id,
              selectedModel: selectedChatModel,
              visibilityType: selectedVisibilityType,
              toolsEnabled: selectedChatModel !== "chat-model-reasoning",
              imageGenerationEnabled: isGemini25FlashImage,
            },
          },
          onFinish: async ({ usage, response }) => {
            try {
              const providers = await getTokenlensCatalog();
              const modelId =
                myProvider.languageModel(selectedChatModel).modelId;

              // Extract provider metadata from response
              const providerMetadata =
                response.headers?.["x-vercel-ai-provider-metadata"];
              let gatewayMetadata: any = null;

              if (providerMetadata) {
                try {
                  const metadata = JSON.parse(providerMetadata);
                  gatewayMetadata = metadata.gateway;

                  // Log gateway routing and cost info for debugging
                  if (gatewayMetadata) {
                    console.log("AI Gateway Metadata:", {
                      cost: gatewayMetadata.cost,
                      routing: gatewayMetadata.routing,
                    });
                  }
                } catch (parseErr) {
                  console.warn("Failed to parse provider metadata", parseErr);
                }
              }

              if (!modelId) {
                finalMergedUsage = {
                  ...usage,
                  ...(gatewayMetadata?.cost && {
                    gatewayCost: gatewayMetadata.cost,
                  }),
                };
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
                return;
              }

              if (!providers) {
                finalMergedUsage = {
                  ...usage,
                  ...(gatewayMetadata?.cost && {
                    gatewayCost: gatewayMetadata.cost,
                  }),
                };
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
                return;
              }

              const summary = getUsage({ modelId, usage, providers });
              finalMergedUsage = {
                ...usage,
                ...summary,
                modelId,
                ...(gatewayMetadata?.cost && {
                  gatewayCost: gatewayMetadata.cost,
                }),
              } as AppUsage;
              dataStream.write({ type: "data-usage", data: finalMergedUsage });

              // Track usage in new analytics system
              try {
                // Extract cache information from AI SDK usage object
                // Anthropic models return cacheReadInputTokens, cacheCreationInputTokens
                // OpenAI models have automatic caching (no explicit fields)
                const cachedTokens = (usage as any).cacheReadInputTokens || 0;
                const cacheHit = cachedTokens > 0;

                await recordUsage({
                  userId: session.user.id,
                  modelId: selectedChatModel,
                  provider: selectedChatModel.split("-")[0] || "unknown",
                  sessionId: id,
                  inputTokens: usage.inputTokens || 0,
                  outputTokens: usage.outputTokens || 0,
                  cachedTokens,
                  latency: undefined, // TODO: Track latency
                  cacheHit,
                  toolsUsed: [],
                  success: true,
                });
              } catch (trackingErr) {
                console.error("Failed to record usage:", trackingErr);
                // Don't fail the request if tracking fails
              }
            } catch (err) {
              console.warn("TokenLens enrichment failed", err);
              finalMergedUsage = usage;
              dataStream.write({ type: "data-usage", data: finalMergedUsage });

              // Track failed request
              try {
                await recordUsage({
                  userId: session.user.id,
                  modelId: selectedChatModel,
                  provider: selectedChatModel.split("-")[0] || "unknown",
                  sessionId: id,
                  inputTokens: 0,
                  outputTokens: 0,
                  cachedTokens: 0,
                  success: false,
                  errorType: err instanceof Error ? err.name : "UnknownError",
                });
              } catch (trackingErr) {
                console.error("Failed to record failed usage:", trackingErr);
              }
            }
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        await saveMessages({
          messages: messages.map((currentMessage) => ({
            id: currentMessage.id,
            role: currentMessage.role,
            parts: currentMessage.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });

        if (finalMergedUsage) {
          try {
            await updateChatLastContextById({
              chatId: id,
              context: finalMergedUsage,
            });
          } catch (err) {
            console.warn("Unable to persist last usage for chat", id, err);
          }
        }
      },
      onError: () => "Oops, an error occurred!",
    });

    // Enable resumable streams if Redis is configured
    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream())
        )
      );
    }

    // Fallback to regular streaming if resumable streams are not available
    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    // Check for Vercel AI Gateway credit card error
    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
