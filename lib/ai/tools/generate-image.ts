import { experimental_generateImage as generateImage, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

/**
 * Image generation tool using Google Gemini 2.5 Flash Image
 * Routed through Vercel AI Gateway via GOOGLE_GENERATIVE_AI_API_KEY
 */
export const generateImageTool = () =>
  tool({
    description:
      "Generate an image based on a detailed text prompt. Use this when the user explicitly asks to create, generate, draw, or make an image, picture, photo, or illustration.",
    inputSchema: z.object({
      prompt: z
        .string()
        .describe(
          "A detailed, descriptive prompt for the image. Be specific about style, composition, colors, mood, and subjects."
        ),
      aspectRatio: z
        .enum(["1:1", "16:9", "9:16", "3:4", "4:3"])
        .optional()
        .default("1:1")
        .describe(
          "Image aspect ratio: 1:1 (square), 16:9 (landscape), 9:16 (portrait), 3:4 or 4:3"
        ),
    }),
    execute: async ({ prompt, aspectRatio = "1:1" }) => {
      try {
        const { image } = await generateImage({
          model: google.imageModel("gemini-2.5-flash-image"),
          prompt,
          aspectRatio,
        });

        return {
          success: true,
          image: {
            base64: image.base64,
            mediaType: "image/png",
          },
          prompt,
          aspectRatio,
          model: "gemini-2.5-flash-image",
        };
      } catch (error) {
        console.error("Image generation error:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate image. Please try a different prompt.",
        };
      }
    },
  });

