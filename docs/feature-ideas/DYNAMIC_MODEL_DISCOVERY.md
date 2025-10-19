# Dynamic Model Discovery Implementation Plan

## Document Purpose
This document outlines a comprehensive plan for implementing AI Gateway's dynamic model discovery feature to replace or augment the current static `models-data.json` configuration in the bedda.ai chat application.

## 1. Overview

The AI SDK's AI Gateway provides a `gateway.getAvailableModels()` API that dynamically fetches available models with their metadata, including:
- Model IDs (e.g., `openai/gpt-4o`, `anthropic/claude-sonnet-4`)
- Human-readable names
- Descriptions
- Pricing information (input/output tokens, caching costs)

This allows the application to automatically discover new models as they're added to AI Gateway without manual configuration updates.

**Reference**: https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway#dynamic-model-discovery

## 2. Current Implementation

### Static Configuration
Currently, models are defined in `/lib/ai/models-data.json` with:
```json
{
  "models": [
    {
      "id": "anthropic-claude-sonnet-4.5",
      "name": "Claude Sonnet 4.5",
      "description": "Most intelligent Claude model...",
      "provider": "anthropic",
      "tools": ["weather", "documents", "suggestions", ...]
    }
  ]
}
```

### Pain Points
- Manual updates required when providers add new models
- Risk of typos in model IDs
- Outdated pricing information
- No automatic discovery of new capabilities

## 3. Proposed Implementation Strategy

### **Hybrid Approach (Recommended)**

Combine dynamic discovery with static fallback and custom metadata:

#### 3.1 API Route for Server-Side Fetching

**File**: `app/api/models/route.ts`

```typescript
import { gateway } from 'ai';
import { NextResponse } from 'next/server';
import modelsData from '@/lib/ai/models-data.json';

export async function GET() {
  try {
    const availableModels = await gateway.getAvailableModels();

    // Transform and merge with static metadata
    const models = availableModels.models.map(model => {
      // Find custom metadata from static config
      const staticModel = modelsData.models.find(
        m => m.id === model.id || m.provider === model.id.split('/')[0]
      );

      return {
        id: model.id,
        name: model.name,
        description: model.description || staticModel?.description || '',
        provider: model.id.split('/')[0],
        tools: staticModel?.tools || inferToolCapabilities(model.id),
        pricing: model.pricing,
        // Preserve custom UI metadata
        icon: staticModel?.icon,
        category: staticModel?.category,
      };
    });

    return NextResponse.json({
      models,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch models:', error);

    // Fallback to static configuration
    return NextResponse.json({
      models: modelsData.models,
      fallback: true
    });
  }
}

function inferToolCapabilities(modelId: string): string[] {
  const tools = [];

  // Most models support these tools
  tools.push('weather', 'documents', 'suggestions', 'analysis', 'structured-data');

  // Image generation models
  if (modelId.includes('dall-e') || modelId.includes('imagen') ||
      modelId.includes('image') || modelId.includes('gemini-2.5-flash-image')) {
    tools.push('images');
  }

  // Audio models
  if (modelId.includes('whisper') || modelId.includes('tts')) {
    tools.push('audio');
  }

  // Embedding models
  if (modelId.includes('embedding')) {
    tools.push('embeddings', 'similarity');
  }

  return tools;
}
```

#### 3.2 Client-Side Hook with Caching

**File**: `hooks/use-available-models.ts`

```typescript
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useAvailableModels() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/models',
    fetcher,
    {
      // Cache for 1 hour
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 3600000, // 1 hour in milliseconds
      // Keep previous data while revalidating
      keepPreviousData: true,
    }
  );

  return {
    models: data?.models || [],
    isLoading,
    error,
    isFallback: data?.fallback || false,
    lastUpdated: data?.lastUpdated,
    refresh: mutate, // Manual refresh function
  };
}
```

#### 3.3 Server-Side Caching Layer

**File**: `lib/ai/models-cache.ts`

```typescript
import { gateway } from 'ai';
import modelsData from './models-data.json';

interface CachedModels {
  models: any[];
  timestamp: number;
}

let cache: CachedModels | null = null;
const CACHE_DURATION = 3600000; // 1 hour

export async function getAvailableModels(forceRefresh = false) {
  const now = Date.now();

  // Return cached if still valid and not forcing refresh
  if (!forceRefresh && cache && (now - cache.timestamp) < CACHE_DURATION) {
    return cache.models;
  }

  try {
    const availableModels = await gateway.getAvailableModels();

    // Update cache
    cache = {
      models: availableModels.models,
      timestamp: now,
    };

    return cache.models;
  } catch (error) {
    console.error('Failed to fetch dynamic models, using static fallback:', error);

    // If cache exists but is stale, return it anyway
    if (cache) {
      console.warn('Returning stale cached models');
      return cache.models;
    }

    // Ultimate fallback to static JSON
    return modelsData.models;
  }
}

export function clearModelsCache() {
  cache = null;
}
```

#### 3.4 Update Model Selector Component

**File**: `components/model-selector.tsx` (modifications)

```typescript
import { useAvailableModels } from '@/hooks/use-available-models';

export function ModelSelector() {
  const { models, isLoading, isFallback, lastUpdated } = useAvailableModels();

  return (
    <div>
      {isFallback && (
        <div className="text-xs text-muted-foreground">
          Using cached models (live data unavailable)
        </div>
      )}

      {/* Existing model selector UI */}
      {models.map(model => (
        <ModelCard key={model.id} model={model} />
      ))}

      {lastUpdated && (
        <div className="text-xs text-muted-foreground">
          Last updated: {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
```

