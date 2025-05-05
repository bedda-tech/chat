import { experimental_generateImage as generateImage, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export const generateImageTool = () =>
  tool({
    description:
      "Generate an image based on a detailed text prompt. Use this when the user explicitly asks to create, generate, draw, or make an image, picture, photo, or illustration.",
    parameters: z.object({
      prompt: z
        .string()
        .describe(
          "A detailed, descriptive prompt for the image. Be specific about style, composition, colors, mood, and subjects."
        ),
      size: z
        .enum(["1024x1024", "1792x1024", "1024x1792"])
        .optional()
        .default("1024x1024")
        .describe(
          "Image size: 1024x1024 (square), 1792x1024 (landscape), or 1024x1792 (portrait)"
        ),
    }),
    execute: async ({ prompt, size = "1024x1024" }) => {
      try {
        const { image } = await generateImage({
          model: openai.imageModel("dall-e-3"),
          prompt,
          size,
          n: 1,
          quality: "standard",
        });

        return {
          success: true,
          image: {
            base64: image.base64,
            mediaType: "image/png",
          },
          prompt,
          size,
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

