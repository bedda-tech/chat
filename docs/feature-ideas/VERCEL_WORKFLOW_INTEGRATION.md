# Vercel Workflow Integration

## Overview

Integrate Vercel Workflow, a fully managed platform for building durable applications and AI agents, to enable long-running, resumable workflows with human-in-the-loop capabilities. This transforms the chat application from simple request-response interactions into a platform capable of executing complex, multi-step processes that span minutes, hours, or even days.

**Key Benefits:**
- **Resumable Execution**: Workflows can pause for extended periods (minutes to months) and resume from exactly where they stopped
- **Durability**: Workflows survive deployments, crashes, and infrastructure changes through deterministic replays
- **Human-in-the-Loop**: Enable approval workflows, feedback loops, and collaborative AI-human task execution
- **Built-in Observability**: Automatic logging, metrics, and tracing accessible via Vercel dashboard
- **Simple Developer Experience**: Write async/await TypeScript with workflow directives - no YAML or complex state machines

---

## ⚠️ Dependencies

**Required Before Implementation:**
- ✅ **Usage Analytics & Monitoring** - Track workflow executions, step counts, and quota usage
- ✅ **Pricing & Monetization** - Workflows are premium features with tier-based limits
- ✅ **Advanced Streaming** - Stream workflow progress and step results in real-time

**Recommended (Enhances Workflows):**
- **Code Sandboxes** - Execute code within workflow steps
- **RAG** - Provide document context to workflows
- **AI Video Generation** - Generate content in workflow pipelines
- **Advanced AI Gateway** - Intelligent routing for workflow steps

**Enables:**
- Long-running AI tasks (multi-hour analysis, batch processing)
- Approval workflows (content review, compliance checks)
- Multi-agent orchestration (research → write → edit → fact-check)
- Scheduled content publishing
- Complex automation pipelines
- Real-Time Collaboration (shared team workflows)

**Implementation Timeline:** Month 5-6 (Phase 3)

---

## Motivation

### Current Limitations

The current chat application operates on a simple request-response model:
1. User sends a message
2. AI processes and responds immediately
3. Conversation ends or continues with new request

**Pain Points:**
- ❌ No support for long-running tasks (e.g., multi-hour data analysis, batch processing)
- ❌ No built-in approval workflows for AI-generated content
- ❌ Workflows lost if server restarts during execution
- ❌ Complex multi-step processes require manual coordination
- ❌ Cannot pause execution to wait for external events (user approval, webhook, scheduled time)
- ❌ Difficult to implement retry logic for failed steps
- ❌ No visibility into multi-step workflow progress

### Workflow Benefits

With Vercel Workflow integration:
- ✅ **Multi-Step AI Pipelines**: Chain together multiple AI operations with state persistence
- ✅ **Human Approval Gates**: AI generates content → Human reviews → AI continues based on feedback
- ✅ **Scheduled Execution**: Workflows can sleep for hours/days and resume automatically
- ✅ **Fault Tolerance**: Automatic retries, error handling, and state recovery
- ✅ **Progress Tracking**: Users can see workflow status and intermediate results
- ✅ **Resource Optimization**: Only pay for active execution time, not idle waiting periods

---

## Use Cases

### 1. Content Generation with Approval Workflow

**Scenario**: User requests a comprehensive report that requires multiple review cycles.

**Workflow Steps:**
1. AI generates initial draft
2. Workflow pauses for user review
3. User provides feedback or approves
4. If feedback: AI revises and returns to step 2
5. If approved: AI generates final formatted document
6. Workflow completes with final deliverable

**Value**: Ensures quality control while automating tedious iterations.

---

### 2. Document Processing Pipeline

**Scenario**: User uploads 50 PDFs for analysis and summarization.

**Workflow Steps:**
1. Upload documents to storage
2. Extract text from each PDF (parallel steps)
3. Generate individual summaries (parallel steps with rate limiting)
4. Pause for user review of summaries
5. Generate comparative analysis across all documents
6. Create final report with citations

**Value**: Handle large-scale processing without blocking user or consuming resources during pauses.

---

### 3. Scheduled Content Publishing

**Scenario**: User wants to generate and schedule social media posts across the week.

**Workflow Steps:**
1. AI generates 7 daily posts
2. User reviews and edits each
3. Workflow sleeps until scheduled time for each post
4. At scheduled time: Post to social media via API
5. Wait for engagement metrics
6. Generate analytics report at end of week

