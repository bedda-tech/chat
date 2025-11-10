/**
 * API Route: Dynamic Model Discovery
 * Fetches available models from AI Gateway with caching
 */

import { NextResponse } from "next/server";
import { getAvailableModels, getCacheStatus } from "@/lib/ai/models-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // Disable Next.js caching, we handle it ourselves

/**
 * GET /api/models
 * Returns list of available AI models from AI Gateway
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const models = await getAvailableModels(forceRefresh);
    const cacheStatus = getCacheStatus();

    return NextResponse.json(
      {
        models,
        lastUpdated: new Date().toISOString(),
        cached: cacheStatus.cached,
        cacheAge: cacheStatus.age,
        fallback: false,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=3600", // Client-side cache for 1 hour
        },
      }
    );
  } catch (error) {
    console.error("❌ Error in /api/models:", error);

    // Attempt to return fallback models
    try {
      const models = await getAvailableModels(false);

      return NextResponse.json(
        {
          models,
          lastUpdated: new Date().toISOString(),
          cached: true,
          fallback: true,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        {
          status: 200, // Still return 200 with fallback data
          headers: {
            "Cache-Control": "private, max-age=600", // Shorter cache for fallback (10 min)
          },
        }
      );
    } catch (fallbackError) {
      // Complete failure
      return NextResponse.json(
        {
          error: "Failed to fetch models",
          message:
            error instanceof Error
              ? error.message
              : "Unknown error occurred",
        },
        { status: 500 }
      );
    }
  }
}

/**
 * POST /api/models/refresh
 * Manually refresh the model cache
 */
export async function POST() {
  try {
    const models = await getAvailableModels(true);

    return NextResponse.json({
      success: true,
      models,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to refresh models",
      },
      { status: 500 }
    );
  }
}
