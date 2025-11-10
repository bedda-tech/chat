# Code Sandboxes

## Overview

Code Sandboxes are secure, isolated server-side environments that allow users to execute code in Python and Node.js with full runtime support. Using **Vercel Sandbox** (beta), we can safely run untrusted or AI-generated code without exposing production systems to risk. Unlike client-side artifacts (HTML, React, SVG) that run in the browser, sandboxes provide isolated backend execution environments with access to package managers, file systems, and external APIs.

**Key Difference from Artifacts:**
- **Artifacts**: Client-side, browser-based, limited to web technologies (HTML/React/SVG)
- **Sandboxes**: Server-side, isolated Linux environments, full language runtimes (Python/Node.js)

---

## ⚠️ Dependencies

**Required Before Implementation:**
- ✅ **Usage Analytics & Monitoring** - For tracking sandbox executions, compute time, and quota enforcement
- ✅ **Pricing & Monetization** - Sandboxes are premium/developer features with tier-based quotas

**Recommended (Enhances Sandboxes):**
- **Advanced Streaming** - Stream sandbox output in real-time for better UX
- **Vercel Workflow** - Long-running code execution and batch processing
- **RAG** - Provide code context and documentation to sandboxes

**Enables:**
- Developer platform capabilities
- Educational use cases (interactive coding tutorials)
- Data science workflows
- Code generation + testing workflows
- Vercel Workflow integration (execute code in workflow steps)

**Implementation Timeline:** Month 3 (Phase 2)

---

## Motivation

### Current Limitations

