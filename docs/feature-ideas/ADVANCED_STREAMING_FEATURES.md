# Advanced Streaming & Real-Time Features

## Document Purpose
This document outlines advanced streaming capabilities and real-time features to enhance user experience, including streaming UI components, partial tool results, reasoning visualization, collaborative editing, and streaming optimizations.

## 1. Overview

Modern AI applications require sophisticated streaming capabilities beyond basic text streaming. Users expect:
- **Instant feedback**: See responses as they're generated
- **Rich UI updates**: Streaming charts, tables, code blocks
- **Tool execution visibility**: See tools being called in real-time
- **Reasoning transparency**: Watch AI "think" through problems
- **Collaborative features**: Multiple users seeing same stream
- **Partial results**: Useful output before completion

**Benefits**:
- Perceived performance: Feels 10x faster
- User engagement: Users stay engaged during long responses
- Transparency: Users see AI's thought process
- Error recovery: Can stop bad responses early
- Better UX: Smooth, polished experience

## 2. Current State

### What We Have
- Basic text streaming (via AI SDK `streamText`)
- Message display component (`components/messages.tsx`)
- Reasoning display (`components/message-reasoning.tsx`)

### What's Missing
- Streaming UI components (charts, tables, code)
- Partial tool results streaming
- Real-time collaboration
- Streaming cancellation
- Optimized chunk sizes
- Streaming error handling
- Progress indicators
- Typing indicators

## 3. AI SDK Streaming APIs

### Core Streaming Functions

```typescript
import { streamText, streamObject, streamUI } from 'ai';

// 1. Stream text responses
const result = streamText({
  model: gateway.languageModel('anthropic/claude-sonnet-4'),
  messages,
});

// 2. Stream structured objects
const result = streamObject({
  model: gateway.languageModel('openai/gpt-4o'),
  schema: z.object({
    products: z.array(z.object({
      name: z.string(),
      price: z.number(),
    })),
  }),
});

// 3. Stream React components (experimental)
const result = streamUI({
  model: gateway.languageModel('anthropic/claude-sonnet-4'),
  messages,
  text: ({ content }) => <Markdown>{content}</Markdown>,
  tools: {
    weather: {
      component: ({ data }) => <WeatherCard {...data} />,
    },
  },
});
```

## 4. Streaming UI Components

### Implementation Strategy

**File**: `lib/ai/stream-ui.ts`

```typescript
import { streamUI } from 'ai';
import { gateway } from '@/lib/ai/providers';
import { WeatherCard } from '@/components/weather-card';
import { Chart } from '@/components/chart';
import { CodeBlock } from '@/components/code-block';
import { DataTable } from '@/components/data-table';

export async function streamAIResponse(messages: Message[], modelId: string) {
  return streamUI({
    model: gateway.languageModel(modelId),
    messages,

    // Default text rendering
    text: ({ content, done }) => {
      return (
        <div className="prose">
          <Markdown>{content}</Markdown>
          {!done && <BlinkingCursor />}
        </div>
      );
    },

    // Stream tool results as React components
    tools: {
      getWeather: {
        description: 'Get weather for a location',
        parameters: z.object({
          location: z.string(),
        }),
        generate: async ({ location }) => {
          const weather = await fetchWeather(location);
          return weather;
        },
        component: ({ data, done }) => {
          // Stream partial weather data
          return (
            <WeatherCard
              {...data}
              loading={!done}
              className="animate-fade-in"
            />
          );
        },
      },

      createChart: {
        description: 'Create a data visualization',
        parameters: z.object({
          type: z.enum(['bar', 'line', 'pie']),
          data: z.array(z.object({
            label: z.string(),
            value: z.number(),
          })),
        }),
        generate: async ({ type, data }) => {
          return { type, data };
        },
        component: ({ data, done }) => {
          return (
            <Chart
              type={data.type}
              data={data.data}
              animated={!done}
            />
          );
        },
      },

      generateCode: {
        description: 'Generate code',
        parameters: z.object({
          language: z.string(),
          code: z.string(),
        }),
        generate: async ({ language, code }) => {
          return { language, code };
        },
        component: ({ data }) => {
          return (
            <CodeBlock
              language={data.language}
              code={data.code}
              copyable
              runnable
            />
          );
        },
      },

      createTable: {
        description: 'Create a data table',
        parameters: z.object({
          columns: z.array(z.string()),
          rows: z.array(z.array(z.string())),
        }),
        generate: async ({ columns, rows }) => {
          return { columns, rows };
        },
        component: ({ data, done }) => {
          return (
            <DataTable
              columns={data.columns}
              rows={data.rows}
              loading={!done}
              sortable
              filterable
            />
          );
        },
      },
    },
  });
}
```

