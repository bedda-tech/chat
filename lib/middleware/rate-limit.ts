import { NextResponse } from "next/server";
import {
  checkRateLimit,
  checkTierLimit,
  getUserTier,
  incrementRateLimit,
  TIER_LIMITS,
} from "@/lib/usage/tracking";

export type RateLimitResult = {
  allowed: boolean;
  error?: string;
  message?: string;
  retryAfter?: number;
  upgrade?: boolean;
  upgradeUrl?: string;
};

/**
 * Rate limiting middleware for chat requests
 * Checks both per-minute and monthly limits
 */
export async function rateLimitMiddleware(
  userId: string
): Promise<RateLimitResult> {
  try {
    // Get user's tier
    const tier = await getUserTier(userId);
    const limits = TIER_LIMITS[tier];

    // Check per-minute limit
    const minuteLimit = await checkRateLimit(
      userId,
      "messages_per_minute",
      tier
    );

    if (!minuteLimit.allowed) {
      return {
        allowed: false,
        error: "Rate limit exceeded",
        message: `You can only send ${limits.messagesPerMinute} messages per minute. Please wait ${minuteLimit.retryAfter} seconds.`,
        retryAfter: minuteLimit.retryAfter,
      };
    }

    // Check monthly limit
    const monthlyAllowed = await checkTierLimit(userId, tier);

    if (!monthlyAllowed) {
      return {
        allowed: false,
        error: "Monthly limit exceeded",
        message: `You've reached your monthly limit of ${limits.messagesPerMonth} messages.${
          tier === "free"
            ? " Upgrade to Pro for 10x more messages!"
            : " Please upgrade to a higher tier for more capacity."
        }`,
        upgrade: true,
        upgradeUrl: "/pricing",
      };
    }

    // Increment rate limit counter
    await incrementRateLimit(userId, "messages_per_minute");

    return {
      allowed: true,
    };
  } catch (error) {
    console.error("Rate limiting error:", error);
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
    };
  }
}

/**
 * Create a NextResponse for rate limit errors
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const status = 429; // Too Many Requests

  const headers = new Headers();
  if (result.retryAfter) {
    headers.set("Retry-After", result.retryAfter.toString());
  }
  headers.set("X-RateLimit-Limit", "true");

  return NextResponse.json(
    {
      error: result.error,
      message: result.message,
      upgrade: result.upgrade || false,
      upgradeUrl: result.upgradeUrl,
    },
    {
      status,
      headers,
    }
  );
}
