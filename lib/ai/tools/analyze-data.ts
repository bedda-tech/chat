import { generateObject, tool } from "ai";
import { z } from "zod";
import { myProvider } from "../providers";

/**
 * Tool for analyzing data and returning structured insights
 * Uses generateObject from AI SDK for structured data generation
 */
export const analyzeDataTool = () =>
  tool({
    description:
      "Analyze data, text, or information and provide structured insights. Use this when users want to analyze trends, extract insights, or get structured analysis of information.",
    inputSchema: z.object({
      data: z.string().describe("The data or text to analyze"),
      analysisType: z
        .enum(["sentiment", "summary", "trends", "key-points", "statistics"])
        .describe("Type of analysis to perform"),
      context: z
        .string()
        .optional()
        .describe("Additional context for the analysis"),
    }),
    execute: async ({ data, analysisType, context }) => {
      try {
        const schema = z.object({
          analysisType: z.string(),
          findings: z.array(
            z.object({
              title: z.string(),
              description: z.string(),
              confidence: z.number().min(0).max(100),
            })
          ),
          summary: z.string(),
          recommendations: z.array(z.string()).optional(),
          metadata: z.object({
            dataLength: z.number(),
            processingTime: z.string(),
          }),
        });

        const startTime = Date.now();

        const { object } = await generateObject({
          model: myProvider.languageModel("xai-grok-4"),
          schema,
          prompt: `Analyze the following ${analysisType} of this data:

Data: ${data}

${context ? `Context: ${context}` : ""}

Provide structured insights with:
- Key findings with confidence levels (0-100)
- A comprehensive summary
- Actionable recommendations (if applicable)`,
        });

        const processingTime = `${Date.now() - startTime}ms`;

        return {
          success: true,
          analysis: {
            ...object,
            metadata: {
              dataLength: data.length,
              processingTime,
            },
          },
        };
      } catch (error) {
        console.error("Data analysis error:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to analyze data. Please try again.",
        };
      }
    },
  });

