# Usage Analytics & Rate Limiting System

This directory contains the core usage tracking and rate limiting system for bedda.ai. This system is **critical** for preventing cost overruns and enabling monetization.

## Overview

The usage tracking system provides:

- **Real-time usage tracking** - Records every AI request with tokens, costs, and metadata
- **Tier-based rate limiting** - Enforces message limits per minute, day, and month
- **Monthly aggregation** - Efficient storage and querying of user usage patterns
- **Cost calculation** - Tracks API costs per user for billing and analytics

## Architecture

### Database Schema (`lib/db/schema.ts`)

**UserTier** - User subscription management
- Tracks user tier (free/pro/premium/enterprise)
- Stores Stripe subscription details
- Manages billing periods

**UserUsage** - Monthly usage aggregation
- Aggregates usage per user per month
- Tracks message counts, tokens, and costs
- Efficient querying for billing and dashboards

**UsageEvent** - Detailed request tracking
- Records every AI request in detail
- Captures tokens, latency, cache hits, tools used
- Enables detailed analytics and debugging

**RateLimit** - Rate limiting state
- Tracks rate limit windows per user
- Separate limits for per-minute and per-day
- Automatic window management and reset

### Core Services (`tracking.ts`)

**recordUsage()** - Track a single AI request
```typescript
await recordUsage({
  userId: "user-123",
  modelId: "gpt-4",
  provider: "openai",
  inputTokens: 1000,
  outputTokens: 500,
  cachedTokens: 0,
  success: true,
});
```

**getCurrentMonthUsage()** - Get user's current usage
```typescript
const usage = await getCurrentMonthUsage("user-123");
// Returns: { messageCount, inputTokens, outputTokens, totalCost, ... }
```

**getUserTier()** - Get user's subscription tier
```typescript
const tier = await getUserTier("user-123"); // "free" | "pro" | "premium" | "enterprise"
```

**checkTierLimit()** - Check if user exceeded monthly limit
```typescript
const allowed = await checkTierLimit("user-123", "free"); // boolean
```

**checkRateLimit()** - Check per-minute or per-day limits
```typescript
const result = await checkRateLimit("user-123", "messages_per_minute", "free");
// Returns: { allowed: boolean, retryAfter?: number }
```

### Middleware (`lib/middleware/rate-limit.ts`)

**rateLimitMiddleware()** - Main rate limiting check
```typescript
const result = await rateLimitMiddleware(userId);
if (!result.allowed) {
  return createRateLimitResponse(result); // 429 Too Many Requests
}
```

## Rate Limit Tiers

| Tier | Per Minute | Per Day | Per Month | Price |
|------|------------|---------|-----------|-------|
| **Free** | 3 | 30 | 75 | $0 |
| **Pro** | 10 | 300 | 750 | $20/mo |
| **Premium** | 20 | 1,000 | 3,000 | $50/mo |
| **Enterprise** | 100 | 10,000 | 100,000 | Custom |

## Integration

The system is integrated into the chat API at `app/(chat)/api/chat/route.ts`:

1. **Authentication** - Get user from session
2. **Rate Limiting** - Check limits before processing
3. **AI Request** - Process chat request
4. **Usage Tracking** - Record tokens and costs on completion

## Usage Flow

```
┌─────────────────┐
│  Chat Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Authentication  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Rate Limiting  │◄──── getUserTier()
│  Middleware     │◄──── checkRateLimit()
└────────┬────────┘◄──── checkTierLimit()
         │
         ▼
    Allowed?
    ┌───┴───┐
   No│      │Yes
    │       │
    ▼       ▼
┌─────┐ ┌──────────────┐
│ 429 │ │ Process Chat │
└─────┘ └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │ AI Response  │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │recordUsage() │
        └──────────────┘
```

## Cost Calculation

Currently uses placeholder pricing ($3/1M input, $15/1M output):

```typescript
const inputCost = (inputTokens / 1_000_000) * 3.0;
const outputCost = (outputTokens / 1_000_000) * 15.0;
const cachedCost = (cachedTokens / 1_000_000) * 0.3; // 90% discount
const totalCost = inputCost + outputCost + cachedCost;
```

**TODO**: Load actual model pricing from `models-data.json`

## Future Enhancements

### Phase 2 (Week 3-4)
- [ ] Load real model pricing from models-data.json
- [ ] Extract cached tokens from provider metadata
- [ ] Track request latency
- [ ] Implement prompt caching (50-90% cost reduction)

### Phase 3 (Month 2)
- [ ] User usage dashboard
- [ ] Usage notifications (80%, 90%, 100% of limit)
- [ ] Admin analytics dashboard
- [ ] Usage export API

### Phase 4 (Month 3+)
- [ ] Anomaly detection
- [ ] Cost forecasting
- [ ] Usage-based billing integration
- [ ] Advanced analytics and reporting

## Monitoring

Key metrics to track:
- Cache hit rate (target: >60%)
- Average cost per user per month (target: <$1 for free, <$10 for paid)
- Rate limit hit rate (should be low)
- 429 error rate (should be <1%)

## Maintenance

### Monthly Reset
User usage aggregates automatically for each month. No manual reset needed.

### Rate Limit Windows
Rate limits auto-reset when windows expire. Old windows can be cleaned up with:

```sql
DELETE FROM "RateLimit" WHERE "windowEnd" < NOW() - INTERVAL '1 day';
```

### Usage Event Cleanup
Recommended to archive events older than 90 days:

```sql
-- Archive to cold storage
INSERT INTO "UsageEventArchive" SELECT * FROM "UsageEvent"
WHERE "createdAt" < NOW() - INTERVAL '90 days';

-- Delete from hot storage
DELETE FROM "UsageEvent" WHERE "createdAt" < NOW() - INTERVAL '90 days';
```

## Testing

To test rate limiting in development:

1. Set tier to "free" for test user
2. Send 4 messages in <60 seconds
3. 4th message should return 429 with retry-after header

To test usage tracking:

1. Send a chat request
2. Query UserUsage table for your user
3. Verify messageCount, inputTokens, outputTokens are updated

## Security

- All user IDs use UUID v4 for security
- Rate limit checks fail open (allow request) if service errors
- Usage tracking failures don't block requests (logged only)
- SQL injection prevented by Drizzle ORM parameterized queries

## Performance

- Usage tracking is async (doesn't block response)
- Monthly aggregates cached for fast dashboard queries
- Rate limit checks use indexed queries (<10ms)
- Database indexes on userId, month, windowStart

## References

- Feature specification: `docs/feature-ideas/USAGE_ANALYTICS_MONITORING.md`
- Database migrations: `lib/db/migrations/0008_usage_tracking.sql`
- API integration: `app/(chat)/api/chat/route.ts:350-389`