**Value**: Single workflow manages entire week-long campaign with minimal manual intervention.

---

### 4. Multi-Agent Collaboration

**Scenario**: Complex task requiring specialized AI agents (researcher, writer, editor, fact-checker).

**Workflow Steps:**
1. Research agent gathers information
2. Wait for user to validate sources
3. Writer agent creates draft
4. Editor agent refines language and structure
5. Fact-checker agent validates claims
6. Workflow pauses for final human review
7. Publish or iterate based on feedback

**Value**: Orchestrate multiple specialized AI agents with checkpoints and human oversight.

---

### 5. Interactive Code Review & Testing

**Scenario**: AI assists with code review that requires running tests and getting developer input.

**Workflow Steps:**
1. AI analyzes code changes
2. Generates initial review comments
3. Runs automated tests in sandbox
4. Pauses for developer to address issues
5. Developer commits fixes
6. Workflow resumes: re-runs tests
7. If tests pass: approve PR
8. If tests fail: return to step 4

**Value**: Automated yet collaborative code review process.

---

### 6. Data Analysis with Iterative Refinement

**Scenario**: User wants insights from large dataset with ability to drill down.

**Workflow Steps:**
1. Load and validate dataset
2. Perform initial statistical analysis
3. Generate preliminary insights
4. Present to user with visualization options
5. User requests specific drill-down analysis
6. Perform deep-dive analysis
7. Generate charts and detailed report
8. Workflow completes or loops for more exploration

**Value**: Interactive, stateful data exploration sessions.

---

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Chat Application                         │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Chat UI     │────│  Chat API    │────│  Workflow    │ │
│  │               │    │              │    │  Orchestrator│ │
│  └───────────────┘    └──────────────┘    └──────────────┘ │
│                              │                     │         │
│                              │                     │         │
│  ┌───────────────────────────┼─────────────────────┼────┐  │
│  │         Vercel Workflow   │                     │    │  │
│  │  ┌────────────────────────▼─────────────────────▼──┐ │  │
│  │  │              Workflow Engine                     │ │  │
│  │  ├──────────────────────────────────────────────────┤ │  │
│  │  │  • Execution Context (State Management)          │ │  │
│  │  │  • Step Isolation & Retry Logic                  │ │  │
│  │  │  • Sleep/Await External Events                   │ │  │
│  │  │  • Deterministic Replay on Failures              │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │  Workflow  │  │  Workflow  │  │  Workflow  │     │  │
│  │  │  Instance  │  │  Instance  │  │  Instance  │     │  │
│  │  │    #1      │  │    #2      │  │    #3      │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘     │  │
│  └────────────────────────────────────────────────────────┘  │
│                              │                               │
├──────────────────────────────┼───────────────────────────────┤
│  ┌───────────────┐    ┌──────▼─────┐    ┌──────────────┐   │
│  │  PostgreSQL   │    │   Vercel   │    │  AI Gateway  │   │
│  │  (Workflow    │    │  Storage   │    │  (AI Models) │   │
│  │   Metadata)   │    │ (Artifacts)│    │              │   │
│  └───────────────┘    └────────────┘    └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation

### Phase 1: Basic Workflow Support (Week 1-2)

#### 1.1 Vercel Workflow Setup

**Install Dependencies:**
```bash
npm install @upstash/workflow
```

**Environment Configuration:**
```env
# .env.local
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_qstash_token
```

#### 1.2 Basic Workflow Definition

**File**: `lib/workflows/content-generation.ts`