## 4. Benefits

1. **Always Up-to-Date**: Automatically discovers new models as AI Gateway adds them
2. **No Manual Maintenance**: Eliminates need to update `models-data.json` for new models
3. **Accurate Pricing**: Real-time pricing from AI Gateway
4. **Reduced Errors**: No typos in model IDs
5. **Graceful Degradation**: Falls back to static config if API fails
6. **Best of Both Worlds**: Combines dynamic discovery with custom UI metadata

## 5. Migration Strategy

### Phase 1: Parallel Operation
1. Keep existing `models-data.json` unchanged
2. Implement API route and caching layer
3. Add dynamic discovery alongside static config
4. Test with a subset of users

### Phase 2: Gradual Rollout
1. Monitor for discrepancies between static and dynamic data
2. Gradually increase cache duration as confidence grows
3. Update static config to match dynamic discoveries

### Phase 3: Full Migration
1. Use dynamic as primary source
2. Keep static config only for custom metadata (icons, categories, descriptions)
3. Automatic fallback to static if dynamic fails

## 6. Implementation Checklist

- [ ] Create `/app/api/models/route.ts`
- [ ] Create `/hooks/use-available-models.ts`
- [ ] Create `/lib/ai/models-cache.ts`
- [ ] Update `components/model-selector.tsx` to use new hook
- [ ] Add error handling and retry logic
- [ ] Implement cache invalidation strategy
- [ ] Add admin UI for manual cache refresh
- [ ] Update static `models-data.json` to include only custom metadata
- [ ] Add monitoring/logging for dynamic model discovery
- [ ] Write tests for fallback scenarios
- [ ] Document new model discovery flow

## 7. Caching Strategy

### Cache Levels
1. **Server-side in-memory cache**: 1 hour (for API route)
2. **Client-side SWR cache**: 1 hour (for browser)
3. **Static fallback**: Always available

### Cache Invalidation
- Time-based: Every 1 hour
- Manual: Admin action or deployment
- Error-based: Fallback to static on error

## 8. Error Handling

```typescript
try {
  // Attempt dynamic discovery
  const models = await gateway.getAvailableModels();
} catch (error) {
  if (cache && isCacheStale(cache)) {
    // Use stale cache if available
    console.warn('Using stale cache');
    return cache;
  }

  // Ultimate fallback to static
  return modelsData.models;
}
```

## 9. Testing Plan

1. **Unit Tests**
   - Test `inferToolCapabilities()` logic
   - Test cache expiration logic
   - Test fallback scenarios

2. **Integration Tests**
   - Test API route with mocked gateway
   - Test hook behavior with various states
   - Test error handling

3. **E2E Tests**
   - Test model selector displays dynamic models
   - Test fallback when API fails
   - Test cache refresh

## 10. Monitoring & Observability

Track:
- Dynamic model discovery success rate
- API response times
- Fallback frequency
- Model count changes over time
- Pricing updates

## 11. Security Considerations

- Ensure AI_GATEWAY_API_KEY is properly secured
- Rate limit the `/api/models` endpoint
- Validate model data from gateway
- Sanitize model descriptions and names

## 12. Performance Considerations

- Implement request deduplication (SWR handles this)
- Use Next.js ISR for model list page
- Consider CDN caching for API route
- Lazy load model details

## 13. Future Enhancements

1. **Real-time Updates**: WebSocket for model availability changes
2. **Model Search**: Enhanced search across dynamic models
3. **Usage Analytics**: Track which dynamically discovered models are used most
4. **A/B Testing**: Test new models with subset of users
5. **Model Recommendations**: Suggest models based on task type

## 14. Code Examples from AI SDK Documentation

### Basic Usage
```typescript
import { gateway, generateText } from 'ai';

const availableModels = await gateway.getAvailableModels();

// List all available models
availableModels.models.forEach(model => {
  console.log(`${model.id}: ${model.name}`);
  if (model.description) {
    console.log(`  Description: ${model.description}`);
  }
  if (model.pricing) {
    console.log(`  Input: ${model.pricing.input}/token`);
    console.log(`  Output: ${model.pricing.output}/token`);
    if (model.pricing.cachedInputTokens) {
      console.log(`  Cached input: ${model.pricing.cachedInputTokens}/token`);
    }
    if (model.pricing.cacheCreationInputTokens) {
      console.log(`  Cache creation: ${model.pricing.cacheCreationInputTokens}/token`);
    }
  }
});

// Use any discovered model
const { text } = await generateText({
  model: availableModels.models[0].id,
  prompt: 'Hello world',
});
```

## 15. Rollback Plan

If issues arise:
1. Set feature flag to disable dynamic discovery
2. API route returns only static config
3. Monitor for 24 hours
4. Investigate and fix issues
5. Re-enable gradually

## 16. Success Metrics

- 100% uptime with fallback
- <100ms additional latency for model list
- Zero model selection errors
- Automatic discovery of new models within 1 hour
- Reduced manual configuration effort by 90%

## 17. Related Files in Current Codebase

- `/lib/ai/models-data.json` - Current static model configuration
- `/lib/ai/models.ts` - Model configuration logic
- `/lib/ai/providers.ts` - Provider configuration
- `/lib/ai/model-config.ts` - Model configuration utilities
- `/components/model-selector.tsx` - UI component for selecting models

---

**Document Version**: 1.0
**Created**: 2025-10-20
**Last Updated**: 2025-10-20
**Status**: Planning/Design Phase
**Owner**: Development Team
