import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getUserTier, getCurrentMonthUsage, TIER_LIMITS } from "@/lib/usage/tracking";

export async function GET(_req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tier = await getUserTier(session.user.id);
    const usage = await getCurrentMonthUsage(session.user.id);
    const limits = TIER_LIMITS[tier];

    return NextResponse.json({
      tier,
      usage: {
        messageCount: usage.messageCount,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cachedTokens: usage.cachedTokens,
        totalCost: usage.totalCost,
        cachedSavings: usage.cachedSavings,
      },
      limits: {
        messagesPerMonth: limits.messagesPerMonth,
        messagesPerDay: limits.messagesPerDay,
        messagesPerMinute: limits.messagesPerMinute,
      },
      percentUsed: (usage.messageCount / limits.messagesPerMonth) * 100,
    });
  } catch (error) {
    console.error("Error getting subscription status:", error);
    return NextResponse.json(
      { error: "Failed to get subscription status" },
      { status: 500 }
    );
  }
}