```typescript
'use workflow';

import { step, sleep, hook } from '@upstash/workflow';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

interface ContentWorkflowInput {
  userId: string;
  chatId: string;
  prompt: string;
  requiresApproval: boolean;
}

interface ContentWorkflowState {
  draft: string;
  revisions: number;
  approved: boolean;
  finalContent: string;
}

export async function contentGenerationWorkflow(
  input: ContentWorkflowInput
): Promise<ContentWorkflowState> {
  const state: ContentWorkflowState = {
    draft: '',
    revisions: 0,
    approved: false,
    finalContent: '',
  };

  // Step 1: Generate initial draft
  const draft = await step('generate-draft', async () => {
    const result = await generateText({
      model: openai('gpt-4-turbo'),
      prompt: input.prompt,
      system: 'You are a helpful content creator.',
    });

    return result.text;
  });

  state.draft = draft;

  // Step 2: Wait for user approval (if required)
  if (input.requiresApproval) {
    const approval = await hook('user-approval', {
      chatId: input.chatId,
      content: draft,
      timeout: 24 * 60 * 60 * 1000, // 24 hours
    });

    if (!approval.approved && approval.feedback) {
      // Step 3: Revise based on feedback
      const revision = await step('revise-content', async () => {
        const result = await generateText({
          model: openai('gpt-4-turbo'),
          prompt: `Original content: ${draft}\n\nUser feedback: ${approval.feedback}\n\nPlease revise the content based on the feedback.`,
        });

        return result.text;
      });

      state.draft = revision;
      state.revisions++;

      // Return to approval step (recursive call or loop)
      // For simplicity, limiting to one revision in this example
    }

    state.approved = approval.approved;
  }

  // Step 4: Finalize content
  state.finalContent = await step('finalize-content', async () => {
    // Add formatting, metadata, etc.
    return `# Final Content\n\n${state.draft}\n\n---\n*Generated with AI assistance*`;
  });

  return state;
}
```

#### 1.3 Workflow API Route

**File**: `app/api/workflows/content-generation/route.ts`

```typescript
import { serve } from '@upstash/workflow/nextjs';
import { contentGenerationWorkflow } from '@/lib/workflows/content-generation';

export const POST = serve(
  contentGenerationWorkflow,
  {
    // Workflow configuration
    verbose: true,
    retries: 3,
    failureUrl: '/api/workflows/failed',
  }
);
```

#### 1.4 Trigger Workflow from Chat

**File**: `app/(chat)/api/chat/route.ts` (additions)

```typescript
import { WorkflowClient } from '@upstash/workflow';

const workflowClient = new WorkflowClient({
  baseUrl: process.env.QSTASH_URL!,
  token: process.env.QSTASH_TOKEN!,
});

