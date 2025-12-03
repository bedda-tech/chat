import { and, eq, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { rateLimit, usageEvent, userTier, userUsage } from "@/lib/db/schema";

const connectionString = process.env.POSTGRES_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

export type UserTierType = "free" | "pro" | "premium" | "enterprise";

export type UsageEventInput = {
  userId: string;
  modelId: string;
  provider: string;
  sessionId?: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  latency?: number;
  cacheHit?: boolean;
  toolsUsed?: string[];
  success?: boolean;
  errorType?: string;
};

export type MonthlyUsage = {
  messageCount: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  totalCost: number;
  cachedSavings: number;
};

export type RateLimitConfig = {
  messagesPerMinute: number;
  messagesPerDay: number;
  messagesPerMonth: number;
};

export const TIER_LIMITS: Record<UserTierType, RateLimitConfig> = {
  free: {
    messagesPerMinute: 5,
    messagesPerDay: 50,
    messagesPerMonth: 200,
  },
  pro: {
    // Better than ChatGPT Plus (~1,280/day), Claude Pro (~216/day), Gemini (100/day), Grok (~600/day)
    // Unlimited monthly - only daily cap applies
    messagesPerMinute: 20,
    messagesPerDay: 1_500,
    messagesPerMonth: 999_999_999, // Effectively unlimited
  },
  premium: {
    // Unlimited monthly - only daily cap applies
    messagesPerMinute: 40,
    messagesPerDay: 5_000,
    messagesPerMonth: 999_999_999, // Effectively unlimited
  },
  enterprise: {
    messagesPerMinute: 100,
    messagesPerDay: 50_000,
    messagesPerMonth: 999_999_999, // Effectively unlimited
  },
};

/**
 * Calculate cost for a request based on model pricing
 */
function calculateCost(
  _modelId: string,
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number
): { cost: number; cachedSavings: number } {
  // TODO: Load model pricing from models-data.json
  // For now, use placeholder values
  const inputCostPer1M = 3.0; // $3 per 1M input tokens
  const outputCostPer1M = 15.0; // $15 per 1M output tokens
  const cachedInputCostPer1M = 0.3; // $0.30 per 1M cached tokens (90% discount)

  const normalInputTokens = inputTokens - cachedTokens;
  const inputCost = (normalInputTokens / 1_000_000) * inputCostPer1M;
  const cachedCost = (cachedTokens / 1_000_000) * cachedInputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * outputCostPer1M;

  const cost = inputCost + cachedCost + outputCost;

  // Calculate savings from caching
  const normalCachedCost = (cachedTokens / 1_000_000) * inputCostPer1M;
  const cachedSavings = normalCachedCost - cachedCost;

  return { cost, cachedSavings };
}

/**
 * Get the first day of the current month
 */
function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Record a single AI request usage event
 */
export async function recordUsage(event: UsageEventInput): Promise<void> {
  const {
    userId,
    modelId,
    provider,
    sessionId,
    inputTokens,
    outputTokens,
    cachedTokens = 0,
    latency,
    cacheHit = false,
    toolsUsed = [],
    success = true,
    errorType,
  } = event;

  // Calculate cost
  const { cost, cachedSavings } = calculateCost(
    modelId,
    inputTokens,
    outputTokens,
    cachedTokens
  );

  const totalTokens = inputTokens + outputTokens;

  // Insert usage event
  await db.insert(usageEvent).values({
    userId,
    modelId,
    provider,
    sessionId: sessionId || null,
    inputTokens: inputTokens.toString(),
    outputTokens: outputTokens.toString(),
    cachedTokens: cachedTokens.toString(),
    totalTokens: totalTokens.toString(),
    cost: cost.toFixed(6),
    cachedSavings: cachedSavings.toFixed(6),
    latencyMs: latency?.toString() || null,
    cacheHit,
    toolsUsed,
    success,
    errorType: errorType || null,
  });

  // Update monthly aggregation
  await updateMonthlyUsage(
    userId,
    1,
    inputTokens,
    outputTokens,
    cachedTokens,
    cost,
    cachedSavings
  );
}

/**
 * Update monthly usage aggregation
 */
async function updateMonthlyUsage(
  userId: string,
  messageCount: number,
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number,
  cost: number,
  cachedSavings: number
): Promise<void> {
  const month = getMonthStart();

  // Try to get existing usage record
  const existing = await db
    .select()
    .from(userUsage)
    .where(and(eq(userUsage.userId, userId), eq(userUsage.month, month)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing record
    const current = existing[0];
    await db
      .update(userUsage)
      .set({
        messageCount: (
          Number.parseInt(current.messageCount, 10) + messageCount
        ).toString(),
        inputTokens: (
          Number.parseInt(current.inputTokens, 10) + inputTokens
        ).toString(),
        outputTokens: (
          Number.parseInt(current.outputTokens, 10) + outputTokens
        ).toString(),
        cachedTokens: (
          Number.parseInt(current.cachedTokens, 10) + cachedTokens
        ).toString(),
        totalCost: (Number.parseFloat(current.totalCost) + cost).toFixed(6),
        cachedSavings: (
          Number.parseFloat(current.cachedSavings) + cachedSavings
        ).toFixed(6),
        updatedAt: new Date(),
      })
      .where(and(eq(userUsage.userId, userId), eq(userUsage.month, month)));
  } else {
    // Insert new record
    await db.insert(userUsage).values({
      userId,
      month,
      messageCount: messageCount.toString(),
      freeTierUsed: messageCount.toString(),
      inputTokens: inputTokens.toString(),
      outputTokens: outputTokens.toString(),
      cachedTokens: cachedTokens.toString(),
      totalCost: cost.toFixed(6),
      cachedSavings: cachedSavings.toFixed(6),
    });
  }
}

/**
 * Get user's current month usage
 */
export async function getCurrentMonthUsage(
  userId: string
): Promise<MonthlyUsage> {
  const month = getMonthStart();

  const result = await db
    .select()
    .from(userUsage)
    .where(and(eq(userUsage.userId, userId), eq(userUsage.month, month)))
    .limit(1);

  if (result.length === 0) {
    return {
      messageCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      totalCost: 0,
      cachedSavings: 0,
    };
  }

  const usage = result[0];
  return {
    messageCount: Number.parseInt(usage.messageCount, 10),
    inputTokens: Number.parseInt(usage.inputTokens, 10),
    outputTokens: Number.parseInt(usage.outputTokens, 10),
    cachedTokens: Number.parseInt(usage.cachedTokens, 10),
    totalCost: Number.parseFloat(usage.totalCost),
    cachedSavings: Number.parseFloat(usage.cachedSavings),
  };
}

/**
 * Get user's tier
 */
export async function getUserTier(userId: string): Promise<UserTierType> {
  const result = await db
    .select()
    .from(userTier)
    .where(eq(userTier.userId, userId))
    .limit(1);

  if (result.length === 0) {
    // Create default free tier for new users
    await db.insert(userTier).values({
      userId,
      tier: "free",
    });
    return "free";
  }

  return result[0].tier as UserTierType;
}

/**
 * Check if user has exceeded their tier limit
 */
export async function checkTierLimit(
  userId: string,
  tier: UserTierType
): Promise<boolean> {
  const usage = await getCurrentMonthUsage(userId);
  const limit = TIER_LIMITS[tier].messagesPerMonth;

  return usage.messageCount < limit;
}

/**
 * Check if user is within rate limit
 */
export async function checkRateLimit(
  userId: string,
  limitType: "messages_per_minute" | "messages_per_day",
  tier: UserTierType
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = new Date();
  const windowSeconds = limitType === "messages_per_minute" ? 60 : 24 * 60 * 60;
  const _windowStart = new Date(now.getTime() - windowSeconds * 1000);

  const limitValue =
    limitType === "messages_per_minute"
      ? TIER_LIMITS[tier].messagesPerMinute
      : TIER_LIMITS[tier].messagesPerDay;

  // Check for existing rate limit window
  const result = await db
    .select()
    .from(rateLimit)
    .where(
      and(
        eq(rateLimit.userId, userId),
        eq(rateLimit.limitType, limitType),
        gte(rateLimit.windowEnd, now)
      )
    )
    .limit(1);

  if (result.length === 0) {
    // No active rate limit window, create new one
    await db.insert(rateLimit).values({
      userId,
      limitType,
      currentCount: "0",
      limitValue: limitValue.toString(),
      windowStart: now,
      windowEnd: new Date(now.getTime() + windowSeconds * 1000),
    });

    return { allowed: true };
  }

  const limit = result[0];
  const currentCount = Number.parseInt(limit.currentCount, 10);

  if (currentCount >= limitValue) {
    const retryAfter = Math.ceil(
      (limit.windowEnd.getTime() - now.getTime()) / 1000
    );
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

/**
 * Increment rate limit counter
 */
export async function incrementRateLimit(
  userId: string,
  limitType: "messages_per_minute" | "messages_per_day"
): Promise<void> {
  const now = new Date();

  // Find active window
  const result = await db
    .select()
    .from(rateLimit)
    .where(
      and(
        eq(rateLimit.userId, userId),
        eq(rateLimit.limitType, limitType),
        gte(rateLimit.windowEnd, now)
      )
    )
    .limit(1);

  if (result.length > 0) {
    const limit = result[0];
    const newCount = Number.parseInt(limit.currentCount, 10) + 1;

    await db
      .update(rateLimit)
      .set({
        currentCount: newCount.toString(),
      })
      .where(
        and(
          eq(rateLimit.userId, userId),
          eq(rateLimit.limitType, limitType),
          eq(rateLimit.windowStart, limit.windowStart)
        )
      );
  }
}
