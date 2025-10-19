# Prompt Caching Implementation

## Document Purpose
This document outlines the implementation of prompt caching using AI Gateway and AI SDK features to reduce API costs by 50-90% through intelligent caching of system prompts, long contexts, and repeated content.

## 1. Overview

Prompt caching allows you to cache portions of your prompts that are reused across multiple requests. Instead of processing the same system prompt or context repeatedly, the AI provider caches it and charges significantly less for subsequent uses.

**Cost Savings**:
- Anthropic Claude: **90% reduction** on cached tokens ($0.30 vs $3.00 per 1M tokens for Sonnet)
- OpenAI GPT-4o: **50% reduction** on cached tokens ($1.25 vs $2.50 per 1M tokens)
- Reduces costs dramatically for conversations with long system prompts or document contexts

**Reference**: AI SDK supports prompt caching via the `experimental_providerMetadata` API

## 2. Current State

### What We Have
- Models support caching (models-data.json includes `cachedInput` pricing)
- Gateway configuration exists (`lib/ai/gateway-config.ts`)
- No actual caching implementation

### What's Missing
- Cache control headers not being sent
- No caching strategy for system prompts
- Document contexts not leveraging cache
- No cache hit/miss tracking

## 3. How Prompt Caching Works

### Cache Eligibility
Content is cached when:
1. **Minimum size**: At least 1024 tokens (Anthropic) or 1000 tokens (OpenAI)
2. **Positioned correctly**: At the start of the prompt
3. **Marked for caching**: Using cache control headers
4. **TTL**: Cached for 5 minutes (Anthropic) or 1 hour (OpenAI)

### Example Request
```typescript
import { generateText } from 'ai';
import { gateway } from '@/lib/ai/providers';

const { text } = await generateText({
  model: gateway.languageModel('anthropic/claude-sonnet-4'),
  messages: [
    {
      role: 'system',
      content: 'You are a helpful AI assistant...', // This gets cached!
      experimental_providerMetadata: {
        anthropic: { cacheControl: { type: 'ephemeral' } }
      }
    },
    {
      role: 'user',
      content: 'What is the weather today?'
    }
  ]
});

// First request: Pays full price for system prompt
// Subsequent requests (within 5 min): Pays 90% less for system prompt
```

## 4. Implementation Strategy

### Phase 1: System Prompt Caching

**Goal**: Cache the system prompt that's the same across all messages in a conversation

**File**: `lib/ai/providers.ts` (modification)

```typescript
import { generateText, streamText } from 'ai';
import { gateway } from 'ai';

export async function generateAIResponse(
  messages: Message[],
  modelId: string,
  options?: GenerateOptions
) {
  // Extract system prompt from messages
  const systemMessage = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');

  // Build messages with cache control
  const cachedMessages = systemMessage
    ? [
        {
          ...systemMessage,
          // Mark system prompt for caching
          experimental_providerMetadata: {
            anthropic: { cacheControl: { type: 'ephemeral' } },
            openai: { cacheControl: { type: 'ephemeral' } }
          }
        },
        ...userMessages
      ]
    : userMessages;

  return await generateText({
    model: gateway.languageModel(modelId),
    messages: cachedMessages,
    ...options
  });
}
```

**Expected Savings**:
- System prompt: ~500-1000 tokens
- Cached on every request after the first
- Savings: ~$0.02 per 100 messages (adds up fast!)

### Phase 2: Document Context Caching

**Goal**: Cache large documents that users are chatting with

**Use Cases**:
- User uploads a 10,000 token PDF
- User chats about it for 20 messages
- Without caching: 10,000 tokens × 20 = 200k tokens processed
- With caching: 10,000 tokens (first) + 1,000 tokens × 19 = 29k tokens processed
- **Savings**: 85% reduction!

**File**: `lib/ai/tools/create-document.ts` (modification)

```typescript
export async function chatWithDocument(
  documentContent: string,
  userMessage: string,
  modelId: string
) {
  // Check if document is large enough to cache (1024+ tokens)
  const estimatedTokens = documentContent.length / 4; // rough estimate
  const shouldCache = estimatedTokens >= 1024;

  const documentMessage = {
    role: 'system' as const,
    content: `Here is the document context:\n\n${documentContent}`,
    ...(shouldCache && {
      experimental_providerMetadata: {
        anthropic: { cacheControl: { type: 'ephemeral' } },
        openai: { cacheControl: { type: 'ephemeral' } }
      }
    })
  };

  return await generateText({
    model: gateway.languageModel(modelId),
    messages: [
      documentMessage,
      { role: 'user', content: userMessage }
    ]
  });
}
```

### Phase 3: Multi-Level Caching

**Goal**: Cache both system prompt AND document context

**Strategy**:
```typescript
messages: [
  {
    role: 'system',
    content: 'You are a helpful AI assistant...', // Cache 1
    experimental_providerMetadata: {
      anthropic: { cacheControl: { type: 'ephemeral' } }
    }
  },
  {
    role: 'system',
    content: `Document context:\n\n${largeDocument}`, // Cache 2
    experimental_providerMetadata: {
      anthropic: { cacheControl: { type: 'ephemeral' } }
    }
  },
  {
    role: 'user',
    content: 'Summarize the document' // Not cached (changes every time)
  }
]
```

