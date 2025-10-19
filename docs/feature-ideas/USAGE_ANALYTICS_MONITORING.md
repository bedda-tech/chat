# Usage Analytics & Monitoring System

## Document Purpose
This document outlines a comprehensive usage analytics and monitoring system for tracking user behavior, model usage, costs, performance metrics, and implementing rate limiting for the pricing tiers outlined in the monetization strategy.

## 1. Overview

A robust analytics system is essential for:
- **Enforcing tier limits** (free: 75 msgs, pro: 750 msgs, premium: 3000 msgs)
- **Tracking costs** per user, model, and tier
- **Monitoring performance** (latency, errors, cache hits)
- **Understanding usage patterns** (which models, tools, features)
- **Making data-driven decisions** (pricing, features, optimizations)
- **Preventing abuse** (rate limiting, anomaly detection)

**Key Metrics to Track**:
- Messages per user per month
- Tokens consumed (input/output/cached)
- Cost per user, per model
- Response times and error rates
- Tool usage and success rates
- Conversion rates (free → paid)

## 2. Current State

### What We Have
- Model pricing data in `models-data.json`
- Basic usage metadata from AI SDK responses
- No persistent usage tracking
- No rate limiting
- No analytics dashboard

### What's Missing
- Usage tracking database
- Rate limiting middleware
- Usage quota enforcement
- Cost calculation engine
- Analytics dashboard
- Usage reports
- Anomaly detection

## 3. Database Schema

### Tables

**File**: `db/schema/usage.sql`

```sql
-- User usage tracking (monthly aggregation)
CREATE TABLE user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of month (2025-10-01)

  -- Message counts
  message_count INT DEFAULT 0,
  free_tier_used INT DEFAULT 0,

  -- Token counts
  input_tokens BIGINT DEFAULT 0,
  output_tokens BIGINT DEFAULT 0,
  cached_tokens BIGINT DEFAULT 0,

  -- Costs (in USD)
  total_cost DECIMAL(10, 4) DEFAULT 0,
  cached_savings DECIMAL(10, 4) DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, month)
);

-- Individual request tracking (detailed)
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Request metadata
  model_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  session_id UUID,

  -- Tokens
  input_tokens INT NOT NULL,
  output_tokens INT NOT NULL,
  cached_tokens INT DEFAULT 0,
  total_tokens INT NOT NULL,

  -- Cost
  cost DECIMAL(10, 6) NOT NULL,
  cached_savings DECIMAL(10, 6) DEFAULT 0,

  -- Performance
  latency_ms INT, -- Response time in milliseconds
  cache_hit BOOLEAN DEFAULT FALSE,

  -- Tools used
  tools_used TEXT[], -- Array of tool names

  -- Status
  success BOOLEAN DEFAULT TRUE,
  error_type VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  -- Indexes for fast queries
  INDEX idx_user_month (user_id, date_trunc('month', created_at)),
  INDEX idx_model (model_id),
  INDEX idx_created_at (created_at)
);

-- Rate limiting tracking
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Rate limit type
  limit_type VARCHAR(50) NOT NULL, -- 'messages_per_minute', 'messages_per_day', etc.

  -- Counts
  current_count INT DEFAULT 0,
  limit_value INT NOT NULL,

  -- Time window
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,

  -- Reset tracking
  last_reset TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, limit_type, window_start)
);

-- Model usage analytics (aggregated)
CREATE TABLE model_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,

  -- Counts
  request_count INT DEFAULT 0,
  user_count INT DEFAULT 0, -- Unique users

  -- Tokens
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,

  -- Performance
  avg_latency_ms INT,
  p95_latency_ms INT,
  p99_latency_ms INT,

  -- Success rate
  success_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  success_rate DECIMAL(5, 2), -- Percentage

  UNIQUE(model_id, date),
  INDEX idx_date (date)
);

-- Tool usage tracking
CREATE TABLE tool_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name VARCHAR(100) NOT NULL,
  date DATE NOT NULL,

  -- Counts
  invocation_count INT DEFAULT 0,
  user_count INT DEFAULT 0,

  -- Success tracking
  success_count INT DEFAULT 0,
  error_count INT DEFAULT 0,

  -- Performance
  avg_duration_ms INT,

  UNIQUE(tool_name, date),
  INDEX idx_date (date)
);
```

## 4. Usage Tracking Service

**File**: `lib/usage/tracking.ts`