The existing `code` artifact executes Python in a limited browser environment (Pyodide/WebAssembly), which has constraints:
- ❌ No native module support (binary packages don't work)
- ❌ Limited system access (no file I/O, networking restrictions)
- ❌ No Node.js support
- ❌ Resource limitations (browser memory constraints)
- ❌ Cannot install arbitrary packages with native dependencies
- ❌ Slow package loading (downloads over network each time)

### Sandbox Benefits with Vercel Sandbox

- ✅ **Python 3.13 & Node.js 22**: Latest stable runtimes with full feature support
- ✅ **Full Package Management**: pip, uv, npm, pnpm with caching
- ✅ **Native Dependencies**: Install packages with C extensions (NumPy, Pillow, etc.)
- ✅ **System Access**: File I/O, networking, subprocess execution
- ✅ **Persistent State**: Maintain files and state between executions
- ✅ **Resource Control**: Configurable CPU, memory, and timeout limits
- ✅ **Built-in Observability**: Logs, metrics, and monitoring via Vercel dashboard
- ✅ **Fast Cold Start**: Optimized container initialization
- ✅ **Amazon Linux 2023**: Full Linux environment with dnf package manager

---

## Why Vercel Sandbox?

### Advantages Over Alternatives

**vs. Docker/Self-Hosted:**
- ✅ No infrastructure management
- ✅ Automatic scaling
- ✅ Built-in security and isolation
- ✅ Integrated with Vercel ecosystem
- ✅ Pay only for actual usage

**vs. Third-Party Services (E2B, Modal):**
- ✅ No additional service dependencies
- ✅ Single vendor (already using Vercel)
- ✅ Better integration with Next.js
- ✅ Vercel OIDC authentication built-in
- ✅ Native observability tools

**vs. Client-Side WebAssembly:**
- ✅ Full language features (not limited subset)
- ✅ Native package installation
- ✅ Network access and external API calls
- ✅ Long-running computations (up to 5 hours)
- ✅ Server-side resource isolation

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Chat Application                         │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Chat UI     │────│  Chat API    │────│  Sandbox     │ │
│  │  (Artifact)   │    │  (Stream)    │    │  Orchestrator│ │
│  └───────────────┘    └──────────────┘    └──────────────┘ │
│         │                     │                     │        │
│         │                     │                     │        │
│  ┌──────▼─────────────────────▼─────────────────────▼─────┐ │
│  │              Vercel Sandbox Service                     │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  • Isolated Linux Environments (Amazon Linux 2023)      │ │
│  │  • Python 3.13 Runtime (pip, uv)                        │ │
│  │  • Node.js 22 Runtime (npm, pnpm)                       │ │
│  │  • File System & Environment Variables                  │ │
│  │  • Network Access (controlled)                          │ │
│  │  • Resource Limits (CPU, Memory, Timeout)               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                              │                               │
├──────────────────────────────┼───────────────────────────────┤
│  ┌───────────────┐    ┌──────▼─────┐    ┌──────────────┐   │
│  │  PostgreSQL   │    │   Vercel   │    │  AI Gateway  │   │
│  │  (Sandbox     │    │  Blob      │    │  (AI Models) │   │
│  │   Metadata)   │    │ (Artifacts)│    │              │   │
│  └───────────────┘    └────────────┘    └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation

### Phase 1: Basic Sandbox Support (Week 1-2)

#### 1.1 Vercel Sandbox Setup

**Install SDK:**
```bash
npm install @vercel/sdk
```

**Environment Configuration:**
```env
# .env.local
VERCEL_ACCESS_TOKEN=your_vercel_token
VERCEL_TEAM_ID=your_team_id  # Optional for team accounts
```

#### 1.2 Sandbox Service

**File**: `lib/sandbox/client.ts`

```typescript
import { Vercel } from '@vercel/sdk';

const vercel = new Vercel({
  bearerToken: process.env.VERCEL_ACCESS_TOKEN!,
});

export interface SandboxConfig {
  runtime: 'python' | 'node';
  code: string;
  files?: Record<string, string>;
  packages?: string[];
  env?: Record<string, string>;
  timeout?: number; // milliseconds
  vcpus?: number;
}

export interface SandboxResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  error?: string;
}

export async function createSandbox(config: SandboxConfig): Promise<string> {
  const sandbox = await vercel.sandboxes.create({
    runtime: config.runtime === 'python' ? 'python-3.13' : 'nodejs-22',
    vcpus: config.vcpus || 4,
    timeout: config.timeout || 300000, // 5 minutes default
  });

  return sandbox.id;
}

export async function executeSandbox(
  sandboxId: string,
  config: SandboxConfig
): Promise<SandboxResult> {
  const startTime = Date.now();

  try {
    // Write files if provided
    if (config.files) {
      for (const [path, content] of Object.entries(config.files)) {
        await vercel.sandboxes.writeFile(sandboxId, path, content);
      }
    }

    // Install packages if provided
    if (config.packages && config.packages.length > 0) {
      const installCmd = config.runtime === 'python'
        ? `pip install ${config.packages.join(' ')}`
        : `npm install ${config.packages.join(' ')}`;

      await vercel.sandboxes.exec(sandboxId, installCmd);
    }

    // Set environment variables
    if (config.env) {
      for (const [key, value] of Object.entries(config.env)) {
        await vercel.sandboxes.setEnv(sandboxId, key, value);
      }
    }

    // Execute code
    const result = await vercel.sandboxes.exec(sandboxId, config.code, {
      env: config.env,
    });

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.exitCode || 0,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      stdout: '',
      stderr: error instanceof Error ? error.message : 'Unknown error',
      exitCode: 1,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    // Clean up sandbox
    await vercel.sandboxes.delete(sandboxId);
  }
}

// Streaming execution for real-time output
export async function* executeSandboxStream(
  sandboxId: string,
  config: SandboxConfig
): AsyncGenerator<{ type: 'stdout' | 'stderr' | 'error'; data: string }> {
  try {
    // Install packages first
    if (config.packages && config.packages.length > 0) {
      yield { type: 'stdout', data: 'Installing packages...\n' };

      const installCmd = config.runtime === 'python'
        ? `pip install ${config.packages.join(' ')}`
        : `npm install ${config.packages.join(' ')}`;

      for await (const chunk of vercel.sandboxes.execStream(sandboxId, installCmd)) {
        yield { type: 'stdout', data: chunk };
      }
    }

    // Execute code with streaming
    yield { type: 'stdout', data: '\nExecuting code...\n' };

    for await (const chunk of vercel.sandboxes.execStream(sandboxId, config.code)) {
      yield { type: 'stdout', data: chunk };
    }
  } catch (error) {
    yield {
      type: 'error',
      data: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

#### 1.3 Sandbox API Route

**File**: `app/api/sandbox/route.ts`

```typescript
import { createSandbox, executeSandbox, executeSandboxStream } from '@/lib/sandbox/client';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { sandboxExecutions } from '@/lib/db/schema';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { runtime, code, files, packages, env, streaming } = await request.json();

  // Check user's sandbox quota
  const userTier = await getUserTier(session.user.id);
  const quotaExceeded = await checkSandboxQuota(session.user.id, userTier);

  if (quotaExceeded) {
    return new Response('Sandbox quota exceeded', { status: 429 });
  }

  try {
    // Create sandbox
    const sandboxId = await createSandbox({
      runtime,
      code,
      files,
      packages,
      env,
    });

    // Execute with or without streaming
    if (streaming) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of executeSandboxStream(sandboxId, {
            runtime,
            code,
            files,
            packages,
            env,
          })) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
            );
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      const result = await executeSandbox(sandboxId, {
        runtime,
        code,
        files,
        packages,
        env,
      });

      // Track execution
      await db.insert(sandboxExecutions).values({
        userId: session.user.id,
        runtime,
        duration: result.duration,
        exitCode: result.exitCode,
        createdAt: new Date(),
      });

      return Response.json(result);
    }
  } catch (error) {
    console.error('Sandbox execution error:', error);
    return Response.json(
      {
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Sandbox execution failed',
        exitCode: 1,
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

#### 1.4 Sandbox Artifact Component

**File**: `components/artifacts/sandbox/index.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/ui/code-editor';
import { Console } from '@/components/ui/console';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Package } from 'lucide-react';

interface SandboxArtifactProps {
  documentId: string;
  runtime: 'python' | 'node';
  initialCode?: string;
  initialPackages?: string[];
}

export function SandboxArtifact({
  documentId,
  runtime,
  initialCode = '',
  initialPackages = [],
}: SandboxArtifactProps) {
  const [code, setCode] = useState(initialCode);
  const [packages, setPackages] = useState<string[]>(initialPackages);
  const [output, setOutput] = useState({ stdout: '', stderr: '' });
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(0);

  const runCode = async () => {
    setIsRunning(true);
    setOutput({ stdout: '', stderr: '' });
    const startTime = Date.now();

    try {
      const response = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runtime,
          code,
          packages,
          streaming: true,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'stdout') {
              setOutput((prev) => ({
                ...prev,
                stdout: prev.stdout + data.data,
              }));
            } else if (data.type === 'stderr' || data.type === 'error') {
              setOutput((prev) => ({
                ...prev,
                stderr: prev.stderr + data.data,
              }));
            }
          }
        }
      }
    } catch (error) {
      setOutput((prev) => ({
        ...prev,
        stderr: error instanceof Error ? error.message : 'Execution failed',
      }));
    } finally {
      setIsRunning(false);
      setDuration(Date.now() - startTime);
    }
  };

  const installPackage = (pkg: string) => {
    if (!packages.includes(pkg)) {
      setPackages([...packages, pkg]);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Badge variant={runtime === 'python' ? 'default' : 'secondary'}>
            {runtime === 'python' ? 'Python 3.13' : 'Node.js 22'}
          </Badge>
          {packages.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {packages.length} packages
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {duration > 0 && (
            <span className="text-xs text-muted-foreground">
              {(duration / 1000).toFixed(2)}s
            </span>
          )}
          <Button
            size="sm"
            onClick={runCode}
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Square className="h-4 w-4" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <CodeEditor
          value={code}
          onChange={setCode}
          language={runtime === 'python' ? 'python' : 'javascript'}
          readOnly={isRunning}
        />
      </div>

      {/* Console Output */}
      <div className="h-64 border-t">
        <Console stdout={output.stdout} stderr={output.stderr} />
      </div>

      {/* Package Manager */}
      {packages.length > 0 && (
        <div className="p-2 border-t bg-muted/30">
          <div className="flex flex-wrap gap-1">
            {packages.map((pkg) => (
              <Badge key={pkg} variant="secondary" className="text-xs">
                {pkg}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Phase 2: Advanced Features (Week 3-4)

#### 2.1 Multi-File Support

**File**: `lib/sandbox/file-system.ts`

```typescript
export interface SandboxFileSystem {
  files: Map<string, string>;
  currentFile: string;
}

export async function uploadFilesToSandbox(
  sandboxId: string,
  files: Map<string, string>
): Promise<void> {
  for (const [path, content] of files.entries()) {
    await vercel.sandboxes.writeFile(sandboxId, path, content);
  }
}

export async function readFilesFromSandbox(
  sandboxId: string,
  paths: string[]
): Promise<Map<string, string>> {
  const files = new Map<string, string>();

  for (const path of paths) {
    const content = await vercel.sandboxes.readFile(sandboxId, path);
    files.set(path, content);
  }

  return files;
}
```

#### 2.2 Package Management UI

**File**: `components/sandbox/package-manager.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Search } from 'lucide-react';

interface PackageManagerProps {
  runtime: 'python' | 'node';
  packages: string[];
  onPackagesChange: (packages: string[]) => void;
}

const POPULAR_PACKAGES = {
  python: [
    'numpy',
    'pandas',
    'matplotlib',
    'requests',
    'beautifulsoup4',
    'scikit-learn',
    'pillow',
    'flask',
  ],
  node: [
    'axios',
    'lodash',
    'express',
    'cheerio',
    'dotenv',
    'date-fns',
    'zod',
    'sharp',
  ],
};

export function PackageManager({
  runtime,
  packages,
  onPackagesChange,
}: PackageManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const popularPackages = POPULAR_PACKAGES[runtime];

  const addPackage = (pkg: string) => {
    if (!packages.includes(pkg)) {
      onPackagesChange([...packages, pkg]);
    }
    setSearchQuery('');
  };

  const removePackage = (pkg: string) => {
    onPackagesChange(packages.filter((p) => p !== pkg));
  };

  const filteredPackages = popularPackages.filter((pkg) =>
    pkg.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search packages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery) {
                addPackage(searchQuery);
              }
            }}
          />
        </div>
        <Button
          onClick={() => searchQuery && addPackage(searchQuery)}
          disabled={!searchQuery}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {packages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Installed Packages</h4>
          <div className="flex flex-wrap gap-2">
            {packages.map((pkg) => (
              <Badge key={pkg} variant="secondary" className="gap-1">
                {pkg}
                <button
                  onClick={() => removePackage(pkg)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium mb-2">Popular Packages</h4>
        <div className="flex flex-wrap gap-2">
          {filteredPackages.map((pkg) => (
            <Badge
              key={pkg}
              variant="outline"
              className="cursor-pointer hover:bg-muted"
              onClick={() => addPackage(pkg)}
            >
              <Plus className="h-3 w-3 mr-1" />
              {pkg}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Database Schema

**File**: `lib/db/schema.ts` (additions)

```typescript
export const sandboxExecutions = pgTable('sandbox_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  chatId: uuid('chat_id').references(() => chat.id, { onDelete: 'set null' }),
  sandboxId: text('sandbox_id').notNull(),
  runtime: text('runtime').notNull(), // 'python' | 'node'
  duration: integer('duration'), // milliseconds
  exitCode: integer('exit_code'),
  error: text('error'),
  packagesInstalled: jsonb('packages_installed').$type<string[]>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const sandboxQuotas = pgTable('sandbox_quotas', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  tier: text('tier').notNull(), // 'free', 'pro', 'premium'
  monthlyExecutions: integer('monthly_executions').default(0),
  monthlyComputeSeconds: integer('monthly_compute_seconds').default(0),
  lastResetAt: timestamp('last_reset_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

**Migration**: `lib/db/migrations/0010_sandbox_support.sql`

```sql
CREATE TABLE IF NOT EXISTS sandbox_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES chat(id) ON DELETE SET NULL,
  sandbox_id TEXT NOT NULL,
  runtime TEXT NOT NULL,
  duration INTEGER,
  exit_code INTEGER,
  error TEXT,
  packages_installed JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sandbox_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  monthly_executions INTEGER DEFAULT 0,
  monthly_compute_seconds INTEGER DEFAULT 0,
  last_reset_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sandbox_executions_user ON sandbox_executions(user_id);
CREATE INDEX idx_sandbox_executions_created ON sandbox_executions(created_at);
CREATE INDEX idx_sandbox_quotas_user ON sandbox_quotas(user_id);
```

---

## Supported Use Cases

### 1. Data Science Workflows

```python
# Python sandbox for data analysis
import pandas as pd
import matplotlib.pyplot as plt

# Load sample data
data = {
    'month': ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    'sales': [15000, 18000, 22000, 19000, 25000]
}
df = pd.DataFrame(data)

# Analysis
print("Sales Summary:")
print(df.describe())

# Visualization
plt.figure(figsize=(10, 6))
plt.plot(df['month'], df['sales'], marker='o')
plt.title('Monthly Sales Trend')
plt.xlabel('Month')
plt.ylabel('Sales ($)')
plt.grid(True)
plt.savefig('sales_trend.png')
print("Chart saved as sales_trend.png")
```

### 2. Web Scraping & API Integration

```javascript
// Node.js sandbox for API testing
import axios from 'axios';

async function fetchData() {
  try {
    const response = await axios.get('https://api.github.com/repos/vercel/next.js');

    console.log(`Repository: ${response.data.name}`);
    console.log(`Stars: ${response.data.stargazers_count}`);
    console.log(`Forks: ${response.data.forks_count}`);
    console.log(`Language: ${response.data.language}`);

    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

await fetchData();
```

### 3. Machine Learning Prototypes

```python
# Quick ML model training
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Load data
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.3, random_state=42
)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate
predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)

print(f"Model Accuracy: {accuracy * 100:.2f}%")
print(f"Predictions: {predictions[:10]}")
```

### 4. Code Testing & Validation

```typescript
// TypeScript sandbox for code generation testing
import { z } from 'zod';

// Define schema
const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18).optional(),
});

// Test data
const testUsers = [
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 25 },
  { id: 2, name: 'B', email: 'invalid', age: 15 }, // Invalid
  { id: 3, name: 'Charlie', email: 'charlie@test.com' },
];

// Validate
testUsers.forEach((user, index) => {
  try {
    const validated = UserSchema.parse(user);
    console.log(`✓ User ${index + 1} valid:`, validated.name);
  } catch (error) {
    console.error(`✗ User ${index + 1} invalid:`, error.errors[0].message);
  }
});
```

---

## Quota System

### Tier-Based Limits

| Tier | Monthly Executions | Compute Hours | Timeout | Cost |
|------|-------------------|---------------|---------|------|
| **Free** | 50 | 2 hours | 45 min | $0 |
| **Pro** | 500 | 25 hours | 5 hours | Included |
| **Premium** | 2,000 | 100 hours | 5 hours | Included |
| **Enterprise** | Unlimited | Unlimited | 5 hours | Custom |

### Quota Enforcement

**File**: `lib/sandbox/quota.ts`

```typescript
import { db } from '@/lib/db';
import { sandboxQuotas } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const QUOTA_LIMITS = {
  free: { executions: 50, computeSeconds: 7200 }, // 2 hours
  pro: { executions: 500, computeSeconds: 90000 }, // 25 hours
  premium: { executions: 2000, computeSeconds: 360000 }, // 100 hours
  enterprise: { executions: Infinity, computeSeconds: Infinity },
};

export async function checkSandboxQuota(
  userId: string,
  tier: keyof typeof QUOTA_LIMITS
): Promise<boolean> {
  const quota = await db
    .select()
    .from(sandboxQuotas)
    .where(eq(sandboxQuotas.userId, userId))
    .limit(1);

  if (!quota.length) {
    // Create new quota record
    await db.insert(sandboxQuotas).values({
      userId,
      tier,
      monthlyExecutions: 0,
      monthlyComputeSeconds: 0,
      lastResetAt: new Date(),
    });
    return false;
  }

  const userQuota = quota[0];
  const limits = QUOTA_LIMITS[tier];

  // Check if quota needs reset (monthly)
  const now = new Date();
  const lastReset = new Date(userQuota.lastResetAt);
  const daysSinceReset = Math.floor(
    (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceReset >= 30) {
    // Reset quota
    await db
      .update(sandboxQuotas)
      .set({
        monthlyExecutions: 0,
        monthlyComputeSeconds: 0,
        lastResetAt: now,
      })
      .where(eq(sandboxQuotas.userId, userId));
    return false;
  }

  // Check if exceeded
  return (
    userQuota.monthlyExecutions >= limits.executions ||
    userQuota.monthlyComputeSeconds >= limits.computeSeconds
  );
}

export async function updateSandboxQuota(
  userId: string,
  duration: number
): Promise<void> {
  await db
    .update(sandboxQuotas)
    .set({
      monthlyExecutions: db.raw('monthly_executions + 1'),
      monthlyComputeSeconds: db.raw(`monthly_compute_seconds + ${Math.floor(duration / 1000)}`),
      updatedAt: new Date(),
    })
    .where(eq(sandboxQuotas.userId, userId));
}
```

---

## Cost Analysis

### Vercel Sandbox Pricing

**Available Plans:**
- **Hobby**: Free (45-minute timeout)
- **Pro**: $20/month (5-hour timeout)
- **Enterprise**: Custom pricing (5-hour timeout)

**Resource Costs:**
- Pricing not yet publicly disclosed (currently in beta)
- Expected to follow Vercel's usage-based model
- Likely billed by compute time and resource allocation

### Estimated Costs (Based on Beta Pricing Patterns)

#### Scenario 1: Free Tier (1,000 users, light usage)
- 1,000 users × 5 executions/month = 5,000 executions
- Average 30 seconds per execution = 42 hours compute time
- **Estimated Cost**: $0 (within hobby limits for small scale)

#### Scenario 2: Pro Tier (10,000 users, moderate usage)
- 10,000 users × 10 executions/month = 100,000 executions
- Average 45 seconds per execution = 1,250 hours compute time
- **Estimated Cost**: Included in Pro plan ($20/month base) + potential overage

#### Scenario 3: Enterprise (50,000 users, heavy usage)
- 50,000 users × 20 executions/month = 1M executions
- Average 60 seconds per execution = 16,667 hours compute time
- **Estimated Cost**: Custom enterprise pricing (~$500-2,000/month estimated)

### Cost Optimization Strategies

1. **Timeout Limits**: Set reasonable defaults (30s-5min based on tier)
2. **Caching**: Cache package installations across executions
3. **Quota System**: Enforce tier-based limits to prevent abuse
4. **Resource Monitoring**: Track and alert on unusual usage patterns
5. **Cleanup**: Automatically delete sandboxes after execution

---

## Security Model

### Isolation Layers

1. **Container Isolation**
   - Each sandbox runs in isolated Linux container
   - No access to other sandboxes or host system
   - Amazon Linux 2023 with minimal attack surface

2. **Network Controls**
   - Configurable network access policies
   - Ability to whitelist/blacklist domains
   - No access to internal Vercel infrastructure

3. **Resource Limits**
   - CPU allocation (4+ vCPUs configurable)
   - Memory limits enforced at container level
   - Execution timeouts (45 min to 5 hours)
   - Disk quota enforcement

4. **Authentication & Authorization**
   - Vercel OIDC token authentication
   - User-level sandbox ownership
   - Access tokens with scoped permissions

### Threat Mitigation

**Threat: Cryptocurrency Mining**
- **Mitigation**: Short execution timeouts, CPU monitoring, usage quotas

**Threat: DDoS Attacks**
- **Mitigation**: Network egress filtering, rate limiting, per-user quotas

**Threat: Data Exfiltration**
- **Mitigation**: No access to user data without explicit permission, network monitoring

**Threat: Resource Exhaustion**
- **Mitigation**: Hard memory/CPU limits, automatic cleanup, quota enforcement

**Threat: Malicious Code Execution**
- **Mitigation**: Isolated containers, no privileged access, code scanning (future)

---

## Implementation Checklist

### Phase 1: MVP (Week 1-2)
- [ ] Set up Vercel Sandbox SDK integration
- [ ] Create sandbox service layer
- [ ] Implement basic Python support
- [ ] Implement basic Node.js support
- [ ] Build sandbox artifact UI component
- [ ] Add streaming output support
- [ ] Create database schema for tracking
- [ ] Implement quota system
- [ ] Deploy to staging environment
- [ ] End-to-end testing

### Phase 2: Advanced Features (Week 3-4)
- [ ] Multi-file editor support
- [ ] Package manager UI
- [ ] Environment variable management
- [ ] File upload/download
- [ ] Resource monitoring dashboard
- [ ] Cost tracking and alerts
- [ ] Admin sandbox management tools
- [ ] Production deployment
- [ ] User documentation
- [ ] Video tutorials

### Phase 3: Optimization (Month 2-3)
- [ ] Package installation caching
- [ ] Sandbox session persistence
- [ ] Collaborative editing (optional)
- [ ] Version control integration (optional)
- [ ] Advanced debugging tools
- [ ] Performance optimization
- [ ] Cost optimization analysis
- [ ] Scale testing
- [ ] Security audit
- [ ] Compliance review

---

## Alternative Options Considered

### Option 1: E2B (Code Interpreter SDK)
**Pros:** Easy integration, pre-configured environments
**Cons:** Additional service dependency, $0.10/hour after free tier
**Verdict:** Good alternative if Vercel Sandbox doesn't meet needs

### Option 2: Self-Hosted Docker
**Pros:** Full control, potentially lower cost at scale
**Cons:** Infrastructure management overhead, security complexity
**Verdict:** Consider for future if scale demands it

### Option 3: WebAssembly (Pyodide)
**Pros:** Client-side execution, zero server cost
**Cons:** Limited capabilities, no Node.js, slow package loading
**Verdict:** Keep for simple Python use cases, but not full replacement

### Option 4: AWS Lambda + Firecracker
**Pros:** Battle-tested, highly scalable
**Cons:** Complex setup, higher operational overhead
**Verdict:** Over-engineered for current needs

**Recommended:** Start with Vercel Sandbox, re-evaluate at 50k+ users

---

## Success Metrics

### Phase 1 Success (MVP)
- ✅ 100+ sandbox executions/day
- ✅ <5% error rate
- ✅ <10s average startup time
- ✅ Positive user feedback (4+/5)
- ✅ Zero security incidents

### Phase 2 Success (Growth)
- ✅ 1,000+ executions/day
- ✅ Both Python and Node.js actively used
- ✅ 20%+ user retention with sandboxes
- ✅ <$0.50 cost per execution
- ✅ <2s package installation time (cached)

### Phase 3 Success (Scale)
- ✅ 10,000+ executions/day
- ✅ Premium tier adoption driven by sandboxes
- ✅ <$0.10 cost per execution
- ✅ 99.9% uptime
- ✅ User-created tutorials and examples

---

## Monitoring & Observability

### Key Metrics to Track

1. **Usage Metrics**
   - Executions per day/week/month
   - Runtime distribution (Python vs Node.js)
   - Average execution time
   - Package installation frequency
   - Most popular packages

2. **Performance Metrics**
   - Cold start time
   - Package installation time
   - Execution latency (p50, p95, p99)
   - Error rate by runtime
   - Timeout rate

3. **Resource Metrics**
   - CPU utilization
   - Memory consumption
   - Disk usage
   - Network bandwidth
   - Active sandbox count

4. **Cost Metrics**
   - Cost per execution
   - Cost per user
   - Total monthly spend
   - Cost by runtime type
   - Cost trend over time

### Vercel Dashboard Integration

Vercel provides built-in observability:
- Real-time sandbox execution logs
- Resource utilization graphs
- Error tracking and alerting
- Performance metrics
- Cost breakdown by project

---

## Future Enhancements

### Short-term (3-6 months)
1. **Additional Runtimes**: Go, Rust support (when Vercel adds)
2. **Sandbox Templates**: Pre-configured environments for common tasks
3. **Sharing & Collaboration**: Public sandbox sharing
4. **VS Code Extension**: Edit sandboxes in VS Code
5. **Git Integration**: Save sandboxes to repositories

### Medium-term (6-12 months)
1. **GPU Support**: ML model training (if Vercel adds GPU)
2. **Scheduled Execution**: Cron-like scheduled runs
3. **Database Connections**: Connect to Postgres, MySQL, etc.
4. **Debugging Tools**: Breakpoints, variable inspection
5. **Sandbox Marketplace**: Community-shared sandboxes

### Long-term (12+ months)
1. **Multi-user Collaboration**: Real-time co-editing
2. **Workflow Integration**: Combine with Vercel Workflow
3. **CI/CD Integration**: Automated testing pipelines
4. **Advanced Security**: Code scanning, vulnerability detection
5. **Custom Runtime Images**: User-defined environments

---

## Conclusion

Vercel Sandbox provides a turnkey solution for secure, server-side code execution with minimal infrastructure overhead. By leveraging Vercel's managed platform, we can deliver a production-ready code sandbox feature in 2-4 weeks instead of the 3-6 months required for self-hosted solutions.

**Key Benefits:**
- ✅ **Zero Infrastructure Management**: Fully managed by Vercel
- ✅ **Built-in Security**: Isolated containers, automatic cleanup
- ✅ **Native Integration**: Works seamlessly with Next.js and AI SDK
- ✅ **Scalable**: Automatic scaling from 10 to 10,000+ users
- ✅ **Observable**: Built-in monitoring and logging
- ✅ **Cost-Effective**: Pay only for actual usage

**Recommended Priority**: **High** (Developer feature, premium tier value)

**Next Steps:**
1. Enable Vercel Sandbox in project settings
2. Generate Vercel access token for API
3. Implement Phase 1 (basic Python & Node.js support)
4. Beta test with 50-100 users
5. Iterate based on feedback
6. Launch to premium tier users

This feature positions bedda.ai as a comprehensive AI development platform, enabling users to not just chat with AI but execute and test code in real-time within the same interface.

---

**Last Updated**: 2025-11-03
**Status**: Planning Phase
**Priority**: High (Developer/data science feature)
**Effort**: 2-4 weeks (MVP), 2-3 months (full feature)
**Estimated Cost**: Included in Vercel Pro plan, scales with usage