## 5. Streaming Structured Data

### Progressive Object Streaming

```typescript
import { streamObject } from 'ai';
import { z } from 'zod';

export async function streamStructuredData(prompt: string) {
  const { partialObjectStream } = streamObject({
    model: gateway.languageModel('openai/gpt-4o'),
    schema: z.object({
      products: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          price: z.number(),
          inStock: z.boolean(),
          rating: z.number().optional(),
        })
      ),
    }),
    prompt,
  });

  // Stream partial results as they arrive
  for await (const partialObject of partialObjectStream) {
    console.log('Partial result:', partialObject);

    // UI can display partial products as they're generated
    // partialObject.products might be:
    // []
    // [{ name: "Product 1" }]
    // [{ name: "Product 1", description: "..." }]
    // [{ name: "Product 1", description: "...", price: 99 }, { name: "Product 2" }]
  }
}
```

**UI Component**:

```tsx
'use client';

import { useState, useEffect } from 'react';

export function StreamingTable({ streamUrl }: { streamUrl: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Update with partial data
      setProducts(data.products || []);

      if (data.done) {
        setLoading(false);
        eventSource.close();
      }
    };

    return () => eventSource.close();
  }, [streamUrl]);

  return (
    <div>
      <table className="w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
            <th>In Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, idx) => (
            <tr key={idx} className="animate-fade-in">
              <td>{product.name || <Skeleton />}</td>
              <td>{product.description || <Skeleton />}</td>
              <td>{product.price ? `$${product.price}` : <Skeleton />}</td>
              <td>{product.inStock !== undefined ? (product.inStock ? '✓' : '✗') : <Skeleton />}</td>
            </tr>
          ))}
          {loading && (
            <tr>
              <td colSpan={4}>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating more products...</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

## 6. Reasoning Visualization

### Extended Thinking Streaming

Claude's extended thinking can be streamed and visualized:

```typescript
import { streamText } from 'ai';

export async function streamWithReasoning(messages: Message[], modelId: string) {
  const { textStream, reasoningStream } = streamText({
    model: gateway.languageModel(modelId),
    messages,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'stream-with-reasoning',
    },
  });

  return {
    textStream,
    reasoningStream, // Stream of reasoning tokens
  };
}
```

**UI Component**:

```tsx
'use client';

export function ReasoningVisualizer({ reasoningStream }: Props) {
  const [reasoning, setReasoning] = useState<string>('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      for await (const chunk of reasoningStream) {
        setReasoning((prev) => prev + chunk);
      }
    })();
  }, [reasoningStream]);

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium"
      >
        <Brain className="h-4 w-4" />
        <span>Thinking process</span>
        {expanded ? <ChevronUp /> : <ChevronDown />}
      </button>

      {expanded && (
        <div className="mt-2 text-sm text-gray-600 font-mono whitespace-pre-wrap animate-fade-in">
          {reasoning}
          <BlinkingCursor />
        </div>
      )}
    </div>
  );
}
```

## 7. Streaming Cancellation

### Allow Users to Stop Generation

```typescript
'use client';

import { useState } from 'react';

export function CancellableStream() {
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [streaming, setStreaming] = useState(false);

  const startStream = async () => {
    const controller = new AbortController();
    setAbortController(controller);
    setStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
        signal: controller.signal,
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        // Process chunk...
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Stream cancelled by user');
      }
    } finally {
      setStreaming(false);
      setAbortController(null);
    }
  };

  const cancelStream = () => {
    abortController?.abort();
  };

  return (
    <div>
      {streaming && (
        <button onClick={cancelStream} className="text-red-500">
          Stop generating
        </button>
      )}
    </div>
  );
}
```

## 8. Real-Time Collaboration

### Multi-User Streaming

Allow multiple users to see the same AI response stream:

**File**: `lib/realtime/broadcast.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export class StreamBroadcaster {
  private channel: RealtimeChannel;

  constructor(sessionId: string) {
    this.channel = supabase.channel(`session:${sessionId}`);
  }

  /**
   * Broadcast stream chunk to all connected clients
   */
  async broadcast(chunk: string): Promise<void> {
    await this.channel.send({
      type: 'broadcast',
      event: 'stream_chunk',
      payload: { chunk },
    });
  }

  /**
   * Subscribe to stream updates
   */
  subscribe(callback: (chunk: string) => void): void {
    this.channel
      .on('broadcast', { event: 'stream_chunk' }, ({ payload }) => {
        callback(payload.chunk);
      })
      .subscribe();
  }

  async close(): Promise<void> {
    await supabase.removeChannel(this.channel);
  }
}
```

**Usage**:

```typescript
// Server-side: Broadcast stream to all users
const broadcaster = new StreamBroadcaster(sessionId);