```typescript
import { db } from '@/lib/db';
import { UsageEvent, UserTier } from '@/types';

export class UsageTracker {
  /**
   * Record a single AI request
   */
  static async recordUsage(event: UsageEvent): Promise<void> {
    const {
      userId,
      modelId,
      provider,
      sessionId,
      inputTokens,
      outputTokens,
      cachedTokens,
      latency,
      cacheHit,
      toolsUsed,
      success,
      errorType,
    } = event;

    // Calculate cost
    const cost = this.calculateCost(modelId, inputTokens, outputTokens, cachedTokens);
    const cachedSavings = this.calculateCachedSavings(modelId, cachedTokens);

    // Insert event
    await db.query(`
      INSERT INTO usage_events (
        user_id, model_id, provider, session_id,
        input_tokens, output_tokens, cached_tokens, total_tokens,
        cost, cached_savings, latency_ms, cache_hit,
        tools_used, success, error_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `, [
      userId, modelId, provider, sessionId,
      inputTokens, outputTokens, cachedTokens, inputTokens + outputTokens,
      cost, cachedSavings, latency, cacheHit,
      toolsUsed, success, errorType
    ]);

    // Update monthly aggregation
    await this.updateMonthlyUsage(userId, 1, inputTokens, outputTokens, cachedTokens, cost, cachedSavings);
  }

  /**
   * Update monthly usage aggregation
   */
  private static async updateMonthlyUsage(
    userId: string,
    messageCount: number,
    inputTokens: number,
    outputTokens: number,
    cachedTokens: number,
    cost: number,
    cachedSavings: number
  ): Promise<void> {
    const month = new Date();
    month.setDate(1); // First day of current month

    await db.query(`
      INSERT INTO user_usage (
        user_id, month, message_count, input_tokens, output_tokens,
        cached_tokens, total_cost, cached_savings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id, month) DO UPDATE SET
        message_count = user_usage.message_count + $3,
        input_tokens = user_usage.input_tokens + $4,
        output_tokens = user_usage.output_tokens + $5,
        cached_tokens = user_usage.cached_tokens + $6,
        total_cost = user_usage.total_cost + $7,
        cached_savings = user_usage.cached_savings + $8,
        updated_at = NOW()
    `, [userId, month, messageCount, inputTokens, outputTokens, cachedTokens, cost, cachedSavings]);
  }

  /**
   * Calculate cost for a request
   */
  private static calculateCost(
    modelId: string,
    inputTokens: number,
    outputTokens: number,
    cachedTokens: number
  ): number {
    const model = getModelById(modelId);
    if (!model?.pricing) return 0;

    const normalInputTokens = inputTokens - cachedTokens;
    const inputCost = (normalInputTokens / 1_000_000) * model.pricing.input;
    const cachedCost = model.pricing.cachedInput
      ? (cachedTokens / 1_000_000) * model.pricing.cachedInput
      : 0;
    const outputCost = (outputTokens / 1_000_000) * model.pricing.output;

    return inputCost + cachedCost + outputCost;
  }

  /**
   * Calculate savings from caching
   */
  private static calculateCachedSavings(modelId: string, cachedTokens: number): number {
    if (cachedTokens === 0) return 0;

    const model = getModelById(modelId);
    if (!model?.pricing?.cachedInput) return 0;

    const normalCost = (cachedTokens / 1_000_000) * model.pricing.input;
    const cachedCost = (cachedTokens / 1_000_000) * model.pricing.cachedInput;

    return normalCost - cachedCost;
  }

  /**
   * Get user's current month usage
   */
  static async getCurrentMonthUsage(userId: string): Promise<UserUsage> {
    const month = new Date();
    month.setDate(1);

    const result = await db.query(`
      SELECT * FROM user_usage
      WHERE user_id = $1 AND month = $2
    `, [userId, month]);

    return result.rows[0] || {
      message_count: 0,
      input_tokens: 0,
      output_tokens: 0,
      cached_tokens: 0,
      total_cost: 0,
      cached_savings: 0,
    };
  }

  /**
   * Check if user has exceeded their tier limit
   */
  static async checkTierLimit(userId: string, tier: UserTier): Promise<boolean> {
    const usage = await this.getCurrentMonthUsage(userId);

    const limits = {
      free: 75,
      pro: 750,
      premium: 3000,
      enterprise: Infinity,
    };

    return usage.message_count < limits[tier];
  }
}
```

## 5. Rate Limiting Middleware

**File**: `lib/middleware/rate-limit.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserTier } from '@/lib/auth';

export type RateLimitConfig = {
  messagesPerMinute: number;
  messagesPerDay: number;
  messagesPerMonth: number;
};

const TIER_LIMITS: Record<string, RateLimitConfig> = {
  free: {
    messagesPerMinute: 3,
    messagesPerDay: 30,
    messagesPerMonth: 75,
  },
  pro: {
    messagesPerMinute: 10,
    messagesPerDay: 300,
    messagesPerMonth: 750,
  },
  premium: {
    messagesPerMinute: 20,
    messagesPerDay: 1000,
    messagesPerMonth: 3000,
  },
  enterprise: {
    messagesPerMinute: Infinity,
    messagesPerDay: Infinity,
    messagesPerMonth: Infinity,
  },
};

export async function rateLimitMiddleware(
  req: NextRequest,
  userId: string
): Promise<NextResponse | null> {
  const tier = await getUserTier(userId);
  const limits = TIER_LIMITS[tier];

  // Check per-minute limit
  const minuteLimit = await checkRateLimit(
    userId,
    'messages_per_minute',
    limits.messagesPerMinute,
    60 // 1 minute window
  );

  if (!minuteLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `You can only send ${limits.messagesPerMinute} messages per minute`,
        retryAfter: minuteLimit.retryAfter,
      },
      { status: 429 }
    );
  }

  // Check monthly limit
  const monthlyLimit = await UsageTracker.checkTierLimit(userId, tier);

  if (!monthlyLimit) {
    return NextResponse.json(
      {
        error: 'Monthly limit exceeded',
        message: `You've reached your monthly limit of ${limits.messagesPerMonth} messages`,
        upgrade: true,
        upgradeUrl: '/pricing',
      },
      { status: 429 }
    );
  }

  // Increment rate limit counter
  await incrementRateLimit(userId, 'messages_per_minute');

  return null; // Allow request
}