// In the chat route handler
if (requiresWorkflow) {
  // Start workflow instead of immediate AI response
  const workflowRun = await workflowClient.trigger({
    url: `${process.env.APP_URL}/api/workflows/content-generation`,
    body: {
      userId: session.user.id,
      chatId: id,
      prompt: messages[messages.length - 1].content,
      requiresApproval: true,
    },
  });

  // Store workflow ID in database
  await db.insert(chatWorkflows).values({
    chatId: id,
    workflowId: workflowRun.workflowRunId,
    status: 'running',
    createdAt: new Date(),
  });

  // Return workflow status to user
  return new Response(
    JSON.stringify({
      type: 'workflow-started',
      workflowId: workflowRun.workflowRunId,
      message: 'Workflow started. You will be notified when action is required.',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

---

### Phase 2: Human-in-the-Loop (Week 3-4)

#### 2.1 Workflow Hook Handler

**File**: `app/api/workflows/hooks/[hookId]/route.ts`

```typescript
export async function POST(
  request: Request,
  { params }: { params: { hookId: string } }
) {
  const { action, data } = await request.json();
  const session = await auth();

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Resume workflow with user decision
  await workflowClient.resumeHook({
    hookId: params.hookId,
    data: {
      approved: action === 'approve',
      feedback: data?.feedback,
      userId: session.user.id,
    },
  });

  return new Response(JSON.stringify({ success: true }));
}
```

#### 2.2 Approval UI Component

**File**: `components/workflow/workflow-approval.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkflowApprovalProps {
  hookId: string;
  content: string;
  workflowType: string;
}

export function WorkflowApproval({ hookId, content, workflowType }: WorkflowApprovalProps) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (action: 'approve' | 'reject' | 'revise') => {
    setIsSubmitting(true);

    try {
      await fetch(`/api/workflows/hooks/${hookId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          data: { feedback: action === 'revise' ? feedback : undefined },
        }),
      });

      // Refresh or redirect
      window.location.reload();
    } catch (error) {
      console.error('Failed to submit workflow action:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="my-4">
      <CardHeader>
        <CardTitle>Workflow Approval Required</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-muted rounded-md">
          <pre className="whitespace-pre-wrap">{content}</pre>
        </div>
        <Textarea
          placeholder="Provide feedback for revision (optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
        />
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          onClick={() => handleAction('approve')}
          disabled={isSubmitting}
          variant="default"
        >
          Approve
        </Button>
        <Button
          onClick={() => handleAction('revise')}
          disabled={isSubmitting || !feedback}
          variant="secondary"
        >
          Request Revision
        </Button>
        <Button
          onClick={() => handleAction('reject')}
          disabled={isSubmitting}
          variant="destructive"
        >
          Reject
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

### Phase 3: Advanced Workflows (Month 2-3)

#### 3.1 Multi-Step Document Processing

**File**: `lib/workflows/document-processing.ts`

```typescript
'use workflow';

import { step, sleep, parallel } from '@upstash/workflow';

interface Document {
  id: string;
  url: string;
  type: string;
}

export async function documentProcessingWorkflow(documents: Document[]) {
  // Step 1: Parallel document extraction
  const extractedTexts = await parallel(
    'extract-documents',
    documents.map((doc) => async () => {
      return await step(`extract-${doc.id}`, async () => {
        // Extract text from document
        const response = await fetch(`/api/extract?url=${doc.url}`);
        return response.json();
      });
    })
  );

  // Step 2: Generate individual summaries with rate limiting
  const summaries = [];
  for (const [index, text] of extractedTexts.entries()) {
    const summary = await step(`summarize-${index}`, async () => {
      const result = await generateText({
        model: openai('gpt-4-turbo'),
        prompt: `Summarize the following document:\n\n${text}`,
      });
      return result.text;
    });

    summaries.push(summary);

    // Rate limiting: wait 1 second between API calls
    if (index < extractedTexts.length - 1) {
      await sleep('rate-limit', 1000);
    }
  }

  // Step 3: Wait for user review
  const reviewData = await hook('review-summaries', {
    summaries,
    timeout: 48 * 60 * 60 * 1000, // 48 hours
  });

  // Step 4: Generate comparative analysis
  const analysis = await step('generate-analysis', async () => {
    const result = await generateText({
      model: openai('gpt-4-turbo'),
      prompt: `Generate a comparative analysis of these summaries:\n\n${summaries.join('\n\n---\n\n')}`,
    });
    return result.text;
  });

  return {
    summaries,
    analysis,
    userFeedback: reviewData,
  };
}
```

#### 3.2 Scheduled Content Publishing

**File**: `lib/workflows/scheduled-publishing.ts`

```typescript
'use workflow';

import { step, sleep } from '@upstash/workflow';
import { addDays, differenceInMilliseconds } from 'date-fns';

interface PostSchedule {
  content: string;
  scheduledTime: Date;
  platform: string;
}

export async function scheduledPublishingWorkflow(posts: PostSchedule[]) {
  const results = [];

  for (const post of posts) {
    // Calculate sleep duration
    const sleepDuration = differenceInMilliseconds(post.scheduledTime, new Date());

    // Sleep until scheduled time
    if (sleepDuration > 0) {
      await sleep(`wait-for-${post.platform}`, sleepDuration);
    }

    // Publish to platform
    const publishResult = await step(`publish-${post.platform}`, async () => {
      const response = await fetch(`/api/integrations/${post.platform}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: post.content }),
      });

      return response.json();
    });

    results.push({
      platform: post.platform,
      published: true,
      result: publishResult,
    });
  }

  return results;
}
```

#### 3.3 Multi-Agent Orchestration

**File**: `lib/workflows/multi-agent.ts`

```typescript
'use workflow';

import { step, hook } from '@upstash/workflow';

interface AgentTask {
  agent: string;
  prompt: string;
  requiresReview?: boolean;
}