for await (const chunk of textStream) {
  await broadcaster.broadcast(chunk);
}

// Client-side: Subscribe to stream
const broadcaster = new StreamBroadcaster(sessionId);

broadcaster.subscribe((chunk) => {
  setMessages((prev) => {
    const lastMessage = prev[prev.length - 1];
    return [
      ...prev.slice(0, -1),
      { ...lastMessage, content: lastMessage.content + chunk },
    ];
  });
});
```

## 9. Streaming Optimizations

### Chunk Size Optimization

```typescript
export async function optimizedStream(messages: Message[]) {
  const result = streamText({
    model: gateway.languageModel('anthropic/claude-sonnet-4'),
    messages,
    experimental_streamConfig: {
      // Smaller chunks = more frequent updates (better UX)
      // Larger chunks = fewer network requests (better performance)
      chunkSize: 10, // Default is 1 token
    },
  });

  return result;
}
```

### Buffered Streaming

```typescript
class BufferedStream {
  private buffer: string[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor(private callback: (chunk: string) => void) {
    // Flush buffer every 100ms
    this.flushInterval = setInterval(() => this.flush(), 100);
  }

  add(chunk: string): void {
    this.buffer.push(chunk);

    // Flush if buffer gets too large
    if (this.buffer.length > 50) {
      this.flush();
    }
  }

  flush(): void {
    if (this.buffer.length === 0) return;

    const combined = this.buffer.join('');
    this.buffer = [];
    this.callback(combined);
  }

  close(): void {
    clearInterval(this.flushInterval);
    this.flush();
  }
}

// Usage
const buffered = new BufferedStream((chunk) => {
  // Send to client
  res.write(chunk);
});

for await (const chunk of textStream) {
  buffered.add(chunk);
}

buffered.close();
```

## 10. Streaming Error Handling

### Graceful Degradation

```typescript
export async function robustStream(messages: Message[], modelId: string) {
  try {
    const result = await streamText({
      model: gateway.languageModel(modelId),
      messages,
      maxRetries: 3,
      onError: ({ error, retry }) => {
        console.error('Stream error:', error);

        // Retry with exponential backoff
        if (retry < 3) {
          setTimeout(() => retry(), 1000 * Math.pow(2, retry));
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    // Fallback to non-streaming if streaming fails
    const { text } = await generateText({
      model: gateway.languageModel(modelId),
      messages,
    });

    return new Response(text);
  }
}
```

## 11. Progress Indicators

### Streaming with Progress

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';

export function StreamWithProgress({ prompt }: { prompt: string }) {
  const [progress, setProgress] = useState(0);
  const [content, setContent] = useState('');
  const [estimatedTotal, setEstimatedTotal] = useState(0);

  useEffect(() => {
    let tokenCount = 0;

    fetch('/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }).then(async (response) => {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      // Estimate total tokens (rough)
      setEstimatedTotal(prompt.length / 4 * 2); // Assume 2x response length

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setContent((prev) => prev + chunk);

        tokenCount += chunk.length / 4;
        setProgress((tokenCount / estimatedTotal) * 100);
      }

      setProgress(100);
    });
  }, [prompt]);

  return (
    <div className="space-y-4">
      <Progress value={progress} className="w-full" />
      <div className="prose">
        <Markdown>{content}</Markdown>
        {progress < 100 && <BlinkingCursor />}
      </div>
    </div>
  );
}
```

## 12. Typing Indicators

### Show AI is "Typing"

```tsx
'use client';

export function TypingIndicator({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="flex items-center gap-2 text-gray-500">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm">AI is thinking...</span>
    </div>
  );
}
```

## 13. Streaming Analytics

### Track Streaming Performance

```typescript
export class StreamAnalytics {
  private startTime: number;
  private firstTokenTime?: number;
  private tokenCount = 0;

  constructor() {
    this.startTime = Date.now();
  }

  recordToken(token: string): void {
    if (!this.firstTokenTime) {
      this.firstTokenTime = Date.now();
    }

    this.tokenCount++;
  }

  getMetrics() {
    const now = Date.now();
    const totalTime = now - this.startTime;
    const timeToFirstToken = this.firstTokenTime
      ? this.firstTokenTime - this.startTime
      : 0;
    const tokensPerSecond = this.tokenCount / (totalTime / 1000);

    return {
      totalTime,
      timeToFirstToken, // Critical UX metric!
      tokenCount: this.tokenCount,
      tokensPerSecond,
    };
  }
}

// Usage
const analytics = new StreamAnalytics();

for await (const chunk of textStream) {
  analytics.recordToken(chunk);
  // Send chunk to client...
}

const metrics = analytics.getMetrics();
console.log('Stream metrics:', metrics);
// Log to monitoring service (DataDog, etc.)
```

## 14. Advanced Use Cases

### 1. Streaming Code Execution

```tsx
export function StreamingCodeExecution() {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');

  const executeCode = async () => {
    // Stream code generation
    const { textStream } = streamText({
      model: gateway.languageModel('anthropic/claude-sonnet-4'),
      prompt: 'Write Python code to calculate fibonacci',
    });

    for await (const chunk of textStream) {
      setCode((prev) => prev + chunk);
    }

    // Execute generated code (in sandbox)
    const result = await fetch('/api/execute', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });

    const reader = result.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const output = decoder.decode(value);
      setOutput((prev) => prev + output);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3>Generated Code</h3>
        <CodeBlock code={code} language="python" />
      </div>
      <div>
        <h3>Execution Output</h3>
        <pre className="bg-black text-green-400 p-4 rounded">{output}</pre>
      </div>
    </div>
  );
}
```

### 2. Streaming Multi-Step Agents

```typescript
export async function streamMultiStepAgent(task: string) {
  const steps = ['analyze', 'plan', 'execute', 'verify'];
  const stepResults: Record<string, string> = {};

  for (const step of steps) {
    console.log(`[Agent] Starting step: ${step}`);

    const { textStream } = streamText({
      model: gateway.languageModel('anthropic/claude-sonnet-4'),
      messages: [
        { role: 'system', content: `You are on step: ${step}` },
        { role: 'user', content: task },
        ...buildContextFromPreviousSteps(stepResults),
      ],
    });

    let stepOutput = '';
    for await (const chunk of textStream) {
      stepOutput += chunk;
      // Broadcast to UI: which step, chunk content
      broadcastStepUpdate(step, stepOutput);
    }

    stepResults[step] = stepOutput;
  }

  return stepResults;
}
```

## 15. Implementation Checklist

- [ ] Implement `streamUI` for rich component streaming
- [ ] Add streaming structured data with `streamObject`
- [ ] Build reasoning visualization component
- [ ] Add stream cancellation functionality
- [ ] Implement real-time collaboration (Supabase Realtime)
- [ ] Optimize chunk sizes for performance
- [ ] Add buffered streaming
- [ ] Implement streaming error handling
- [ ] Build progress indicators
- [ ] Add typing indicators
- [ ] Track streaming analytics (TTFT, tokens/sec)
- [ ] Test streaming with slow connections
- [ ] Add streaming UI components (charts, tables, code)
- [ ] Build streaming code execution
- [ ] Implement multi-step agent streaming

## 16. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Time to First Token (TTFT) | <500ms | Critical for UX |
| Tokens per Second | >50 | Smooth streaming |
| Stream Latency | <100ms | Between chunks |
| Error Rate | <0.1% | Streaming failures |
| Cancellation Time | <200ms | User feedback |

---

**Document Version**: 1.0
**Created**: 2025-10-20
**Last Updated**: 2025-10-20
**Status**: Planning Phase
**Priority**: Medium (UX enhancement)
**Estimated Effort**: 1-2 weeks
**Expected Impact**: 10x better perceived performance