**Anthropic supports up to 4 cache levels!**

### Phase 4: Conversation History Caching

**Goal**: Cache the full conversation history for long chats

**Use Case**:
- 50-message conversation
- Each new message includes full history
- Without caching: Process all 50 messages every time
- With caching: Process only new message, cache rest

**Implementation**:

```typescript
export async function continueConversation(
  conversationHistory: Message[],
  newMessage: string,
  modelId: string
) {
  // Mark the last N messages as cacheable
  const cacheableHistory = conversationHistory.slice(0, -1).map((msg, idx) => ({
    ...msg,
    // Cache everything except the most recent message
    experimental_providerMetadata:
      idx === conversationHistory.length - 2
        ? {
            anthropic: { cacheControl: { type: 'ephemeral' } }
          }
        : undefined
  }));

  return await streamText({
    model: gateway.languageModel(modelId),
    messages: [
      ...cacheableHistory,
      { role: 'user', content: newMessage }
    ]
  });
}
```

## 5. Cache Monitoring & Analytics

### Track Cache Performance

**File**: `lib/ai/cache-analytics.ts`

```typescript
export type CacheStats = {
  requestId: string;
  timestamp: Date;
  modelId: string;
  cacheHit: boolean;
  cachedTokens: number;
  totalTokens: number;
  costSavings: number; // in dollars
};

const cacheStats: CacheStats[] = [];

export function recordCacheStats(stats: CacheStats) {
  cacheStats.push(stats);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Cache] ${stats.cacheHit ? 'HIT' : 'MISS'} - Saved $${stats.costSavings.toFixed(4)}`);
  }
}

export function getCacheAnalytics(timeRange: '1h' | '24h' | '7d') {
  const now = Date.now();
  const rangeMs = timeRange === '1h' ? 3600000 : timeRange === '24h' ? 86400000 : 604800000;

  const recentStats = cacheStats.filter(
    s => now - s.timestamp.getTime() < rangeMs
  );

  const totalRequests = recentStats.length;
  const cacheHits = recentStats.filter(s => s.cacheHit).length;
  const hitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

  const totalSavings = recentStats.reduce((sum, s) => sum + s.costSavings, 0);
  const cachedTokens = recentStats.reduce((sum, s) => sum + s.cachedTokens, 0);

  return {
    totalRequests,
    cacheHits,
    cacheMisses: totalRequests - cacheHits,
    hitRate: `${hitRate.toFixed(1)}%`,
    totalSavings: `$${totalSavings.toFixed(2)}`,
    cachedTokens,
  };
}
```

### Extract Cache Metadata from Responses

```typescript
import { generateText } from 'ai';
import { gateway } from 'ai';

const response = await generateText({
  model: gateway.languageModel('anthropic/claude-sonnet-4'),
  messages: [...],
});

// AI SDK provides usage metadata
const usage = response.usage;
console.log({
  promptTokens: usage.promptTokens,
  completionTokens: usage.completionTokens,
  totalTokens: usage.totalTokens,
});

// Gateway provides additional metadata
const metadata = response.experimental_providerMetadata;
if (metadata?.anthropic) {
  console.log({
    cacheCreationInputTokens: metadata.anthropic.cacheCreationInputTokens,
    cacheReadInputTokens: metadata.anthropic.cacheReadInputTokens,
  });
}

// Calculate savings
const cachedTokens = metadata?.anthropic?.cacheReadInputTokens || 0;
const normalCost = usage.promptTokens * 0.003; // $3 per 1M tokens
const cachedCost = cachedTokens * 0.0003; // $0.30 per 1M tokens
const savings = normalCost - cachedCost;

recordCacheStats({
  requestId: response.id || crypto.randomUUID(),
  timestamp: new Date(),
  modelId: 'anthropic/claude-sonnet-4',
  cacheHit: cachedTokens > 0,
  cachedTokens,
  totalTokens: usage.totalTokens,
  costSavings: savings,
});
```

## 6. Cache Strategy Recommendations

### When to Use Caching

**Always Cache**:
1. System prompts (reused in every request)
2. Large documents (PDFs, code files, articles)
3. Conversation history (for multi-turn chats)
4. Static context (company info, guidelines, rules)

**Don't Cache**:
1. User messages (change every time)
2. Small content (<1024 tokens)
3. Dynamic content (real-time data, timestamps)
4. One-off requests

### Cache TTL Strategy

**Anthropic** (5-minute TTL):
- Good for: Active conversations
- Strategy: Cache within conversation session
- Reset: When user closes chat or after 5 min idle

**OpenAI** (1-hour TTL):
- Good for: Document analysis, longer sessions
- Strategy: Cache for document-heavy workflows
- Reset: When document changes or session ends

## 7. Cost Impact Analysis

### Example: 1000 Users, 50 Messages Each

**Without Caching**:
```
System prompt: 1000 tokens
User message: 500 tokens (average)
Total per message: 1500 tokens