export async function multiAgentWorkflow(task: string) {
  // Step 1: Research Agent
  const research = await step('research-agent', async () => {
    const result = await generateText({
      model: openai('gpt-4-turbo'),
      prompt: task,
      system: 'You are a research specialist. Gather comprehensive information on the topic.',
    });
    return result.text;
  });

  // Wait for user to validate sources
  await hook('validate-sources', {
    research,
    timeout: 12 * 60 * 60 * 1000, // 12 hours
  });

  // Step 2: Writer Agent
  const draft = await step('writer-agent', async () => {
    const result = await generateText({
      model: openai('gpt-4-turbo'),
      prompt: `Based on this research:\n\n${research}\n\nWrite a comprehensive article.`,
      system: 'You are a professional writer. Create engaging, well-structured content.',
    });
    return result.text;
  });

  // Step 3: Editor Agent
  const edited = await step('editor-agent', async () => {
    const result = await generateText({
      model: openai('gpt-4-turbo'),
      prompt: `Edit this draft for clarity and flow:\n\n${draft}`,
      system: 'You are an expert editor. Refine language and structure.',
    });
    return result.text;
  });

  // Step 4: Fact-Checker Agent
  const factCheck = await step('fact-checker-agent', async () => {
    const result = await generateText({
      model: openai('gpt-4-turbo'),
      prompt: `Fact-check this content:\n\n${edited}`,
      system: 'You are a fact-checker. Validate all claims and identify any inaccuracies.',
    });
    return result.text;
  });

  // Final human review
  const finalApproval = await hook('final-review', {
    content: edited,
    factCheck,
    timeout: 24 * 60 * 60 * 1000, // 24 hours
  });

  return {
    research,
    draft,
    edited,
    factCheck,
    approved: finalApproval.approved,
    finalContent: edited,
  };
}
```

---

### Phase 4: Workflow Management UI (Month 3-4)

#### 4.1 Workflow Dashboard

**File**: `app/workflows/page.tsx`

```typescript
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { chatWorkflows } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { WorkflowCard } from '@/components/workflow/workflow-card';

export default async function WorkflowsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const workflows = await db
    .select()
    .from(chatWorkflows)
    .where(eq(chatWorkflows.userId, session.user.id))
    .orderBy(chatWorkflows.createdAt, 'desc');

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Workflows</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <WorkflowCard key={workflow.id} workflow={workflow} />
        ))}
      </div>

      {workflows.length === 0 && (
        <p className="text-muted-foreground text-center py-12">
          No workflows yet. Start a conversation that requires multi-step processing!
        </p>
      )}
    </div>
  );
}
```

#### 4.2 Workflow Status Component

**File**: `components/workflow/workflow-status.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface WorkflowStatusProps {
  workflowId: string;
}

