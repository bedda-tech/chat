import { cosineSimilarity, embed, embedMany, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

/**
 * Text embedding tool for semantic search and similarity
 * Uses OpenAI's text-embedding-3-small model
 */
export const generateTextEmbeddingsTool = () =>
  tool({
    description:
      "Generate vector embeddings for text to enable semantic search, similarity comparison, and clustering. Useful for finding similar documents, grouping related content, or building search functionality.",
    inputSchema: z.object({
      texts: z
        .array(z.string())
        .min(1)
        .max(10)
        .describe(
          "Array of text strings to generate embeddings for (1-10 texts)"
        ),
      dimensions: z
        .number()
        .min(256)
        .max(1536)
        .optional()
        .describe(
          "Optional: reduce embedding dimensions (default: 1536). Smaller dimensions = faster but less precise."
        ),
    }),
    execute: async ({ texts, dimensions }) => {
      try {
        const embeddingModel = openai.textEmbeddingModel(
          "text-embedding-3-small"
        );

        if (texts.length === 1) {
          // Generate single embedding
          const { embedding, usage: embeddingUsage } = await embed({
            model: embeddingModel,
            value: texts[0],
            ...(dimensions && { dimensions }),
          });

          return {
            success: true,
            embeddings: [embedding],
            count: 1,
            dimensions: embedding.length,
            usage: embeddingUsage,
          };
        }

        // Generate multiple embeddings
        const { embeddings, usage } = await embedMany({
          model: embeddingModel,
          values: texts,
          ...(dimensions && { dimensions }),
        });

        return {
          success: true,
          embeddings,
          count: embeddings.length,
          dimensions: embeddings[0].length,
          usage,
        };
      } catch (error) {
        console.error("Text embedding error:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate embeddings. Please try again.",
        };
      }
    },
  });

/**
 * Similarity comparison tool
 * Compares texts using embeddings and cosine similarity
 */
export const compareTextSimilarityTool = () =>
  tool({
    description:
      "Compare semantic similarity between two or more texts using embeddings. Returns similarity scores from 0 (completely different) to 1 (identical). Useful for finding duplicate content, matching queries to documents, or clustering similar items.",
    inputSchema: z.object({
      texts: z
        .array(z.string())
        .min(2)
        .max(5)
        .describe(
          "Array of 2-5 text strings to compare for similarity"
        ),
      threshold: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .default(0.7)
        .describe(
          "Similarity threshold (0-1). Pairs above this threshold are considered similar. Default: 0.7"
        ),
    }),
    execute: async ({ texts, threshold = 0.7 }) => {
      try {
        const embeddingModel = openai.textEmbeddingModel(
          "text-embedding-3-small"
        );

        // Generate embeddings for all texts
        const { embeddings } = await embedMany({
          model: embeddingModel,
          values: texts,
        });

        // Calculate pairwise similarities
        const similarities: Array<{
          text1: string;
          text2: string;
          similarity: number;
          isSimilar: boolean;
        }> = [];

        for (let i = 0; i < embeddings.length; i++) {
          for (let j = i + 1; j < embeddings.length; j++) {
            const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
            similarities.push({
              text1: texts[i],
              text2: texts[j],
              similarity,
              isSimilar: similarity >= threshold,
            });
          }
        }

        // Sort by similarity (highest first)
        similarities.sort((a, b) => b.similarity - a.similarity);

        const mostSimilar = similarities[0];
        const leastSimilar = similarities.at(-1) || mostSimilar;

        return {
          success: true,
          comparisons: similarities,
          count: similarities.length,
          threshold,
          summary: {
            mostSimilarPair: {
              texts: [mostSimilar.text1, mostSimilar.text2],
              similarity: mostSimilar.similarity,
            },
            leastSimilarPair: {
              texts: [leastSimilar.text1, leastSimilar.text2],
              similarity: leastSimilar.similarity,
            },
            averageSimilarity:
              similarities.reduce((sum, s) => sum + s.similarity, 0) /
              similarities.length,
          },
        };
      } catch (error) {
        console.error("Similarity comparison error:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to compare text similarity. Please try again.",
        };
      }
    },
  });