1000 users × 50 messages × 1500 tokens = 75M tokens
Cost at $3/1M tokens = $225
```

**With Caching** (90% of system prompt cached):
```
First message: 1500 tokens (full cost)
Subsequent 49 messages: 500 + (1000 × 0.1) = 600 tokens

1000 users × [(1500) + (49 × 600)] = 30.9M tokens
Cost = (1.5M × $3) + (29.4M × ~$0.6) = $4.50 + $17.64 = $22.14

Savings: $225 - $22.14 = $202.86 (90% reduction!)
```

### ROI on Implementation

**Development Cost**: 2-3 days (1 developer)
**Monthly Savings** (at scale):
- 10k users: ~$2,000/month
- 50k users: ~$10,000/month
- 100k users: ~$20,000/month

**Break-even**: Immediately at scale

## 8. Implementation Checklist

- [ ] Update `lib/ai/providers.ts` to add cache control headers
- [ ] Implement system prompt caching
- [ ] Implement document context caching
- [ ] Add conversation history caching
- [ ] Create `lib/ai/cache-analytics.ts` for tracking
- [ ] Extract cache metadata from responses
- [ ] Build cache analytics dashboard UI
- [ ] Add cache stats to usage reports
- [ ] Document caching behavior for users
- [ ] Add cache performance monitoring
- [ ] Test cache hit rates in production
- [ ] Optimize cache breakpoints (when to cache)

## 9. Testing Plan

### Unit Tests
```typescript
describe('Prompt Caching', () => {
  it('should add cache control for system prompts over 1024 tokens', () => {
    const longPrompt = 'a'.repeat(5000);
    const messages = buildCachedMessages(longPrompt);
    expect(messages[0].experimental_providerMetadata).toBeDefined();
  });

  it('should not cache short system prompts', () => {
    const shortPrompt = 'You are helpful';
    const messages = buildCachedMessages(shortPrompt);
    expect(messages[0].experimental_providerMetadata).toBeUndefined();
  });

  it('should calculate cost savings correctly', () => {
    const savings = calculateCacheSavings(10000, 'anthropic/claude-sonnet-4');
    expect(savings).toBeGreaterThan(0);
  });
});
```

### Integration Tests
- Test cache hit on second request
- Verify cache expiration after TTL
- Test multi-level caching
- Validate metadata extraction

### E2E Tests
- Start conversation, verify cache hits
- Upload document, verify cache usage
- Track savings over 10-message conversation

## 10. UI Components

### Cache Performance Indicator

Show users when cache is active:

```tsx
// components/cache-indicator.tsx
export function CacheIndicator({ cacheHit, savings }: Props) {
  if (!cacheHit) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-green-600">
      <CheckCircle className="h-3 w-3" />
      <span>Cached response (saved ${savings.toFixed(4)})</span>
    </div>
  );
}
```

### Admin Dashboard

```tsx
// app/admin/cache-analytics/page.tsx
export default function CacheAnalyticsPage() {
  const analytics = getCacheAnalytics('24h');

  return (
    <div className="space-y-4">
      <h1>Cache Performance</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Hit Rate" value={analytics.hitRate} />
        <StatCard label="Total Savings" value={analytics.totalSavings} />
        <StatCard label="Cached Tokens" value={analytics.cachedTokens} />
      </div>

      <CacheHitChart data={analytics} />
    </div>
  );
}
```

## 11. Migration Strategy

### Week 1: Foundation
- Implement basic caching for system prompts
- Add metadata tracking
- Deploy to 10% of users

### Week 2: Optimization
- Add document caching
- Optimize cache breakpoints
- Expand to 50% of users

### Week 3: Full Rollout
- Add conversation history caching
- Build analytics dashboard
- Roll out to 100% of users

### Week 4: Monitoring
- Track cost savings
- Optimize cache strategy
- Document best practices

## 12. Risks & Mitigation

### Risk: Cache Invalidation Issues
- **Mitigation**: Conservative TTL, explicit cache keys
- **Fallback**: Disable caching if errors occur

### Risk: Stale Content
- **Mitigation**: Short TTL (5 min for conversations)
- **Solution**: Clear cache on document updates

### Risk: Privacy Concerns
- **Mitigation**: Caches are per-user, provider-managed
- **Guarantee**: No cross-user cache sharing

## 13. Future Enhancements

1. **Redis Caching**: Persistent cache across server restarts
2. **Smart Cache Preloading**: Preload common prompts
3. **Cache Warming**: Prime cache before user requests
4. **Custom TTL**: User-configurable cache duration
5. **Cache Compression**: Reduce cache storage size

---

**Document Version**: 1.0
**Created**: 2025-10-20
**Last Updated**: 2025-10-20
**Status**: Planning Phase
**Priority**: High (90% cost reduction potential)
**Estimated Effort**: 2-3 days
**Expected ROI**: Immediate at scale