export function WorkflowStatus({ workflowId }: WorkflowStatusProps) {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    // Poll for workflow status
    const interval = setInterval(async () => {
      const response = await fetch(`/api/workflows/${workflowId}/status`);
      const data = await response.json();
      setStatus(data);
    }, 2000);

    return () => clearInterval(interval);
  }, [workflowId]);

  if (!status) {
    return <div>Loading workflow status...</div>;
  }

  const progress = (status.completedSteps / status.totalSteps) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Workflow Status</span>
          <Badge variant={status.status === 'running' ? 'default' : 'secondary'}>
            {status.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={progress} className="mb-4" />

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Step {status.currentStep} of {status.totalSteps}
          </p>
          <p className="font-medium">{status.currentStepName}</p>

          {status.waitingFor && (
            <Badge variant="outline" className="mt-2">
              Waiting for: {status.waitingFor}
            </Badge>
          )}
        </div>

        {status.steps && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-semibold">Steps:</h4>
            <ul className="space-y-1">
              {status.steps.map((step: any, index: number) => (
                <li key={index} className="text-sm flex items-center gap-2">
                  {step.completed ? '✓' : index === status.currentStep ? '⏳' : '○'}
                  <span className={step.completed ? 'text-muted-foreground' : ''}>
                    {step.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Database Schema

**File**: `lib/db/schema.ts` (additions)

```typescript
export const chatWorkflows = pgTable('chat_workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id')
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  workflowId: text('workflow_id').notNull().unique(),
  workflowType: text('workflow_type').notNull(),
  status: text('status').notNull().default('running'), // running, paused, completed, failed
  currentStep: text('current_step'),
  totalSteps: integer('total_steps'),
  completedSteps: integer('completed_steps').default(0),
  metadata: jsonb('metadata'), // Store workflow-specific data
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

export const workflowHooks = pgTable('workflow_hooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: text('workflow_id')
    .notNull()
    .references(() => chatWorkflows.workflowId),
  hookId: text('hook_id').notNull().unique(),
  hookType: text('hook_type').notNull(), // approval, feedback, webhook
  status: text('status').notNull().default('waiting'), // waiting, resolved, expired
  data: jsonb('data'), // Hook-specific data
  response: jsonb('response'), // User's response
  expiresAt: timestamp('expires_at'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const workflowSteps = pgTable('workflow_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: text('workflow_id')
    .notNull()
    .references(() => chatWorkflows.workflowId),
  stepName: text('step_name').notNull(),
  stepIndex: integer('step_index').notNull(),
  status: text('status').notNull(), // pending, running, completed, failed, skipped
  input: jsonb('input'),
  output: jsonb('output'),
  error: text('error'),
  retryCount: integer('retry_count').default(0),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

**Migration**: `lib/db/migrations/0009_workflow_support.sql`

```sql
CREATE TABLE IF NOT EXISTS chat_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chat(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  workflow_id TEXT NOT NULL UNIQUE,
  workflow_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  current_step TEXT,
  total_steps INTEGER,
  completed_steps INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL REFERENCES chat_workflows(workflow_id),
  hook_id TEXT NOT NULL UNIQUE,
  hook_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  data JSONB,
  response JSONB,
  expires_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL REFERENCES chat_workflows(workflow_id),
  step_name TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  status TEXT NOT NULL,
  input JSONB,
  output JSONB,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_workflows_user ON chat_workflows(user_id);
CREATE INDEX idx_chat_workflows_chat ON chat_workflows(chat_id);
CREATE INDEX idx_chat_workflows_status ON chat_workflows(status);
CREATE INDEX idx_workflow_hooks_workflow ON workflow_hooks(workflow_id);
CREATE INDEX idx_workflow_hooks_status ON workflow_hooks(status);
CREATE INDEX idx_workflow_steps_workflow ON workflow_steps(workflow_id);
```

---

## Cost Analysis

### Vercel Workflow Pricing (Enterprise/Pro)

**Workflow Steps (Per Million)**:
- First 1M steps: Included in plan
- Additional steps: $0.60 per 1,000 steps

**Workflow Storage**:
- First 10 GB: Included
- Additional storage: $0.10 per GB/month

### Example Costs

#### Scenario 1: 1,000 Users, Light Workflow Usage
- 1,000 users × 5 workflows/month = 5,000 workflows
- Average 10 steps per workflow = 50,000 steps
- **Cost**: Included in plan (< 1M steps)

#### Scenario 2: 10,000 Users, Moderate Usage
- 10,000 users × 10 workflows/month = 100,000 workflows
- Average 15 steps per workflow = 1.5M steps
- **Steps cost**: (1.5M - 1M) × ($0.60 / 1,000) = $300/month
- **Storage**: ~5 GB = Included
- **Total**: $300/month

#### Scenario 3: 50,000 Users, Heavy Usage
- 50,000 users × 15 workflows/month = 750,000 workflows
- Average 20 steps per workflow = 15M steps
- **Steps cost**: (15M - 1M) × ($0.60 / 1,000) = $8,400/month
- **Storage**: ~50 GB = $4/month
- **Total**: $8,404/month

### Cost Comparison with Alternatives

**Without Workflows (Current State)**:
- Complex multi-step tasks require multiple API calls
- No state persistence = re-running from scratch on failures
- Higher AI costs due to redundant processing
- Estimated: $12,000/month for 50k users (20% higher)

**With Workflows**:
- State persistence reduces redundant AI calls
- Retry logic prevents wasted processing
- Cheaper per-step execution vs full AI calls
- Estimated: $10,000/month total (AI + Workflow costs)

**Net Savings**: ~$2,000/month at 50k users (17% reduction)

---

## Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Install and configure Vercel Workflow SDK
- [ ] Set up Upstash Redis and QStash
- [ ] Create database schema for workflow tracking
- [ ] Implement basic workflow (content generation)
- [ ] Create workflow API routes
- [ ] Integrate workflow triggers in chat API
- [ ] Add workflow status tracking
- [ ] Test basic workflow execution
- [ ] Deploy to staging environment

### Phase 2: Human-in-the-Loop (Week 3-4)
- [ ] Implement workflow hooks system
- [ ] Create approval UI components
- [ ] Build hook handler API routes
- [ ] Add notification system for pending approvals
- [ ] Implement timeout handling for hooks
- [ ] Create workflow dashboard page
- [ ] Test approval workflows end-to-end
- [ ] Add email notifications for approvals

### Phase 3: Advanced Workflows (Month 2-3)
- [ ] Implement document processing workflow
- [ ] Create scheduled publishing workflow
- [ ] Build multi-agent orchestration workflow
- [ ] Add parallel step execution support
- [ ] Implement workflow templates system
- [ ] Create workflow builder UI (optional)
- [ ] Add workflow analytics and monitoring
- [ ] Optimize workflow performance

### Phase 4: Production & Scale (Month 3-4)
- [ ] Implement workflow retry and error handling
- [ ] Add workflow cancellation support
- [ ] Create admin workflow management dashboard
- [ ] Implement workflow cost tracking
- [ ] Add workflow rate limiting per tier
- [ ] Create comprehensive workflow documentation
- [ ] Load testing and optimization
- [ ] Production deployment
- [ ] User training and onboarding materials

---

## Success Metrics

### Technical Metrics
- **Workflow Completion Rate**: >95%
- **Average Workflow Duration**: Varies by type (track by workflow type)
- **Step Failure Rate**: <2%
- **Workflow Uptime**: >99.5%
- **Average Steps per Workflow**: 8-15
- **Hook Resolution Time**: <4 hours (median)

### Business Metrics
- **Workflow Adoption Rate**: >30% of active users
- **Premium Feature Driver**: Workflows as top 3 reason for upgrades
- **User Satisfaction**: 4.5+ rating for workflow features
- **Time Saved**: >10 hours/user/month (for power users)
- **Cost Efficiency**: 15-20% reduction in AI costs vs non-workflow approach

### User Metrics
- **Active Workflows per User**: 5-10/month
- **Workflow Types Used**: Track most popular workflow patterns
- **Approval Response Rate**: >80% within 24 hours
- **Workflow Sharing**: >20% of users share workflow templates
- **Return Usage**: >60% of users use workflows repeatedly

---

## Migration Strategy

### Phase 1: Beta Launch (Month 1)
1. Enable for internal team testing
2. Invite 100 beta users (power users, premium tier)
3. Gather feedback on workflow UX
4. Iterate on workflow templates
5. Document common patterns

### Phase 2: Soft Launch (Month 2)
1. Enable for all premium tier users
2. Add workflow onboarding tutorial
3. Create workflow template library
4. Monitor usage patterns and costs
5. Optimize based on real-world usage

### Phase 3: General Availability (Month 3)
1. Enable for pro tier users (limited workflows)
2. Add workflow quotas by tier:
   - Free: 0 workflows
   - Pro: 10 workflows/month
   - Premium: 50 workflows/month
   - Enterprise: Unlimited
3. Launch marketing campaign
4. Create video tutorials and documentation
5. Monitor scaling and performance

### Phase 4: Optimization (Month 4+)
1. Add workflow marketplace (user-created templates)
2. Implement workflow sharing and collaboration
3. Add advanced workflow analytics
4. Optimize costs based on usage patterns
5. Expand workflow capabilities based on user requests

---

## Risk Mitigation

### Technical Risks

**Risk 1: Workflow Execution Failures**
- **Mitigation**: Implement robust retry logic with exponential backoff
- **Fallback**: Manual workflow continuation by support team
- **Monitoring**: Alert on failure rate >5%

**Risk 2: Long-Running Workflow Costs**
- **Mitigation**: Set maximum workflow duration (7 days default)
- **Fallback**: Workflow timeout with user notification
- **Monitoring**: Track workflow duration distribution

**Risk 3: Hook Expiration**
- **Mitigation**: Send reminder notifications before expiration
- **Fallback**: Allow hook re-triggering by user
- **Monitoring**: Track expiration rates

### Business Risks

**Risk 1: Low Adoption**
- **Mitigation**: Create compelling workflow templates
- **Fallback**: Enhanced onboarding and tutorials
- **Monitoring**: Track weekly active workflow users

**Risk 2: Cost Overruns**
- **Mitigation**: Implement per-tier workflow quotas
- **Fallback**: Additional workflow charges for over-quota
- **Monitoring**: Daily cost tracking and alerts

**Risk 3: User Confusion**
- **Mitigation**: Simple, guided workflow creation
- **Fallback**: Pre-built templates for common use cases
- **Monitoring**: Support ticket volume on workflows

---

## Future Enhancements

### Short-term (3-6 months)
1. **Workflow Templates Marketplace**: User-created and shared workflow templates
2. **Visual Workflow Builder**: Drag-and-drop workflow creation UI
3. **Workflow Versioning**: Track and rollback workflow versions
4. **Team Workflows**: Shared workflows across team members
5. **Advanced Scheduling**: Cron-like scheduling for recurring workflows

### Medium-term (6-12 months)
1. **Workflow Branching**: Conditional execution paths
2. **Sub-workflows**: Compose workflows from reusable components
3. **Workflow Analytics Dashboard**: Deep insights into workflow performance
4. **External Integrations**: Zapier-like connections to third-party services
5. **Workflow API**: Allow users to trigger workflows via API

### Long-term (12+ months)
1. **AI-Powered Workflow Optimization**: Automatically improve workflow efficiency
2. **Workflow Recommendations**: Suggest workflows based on user behavior
3. **Multi-tenant Workflows**: Enterprise-grade isolation and controls
4. **Workflow Debugging Tools**: Step-by-step debugging and replay
5. **Workflow Collaboration**: Real-time co-editing of workflows

---

## Competitive Analysis

### Competitors Offering Workflow Features

**Zapier**:
- ✅ Extensive integration ecosystem
- ✅ Visual workflow builder
- ❌ Not AI-native
- ❌ Limited AI agent capabilities

**n8n**:
- ✅ Self-hosted option
- ✅ Complex workflow support
- ❌ Requires technical setup
- ❌ Not focused on AI workflows

**LangChain / LangSmith**:
- ✅ AI-native workflows
- ✅ Agent orchestration
- ❌ Developer-focused (not end-user)
- ❌ Requires coding

**ChatGPT / Claude**:
- ❌ No workflow support
- ❌ No human-in-the-loop approvals
- ❌ No long-running tasks
- ❌ Single-session only

### Our Competitive Advantages

1. **AI-Native**: Built specifically for AI agent workflows
2. **User-Friendly**: No coding required for basic workflows
3. **Human-in-the-Loop**: Seamless approval and feedback integration
4. **Durable**: Workflows survive deployments and failures
5. **Integrated**: Deeply integrated with existing chat interface
6. **Affordable**: Competitive pricing with generous free tier

---

## Dependencies

### Infrastructure
- **Upstash Redis**: Workflow state storage
- **Upstash QStash**: Workflow execution queue
- **PostgreSQL**: Workflow metadata and tracking
- **Vercel Hosting**: Deployment platform

### External Services
- **AI Gateway**: For AI model calls within workflows
- **Email Service**: For workflow notifications (Resend)
- **Storage**: For workflow artifacts (Vercel Blob)

### Code Dependencies
- `@upstash/workflow`: Core workflow SDK
- `@upstash/redis`: Redis client
- `@upstash/qstash`: Queue client
- `ai`: AI SDK for model calls
- `drizzle-orm`: Database ORM
- `date-fns`: Date utilities

---

## Documentation Plan

### User Documentation
1. **Getting Started with Workflows**: Introduction and basic concepts
2. **Workflow Templates Library**: Pre-built workflows for common tasks
3. **Creating Custom Workflows**: Guide for advanced users
4. **Approval & Feedback**: How to respond to workflow hooks
5. **Workflow Monitoring**: Track and manage active workflows
6. **Troubleshooting**: Common issues and solutions

### Developer Documentation
1. **Workflow Architecture**: System design and components
2. **Creating New Workflow Types**: Developer guide
3. **Workflow API Reference**: Complete API documentation
4. **Testing Workflows**: Unit and integration testing guide
5. **Deployment Guide**: Production deployment checklist
6. **Performance Optimization**: Best practices for efficient workflows

### Admin Documentation
1. **Workflow Analytics**: Understanding usage metrics
2. **Cost Management**: Tracking and optimizing workflow costs
3. **User Management**: Managing workflow quotas by tier
4. **Troubleshooting**: Diagnosing and resolving workflow issues
5. **Scaling Considerations**: Planning for growth

---

## Conclusion

Vercel Workflow integration transforms the chat application from a simple conversational AI into a powerful platform for orchestrating complex, multi-step processes. By enabling durable, resumable workflows with human-in-the-loop capabilities, we unlock entirely new use cases and create significant competitive differentiation.

**Key Takeaways:**
- **High Impact**: Enables entirely new use cases (document processing, content pipelines, multi-agent tasks)
- **Moderate Effort**: 3-4 month implementation timeline with phased rollout
- **Strong ROI**: 15-20% cost savings + new premium feature for monetization
- **Competitive Advantage**: Few AI chat platforms offer sophisticated workflow capabilities
- **Scalable**: Architecture designed for growth from 1k to 100k+ users

**Recommended Priority**: **High** (Premium tier feature, significant differentiation)

**Next Steps:**
1. Approve budget for Upstash services (~$50-100/month initially)
2. Assign engineering resources (1-2 developers)
3. Begin Phase 1 implementation
4. Recruit beta testers for early feedback
5. Develop workflow template library