async function checkRateLimit(
  userId: string,
  limitType: string,
  limitValue: number,
  windowSeconds: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  const result = await db.query(`
    SELECT current_count, window_end
    FROM rate_limits
    WHERE user_id = $1
      AND limit_type = $2
      AND window_end > $3
  `, [userId, limitType, now]);

  if (result.rows.length === 0) {
    // No active rate limit window, create new one
    await db.query(`
      INSERT INTO rate_limits (user_id, limit_type, current_count, limit_value, window_start, window_end)
      VALUES ($1, $2, 0, $3, $4, $5)
    `, [userId, limitType, limitValue, now, new Date(now.getTime() + windowSeconds * 1000)]);

    return { allowed: true };
  }

  const { current_count, window_end } = result.rows[0];

  if (current_count >= limitValue) {
    const retryAfter = Math.ceil((new Date(window_end).getTime() - now.getTime()) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

async function incrementRateLimit(userId: string, limitType: string): Promise<void> {
  await db.query(`
    UPDATE rate_limits
    SET current_count = current_count + 1
    WHERE user_id = $1 AND limit_type = $2
  `, [userId, limitType]);
}
```

## 6. API Integration

**File**: `app/api/chat/route.ts` (modification)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { gateway } from '@/lib/ai/providers';
import { UsageTracker } from '@/lib/usage/tracking';
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit';

export async function POST(req: NextRequest) {
  const { userId, messages, modelId } = await req.json();

  // Check rate limits
  const rateLimitResult = await rateLimitMiddleware(req, userId);
  if (rateLimitResult) {
    return rateLimitResult; // Return 429 if rate limited
  }

  const startTime = Date.now();
  let success = true;
  let errorType: string | undefined;

  try {
    const result = await streamText({
      model: gateway.languageModel(modelId),
      messages,
      onFinish: async ({ usage, experimental_providerMetadata }) => {
        const latency = Date.now() - startTime;

        // Extract cache metadata
        const cachedTokens =
          experimental_providerMetadata?.anthropic?.cacheReadInputTokens ||
          experimental_providerMetadata?.openai?.cachedTokens ||
          0;

        // Record usage
        await UsageTracker.recordUsage({
          userId,
          modelId,
          provider: modelId.split('/')[0],
          sessionId: req.headers.get('x-session-id') || undefined,
          inputTokens: usage.promptTokens,
          outputTokens: usage.completionTokens,
          cachedTokens,
          latency,
          cacheHit: cachedTokens > 0,
          toolsUsed: [], // Track tools if used
          success: true,
          errorType: undefined,
        });
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    success = false;
    errorType = error instanceof Error ? error.name : 'UnknownError';

    // Record failed request
    await UsageTracker.recordUsage({
      userId,
      modelId,
      provider: modelId.split('/')[0],
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      latency: Date.now() - startTime,
      cacheHit: false,
      toolsUsed: [],
      success: false,
      errorType,
    });

    throw error;
  }
}
```

## 7. Analytics Dashboard

**File**: `app/dashboard/analytics/page.tsx`

```tsx
import { getCurrentUser } from '@/lib/auth';
import { UsageTracker } from '@/lib/usage/tracking';
import { AnalyticsChart } from '@/components/analytics-chart';
import { UsageCard } from '@/components/usage-card';

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  const usage = await UsageTracker.getCurrentMonthUsage(user.id);
  const tier = user.tier || 'free';

  const tierLimits = {
    free: 75,
    pro: 750,
    premium: 3000,
    enterprise: Infinity,
  };

  const usagePercentage = (usage.message_count / tierLimits[tier]) * 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Usage Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UsageCard
          title="Messages This Month"
          value={usage.message_count}
          limit={tierLimits[tier]}
          percentage={usagePercentage}
        />
        <UsageCard
          title="Total Cost"
          value={`$${usage.total_cost.toFixed(2)}`}
          subtitle="This month"
        />
        <UsageCard
          title="Cache Savings"
          value={`$${usage.cached_savings.toFixed(2)}`}
          subtitle="This month"
          positive
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnalyticsChart
          title="Token Usage"
          data={[
            { label: 'Input', value: usage.input_tokens },
            { label: 'Output', value: usage.output_tokens },
            { label: 'Cached', value: usage.cached_tokens },
          ]}
        />
        <AnalyticsChart
          title="Daily Messages"
          data={/* Daily breakdown */}
        />
      </div>

      {usagePercentage > 80 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            You've used {usagePercentage.toFixed(0)}% of your monthly limit.
            {tier === 'free' && (
              <a href="/pricing" className="ml-2 underline">
                Upgrade to Pro for 10x more messages
              </a>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
```

## 8. Admin Analytics Dashboard

**File**: `app/admin/analytics/page.tsx`

```tsx
import { ModelAnalytics } from '@/components/admin/model-analytics';
import { UserGrowth } from '@/components/admin/user-growth';
import { CostBreakdown } from '@/components/admin/cost-breakdown';

export default async function AdminAnalyticsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Platform Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value="10,234" change="+12%" />
        <StatCard label="Active Users (30d)" value="7,891" change="+8%" />
        <StatCard label="Messages (30d)" value="342k" change="+15%" />
        <StatCard label="MRR" value="$16,240" change="+23%" />
      </div>

      <ModelAnalytics />
      <UserGrowth />
      <CostBreakdown />
    </div>
  );
}
```

## 9. Real-Time Monitoring

**File**: `lib/monitoring/metrics.ts`

```typescript
export class MetricsCollector {
  /**
   * Track request latency
   */
  static trackLatency(modelId: string, latency: number): void {
    // Send to monitoring service (DataDog, New Relic, etc.)
    console.log(`[Metrics] ${modelId} latency: ${latency}ms`);
  }

  /**
   * Track error rates
   */
  static trackError(modelId: string, error: Error): void {
    console.error(`[Metrics] ${modelId} error:`, error);
  }

  /**
   * Track cache performance
   */
  static trackCachePerformance(hit: boolean, tokens: number): void {
    console.log(`[Metrics] Cache ${hit ? 'HIT' : 'MISS'} - ${tokens} tokens`);
  }
}
```

## 10. Usage Reports (Email)

**File**: `lib/email/usage-report.ts`

```typescript
import { sendEmail } from '@/lib/email';
import { UsageTracker } from '@/lib/usage/tracking';

export async function sendMonthlyUsageReport(userId: string, email: string): Promise<void> {
  const usage = await UsageTracker.getCurrentMonthUsage(userId);

  await sendEmail({
    to: email,
    subject: 'Your Monthly Usage Report',
    html: `
      <h1>Usage Report for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h1>

      <p>Here's a summary of your bedda.ai usage:</p>

      <ul>
        <li><strong>Messages:</strong> ${usage.message_count}</li>
        <li><strong>Tokens processed:</strong> ${usage.input_tokens + usage.output_tokens}</li>
        <li><strong>Total cost:</strong> $${usage.total_cost.toFixed(2)}</li>
        <li><strong>Saved with caching:</strong> $${usage.cached_savings.toFixed(2)}</li>
      </ul>

      <p>Thank you for using bedda.ai!</p>
    `,
  });
}
```

## 11. Implementation Checklist

- [ ] Create database schema for usage tracking
- [ ] Implement UsageTracker service
- [ ] Add rate limiting middleware
- [ ] Integrate tracking into chat API
- [ ] Build user analytics dashboard
- [ ] Build admin analytics dashboard
- [ ] Add email usage reports
- [ ] Implement real-time monitoring
- [ ] Add anomaly detection
- [ ] Create usage export API
- [ ] Add billing integration (Stripe)
- [ ] Test rate limiting across tiers

## 12. Privacy & Security

### Data Retention
- **Usage events**: 90 days (detailed)
- **Monthly aggregates**: Indefinite
- **Rate limits**: Clear after window expires

### Anonymization
- Admin analytics show aggregated data only
- No individual message content stored
- User IDs hashed for privacy

### Compliance
- GDPR: Users can request data deletion
- Export: Users can download their usage data
- Transparency: Clear usage tracking disclosure

---

**Document Version**: 1.0
**Created**: 2025-10-20
**Last Updated**: 2025-10-20
**Status**: Planning Phase
**Priority**: Critical (Required for monetization)
**Estimated Effort**: 1-2 weeks
**Dependencies**: Pricing/monetization strategy
