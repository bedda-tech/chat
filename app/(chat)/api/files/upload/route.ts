import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";

// Supported file types for different use cases
const ALLOWED_FILE_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Audio (for transcription)
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/mp4",
  "audio/m4a",
  "audio/webm",
  "audio/ogg",
  // Video (for transcription)
  "video/mp4",
  "video/mpeg",
  "video/webm",
  // Documents (for analysis)
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB for audio/video files

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "File size should be less than 25MB",
    })
    .refine((file) => ALLOWED_FILE_TYPES.includes(file.type), {
      message: "File type not supported. Allowed types: images (JPEG, PNG, GIF, WebP, SVG), audio (MP3, WAV, M4A, WebM, OGG), video (MP4, WebM), documents (PDF, TXT, MD, CSV, JSON)",
    }),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.issues
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get("file") as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      const data = await put(`${filename}`, fileBuffer, {
        access: "public",
      });

      return NextResponse.json(data);
    } catch (_error) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
