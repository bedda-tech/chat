import { experimental_transcribe as transcribe, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const WHITESPACE_REGEX = /\s+/;

/**
 * Audio transcription tool using OpenAI Whisper
 * Transcribes audio files to text
 */
export const transcribeAudioTool = () =>
  tool({
    description:
      "Transcribe audio or video files to text. Supports common formats like MP3, MP4, WAV, M4A, WebM. Use this when users upload audio/video files or request transcription.",
    parameters: z.object({
      audioUrl: z
        .string()
        .url()
        .describe("URL of the audio or video file to transcribe"),
      language: z
        .string()
        .optional()
        .describe(
          "Optional ISO 639-1 language code (e.g., 'en', 'es', 'fr') to improve accuracy"
        ),
    }),
    execute: async ({ audioUrl, language }) => {
      try {
        // Fetch the audio file
        const audioResponse = await fetch(audioUrl);
        
        if (!audioResponse.ok) {
          return {
            success: false,
            error: `Failed to fetch audio file: ${audioResponse.statusText}`,
          };
        }

        const audioBlob = await audioResponse.blob();
        const audioBuffer = await audioBlob.arrayBuffer();
        const audioUint8Array = new Uint8Array(audioBuffer);

        // Transcribe using OpenAI Whisper
        const { text: transcript } = await transcribe({
          model: openai.transcription("whisper-1"),
          audio: audioUint8Array,
          ...(language && { language }),
        });

        return {
          success: true,
          transcript,
          audioUrl,
          language: language || "auto-detected",
          wordCount: transcript.split(WHITESPACE_REGEX).length,
          duration: "Unknown", // Whisper doesn't return duration directly
        };
      } catch (error) {
        console.error("Audio transcription error:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to transcribe audio. Please ensure the file is a valid audio format.",
        };
      }
    },
  });

