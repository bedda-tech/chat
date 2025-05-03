import { generateObject, tool } from "ai";
import { z } from "zod";
import { myProvider } from "@/lib/ai/providers";

/**
 * Tool for generating structured data objects
 * Uses AI SDK's generateObject for guaranteed schema compliance
 */
export const generateStructuredDataTool = () =>
  tool({
    description:
      "Generate structured data in JSON format based on a schema. Use this when the user needs data in a specific format like API responses, configuration files, or structured reports.",
    inputSchema: z.object({
      dataType: z
        .enum([
          "user-profile",
          "api-response",
          "config-file",
          "test-data",
          "mock-data",
          "report",
        ])
        .describe("The type of structured data to generate"),
      description: z
        .string()
        .describe(
          "Detailed description of what data to generate, including any specific requirements or fields needed"
        ),
      count: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .default(1)
        .describe("Number of items to generate (for arrays)"),
    }),
    execute: async ({ dataType, description, count = 1 }) => {
      try {
        // Define schema based on data type
        let schema: z.ZodType;
        
        switch (dataType) {
          case "user-profile":
            schema = z.object({
              id: z.string(),
              name: z.string(),
              email: z.string().email(),
              age: z.number().optional(),
              bio: z.string().optional(),
              location: z.string().optional(),
              interests: z.array(z.string()).optional(),
            });
            break;
            
          case "api-response":
            schema = z.object({
              status: z.enum(["success", "error"]),
              data: z.any().optional(),
              message: z.string().optional(),
              timestamp: z.string(),
            });
            break;
            
          case "config-file":
            schema = z.record(z.any());
            break;
            
          case "test-data":
          case "mock-data":
            schema = z.object({
              id: z.string(),
              type: z.string(),
              attributes: z.record(z.any()),
            });
            break;
            
          case "report":
            schema = z.object({
              title: z.string(),
              summary: z.string(),
              sections: z.array(
                z.object({
                  heading: z.string(),
                  content: z.string(),
                  data: z.any().optional(),
                })
              ),
              generatedAt: z.string(),
            });
            break;
            
          default:
            schema = z.record(z.any());
        }

        // Wrap in array if count > 1
        const finalSchema = count > 1 ? z.array(schema) : schema;

        // Use generateObject for guaranteed schema compliance
        const { object } = await generateObject({
          model: myProvider.languageModel("openai-gpt-5"),
          schema: finalSchema,
          prompt: `Generate ${count} ${dataType} item(s) based on this description: ${description}`,
        });

        return {
          success: true,
          dataType,
          count,
          data: object,
          schema: dataType,
        };
      } catch (error) {
        console.error("Structured data generation error:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate structured data. Please try with a different description.",
        };
      }
    },
  });

