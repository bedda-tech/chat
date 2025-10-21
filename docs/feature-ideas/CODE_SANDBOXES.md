# Code Sandboxes

## Overview

Code Sandboxes are server-side containerized environments that allow users to execute code in various programming languages with full runtime support. Unlike client-side artifacts (HTML, React, SVG) that run in the browser, sandboxes provide isolated backend execution environments for languages like Python, Node.js, Go, Rust, Java, and more.

**Key Difference from Artifacts:**
- **Artifacts**: Client-side, browser-based, limited to web technologies
- **Sandboxes**: Server-side, containerized, any language/runtime

---

## Motivation

### Current Limitations
The existing `code` artifact executes Python in a limited browser environment (Pyodide/WebAssembly), which has constraints:
- No native module support
- Limited system access
- No multi-language support
- Resource limitations
- Cannot install arbitrary packages

### Sandbox Benefits
- **Any Language**: Python, Node.js, Go, Rust, Java, C++, Ruby, etc.
- **Full Runtime**: Complete language features and standard library
- **Package Management**: Install any NPM, PyPI, Go modules, etc.
- **System Access**: File I/O, networking (controlled), databases
- **Persistent State**: Maintain state between executions
- **Resource Control**: CPU, memory, timeout limits

---

## Architecture Options

### Option 1: Docker Containers (Traditional)
**Description:** Spin up Docker containers per sandbox execution

**Pros:**
- Battle-tested isolation
- Full OS-level virtualization
- Rich ecosystem of images
- Easy to customize

**Cons:**
- Slow cold start (1-3 seconds)
- Higher resource usage
- Scaling challenges
- More expensive

**Implementation:**
```typescript
// Server-side execution
const executeInDocker = async (code: string, runtime: string) => {
  const container = await docker.run(`${runtime}-sandbox`, {
    cmd: ['node', '-e', code],
    limits: { memory: '128m', cpus: 0.5 },
    timeout: 30000,
  });
  return container.output;
};
```

**Cost:** ~$0.01-0.05 per execution

---

### Option 2: WebAssembly (Modern Client-Side)
**Description:** Run compiled code in browser via WebAssembly

**Pros:**
- Client-side (no server costs)
- Fast execution
- Good security
- Growing ecosystem

**Cons:**
- Limited language support
- No native system access
- Compilation overhead
- Browser limitations

**Supported Languages:**
- Python (Pyodide) ✓
- C/C++ (Emscripten) ✓
- Rust ✓
- Go (limited) ⚠️
- Node.js (via polyfills) ⚠️

**Implementation:**
```typescript
// Client-side with Pyodide
import { loadPyodide } from 'pyodide';

const pyodide = await loadPyodide();
await pyodide.loadPackage(['numpy', 'pandas']);
const result = await pyodide.runPythonAsync(code);
```

**Cost:** $0 (client-side)

---

### Option 3: Firecracker MicroVMs (Lightweight)
**Description:** AWS Firecracker provides lightweight VMs optimized for serverless

**Pros:**
- Fast cold start (~125ms)
- Strong isolation
- Lower overhead than Docker
- Used by AWS Lambda

**Cons:**
- More complex setup
- Linux-only
- Requires bare metal or nested virtualization

**Use Case:** Production-grade sandboxing at scale

**Cost:** ~$0.001-0.01 per execution

---

### Option 4: Third-Party Services (Outsourced)

#### E2B (Code Interpreter SDK)
**Description:** Managed sandboxed environments as a service

**Features:**
- Pre-configured language runtimes
- File system access
- Long-running sessions
- Jupyter notebook support

**Pricing:**
- Free tier: 100 hours/month
- Pro: $20/month + $0.10/hour

**Integration:**
```typescript
import { Sandbox } from '@e2b/sdk';

const sandbox = await Sandbox.create();
const result = await sandbox.process.start({
  cmd: 'python3 -c "print(2+2)"'
});
```

#### Modal
**Description:** Serverless compute for ML/data workloads

**Features:**
- GPU support
- Container deployment
- Volume mounts
- Scheduled jobs

**Pricing:**
- Free tier: $30/month credits
- Pay-as-you-go: CPU $0.0001/sec, GPU $0.001/sec

#### RunPod
**Description:** Cloud GPU infrastructure

**Best For:** ML/AI workloads requiring GPUs

**Pricing:** GPU instances starting at $0.20/hour

---

## Recommended Architecture

### Hybrid Approach
Use different execution strategies based on requirements:

```typescript
type SandboxStrategy =
  | 'wasm'       // Client-side for simple Python/Rust
  | 'e2b'        // Managed service for general use
  | 'firecracker' // Self-hosted for scale
  | 'docker'     // Development/legacy

const chooseSandbox = (language: string, complexity: string) => {
  if (language === 'python' && complexity === 'simple') {
    return 'wasm'; // Use Pyodide
  }
  if (complexity === 'gpu') {
    return 'modal'; // GPU support
  }
  return 'e2b'; // Default to managed service
};
```

---

## Supported Runtimes

### Phase 1: Core Languages
1. **Python** (Priority: Critical)
   - Version: 3.11+
   - Packages: NumPy, Pandas, Matplotlib, Scikit-learn
   - Use Cases: Data science, ML, automation

2. **Node.js** (Priority: High)
   - Version: 20 LTS
   - Packages: Full NPM ecosystem
   - Use Cases: Web scraping, APIs, automation

3. **TypeScript** (Priority: High)
   - Built on Node.js runtime
   - Native TypeScript compilation
   - Use Cases: Type-safe scripting

### Phase 2: Systems Languages
4. **Go** (Priority: Medium)
   - Version: 1.21+
   - Use Cases: Performance-critical tasks, CLI tools

5. **Rust** (Priority: Medium)
   - Version: Stable
   - Use Cases: Systems programming, WASM compilation

### Phase 3: Enterprise Languages
6. **Java** (Priority: Low)
   - Version: OpenJDK 17+
   - Use Cases: Enterprise integrations

7. **C/C++** (Priority: Low)
   - Compiler: GCC/Clang
   - Use Cases: Performance, legacy code

### Phase 4: Specialized
8. **R** (Data Science)
9. **Julia** (Scientific Computing)
10. **Ruby** (Scripting)
11. **PHP** (Web Development)

---

## Feature Set

### Core Features

#### 1. Multi-File Support
```typescript
interface SandboxFiles {
  'main.py': string;
  'utils.py': string;
  'data.csv': string;
}
```

#### 2. Package Installation
```typescript
interface SandboxConfig {
  runtime: 'python' | 'node' | 'go';
  packages: string[]; // ['numpy', 'pandas']
  version?: string;   // '3.11'
}
```

#### 3. Persistent File System
```typescript
// Files persist between executions
await sandbox.writeFile('data.json', data);
const result = await sandbox.run('process.py');
const output = await sandbox.readFile('output.json');
```

#### 4. Environment Variables
```typescript
await sandbox.setEnv({
  'API_KEY': process.env.USER_API_KEY,
  'DEBUG': 'true',
});
```

#### 5. Streaming Output
```typescript
const stream = sandbox.runStream('script.py');
for await (const chunk of stream) {
  console.log(chunk); // Real-time output
}
```

#### 6. Resource Limits
```typescript
const config = {
  timeout: 30000,      // 30 seconds
  memory: '512MB',
  cpu: 0.5,            // 50% of 1 core
  diskQuota: '1GB',
};
```

---

## Security Model

### Isolation Layers
1. **Network Isolation**
   - Whitelist: Allow specific domains only
   - Blacklist: Block internal networks
   - Proxy: Route through filtering proxy

2. **File System Isolation**
   - Read-only system files
   - Ephemeral user workspace
   - No host system access

3. **Resource Limits**
   - CPU throttling
   - Memory caps
   - Execution timeouts
   - Rate limiting per user

4. **Code Scanning**
   - Static analysis before execution
   - Detect malicious patterns
   - Block dangerous syscalls

### Threat Model
**Threats:**
- Cryptocurrency mining
- DDoS attacks from sandboxes
- Data exfiltration
- Resource exhaustion
- Privilege escalation

**Mitigations:**
- Short execution timeouts
- CPU usage monitoring
- Network egress filtering
- Sandbox cleanup after use
- User quotas and rate limits

---

## User Interface

### Sandbox Component

```typescript
interface SandboxArtifact {
  kind: 'sandbox';
  runtime: 'python' | 'node' | 'go' | 'rust';
  files: Record<string, string>;
  config: {
    packages: string[];
    env: Record<string, string>;
  };
  state: 'idle' | 'installing' | 'running' | 'complete' | 'error';
  output: {
    stdout: string;
    stderr: string;
    exitCode: number;
  };
}
```

### UI Features
1. **Multi-Tab Editor**
   - File explorer
   - Syntax highlighting per language
   - Auto-save

2. **Console Output**
   - Stdout/stderr streams
   - Syntax highlighting for errors
   - Collapsible sections

3. **Package Manager**
   - Search packages
   - Install/uninstall UI
   - Version selection

4. **File Browser**
   - Upload/download files
   - Drag-drop support
   - File size limits

5. **Resource Monitor**
   - CPU usage graph
   - Memory consumption
   - Execution time
   - Cost estimate

---

## Implementation Phases

### Phase 1: MVP (Weeks 1-4)
**Scope:** Python sandboxes with E2B

**Deliverables:**
- [ ] E2B integration
- [ ] Python runtime support
- [ ] Basic UI (editor + console)
- [ ] Package installation
- [ ] Streaming output

**Effort:** 2-3 weeks, 1 developer

---

### Phase 2: Multi-Language (Weeks 5-8)
**Scope:** Add Node.js, TypeScript, Go

**Deliverables:**
- [ ] Runtime selector UI
- [ ] Node.js support
- [ ] TypeScript compilation
- [ ] Go runtime
- [ ] Multi-file editing

**Effort:** 3-4 weeks, 1 developer

---

### Phase 3: Advanced Features (Weeks 9-12)
**Scope:** Persistent storage, collaboration

**Deliverables:**
- [ ] Persistent file system
- [ ] Environment variables
- [ ] Secrets management
- [ ] Resource monitoring
- [ ] Cost tracking

**Effort:** 3-4 weeks, 1-2 developers

---

### Phase 4: Self-Hosted (Weeks 13-20)
**Scope:** Move from E2B to self-hosted Firecracker

**Deliverables:**
- [ ] Firecracker setup
- [ ] Container orchestration
- [ ] Auto-scaling
- [ ] Monitoring/logging
- [ ] Cost optimization

**Effort:** 6-8 weeks, 2 developers

---

## Cost Analysis

### E2B Managed Service (Recommended Start)
**Free Tier:** 100 hours/month
- Sufficient for ~1000 executions at 6 minutes avg
- Good for MVP and early users

**Pro Tier:** $20/month + $0.10/hour
- After free tier: ~$100/month for moderate usage
- Predictable scaling

### Self-Hosted (Long-term)
**Infrastructure Costs:**
- Server: $40-200/month (4-16 vCPU)
- Bandwidth: ~$10/month
- Monitoring: ~$20/month
- **Total:** ~$70-230/month

**Break-even:** ~500-1000 hours/month of execution

**Recommendation:** Start with E2B, migrate to self-hosted at scale

---

## Use Cases

### Data Science Workflows
```python
# Load and analyze data
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv('data.csv')
summary = df.describe()
plt.plot(df['x'], df['y'])
plt.savefig('output.png')
```

### API Integration Testing
```typescript
// Test external APIs
import axios from 'axios';

const response = await axios.get('https://api.example.com/data');
const processed = response.data.map(item => ({
  id: item.id,
  value: item.value * 2
}));
console.log(processed);
```

### Code Generation & Testing
```python
# AI generates code, user tests it immediately
def fibonacci(n):
    if n <= 1: return n
    return fibonacci(n-1) + fibonacci(n-2)

# Test cases
assert fibonacci(10) == 55
print("All tests passed!")
```

### Educational Tutorials
```go
// Interactive Go tutorial
package main
import "fmt"

func main() {
    // Learn concurrency
    ch := make(chan int)
    go func() { ch <- 42 }()
    result := <-ch
    fmt.Println(result)
}
```

---

## Competitive Analysis

### Comparison with Existing Tools

| Feature | bedda.ai Sandboxes | Replit | CodeSandbox | GitHub Codespaces |
|---------|-------------------|--------|-------------|-------------------|
| **AI Integration** | ✓ Native | ✗ Separate | ✗ Manual | ✗ Manual |
| **Conversation Context** | ✓ Yes | ✗ No | ✗ No | ✗ No |
| **Instant Execution** | ✓ Yes | ~2-3s | ~1-2s | ~30s |
| **Free Tier** | ✓ Generous | Limited | Limited | 60hrs/mo |
| **Languages** | 10+ | 50+ | Web only | All |
| **Collaboration** | Planned | ✓ Yes | ✓ Yes | ✓ Yes |
| **GPU Support** | Planned | ✓ Yes | ✗ No | ✗ No |

**Unique Value Proposition:**
- **AI-First**: Code generated and executed in same conversation
- **Context-Aware**: Sandboxes inherit chat context
- **Instant Iteration**: Modify and re-run without leaving chat
- **Zero Setup**: No manual environment configuration

---

## Technical Specifications

### API Design

```typescript
// Server-side handler
export const sandboxHandler = createDocumentHandler<"sandbox">({
  kind: "sandbox",

  onCreateDocument: async ({ title, runtime, dataStream }) => {
    const sandbox = await Sandbox.create({ runtime });

    // Stream sandbox creation
    dataStream.writeData({
      type: 'sandbox-created',
      sandboxId: sandbox.id,
      runtime,
    });

    return {
      id: generateId(),
      title,
      kind: 'sandbox',
      sandboxId: sandbox.id,
    };
  },

  onUpdateDocument: async ({ documentId, delta }) => {
    const { code, action } = delta;

    switch (action) {
      case 'run':
        return await executeSandbox(documentId, code);
      case 'install':
        return await installPackages(documentId, delta.packages);
      case 'upload':
        return await uploadFile(documentId, delta.file);
    }
  },
});
```

### Client Component

```tsx
// components/artifacts/sandbox/client.tsx
export const SandboxArtifact = ({ document }: SandboxProps) => {
  const [files, setFiles] = useState(document.files);
  const [output, setOutput] = useState({ stdout: '', stderr: '' });

  const runCode = async () => {
    const stream = updateDocument(document.id, {
      action: 'run',
      code: files['main.py'],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'stdout') {
        setOutput(prev => ({
          ...prev,
          stdout: prev.stdout + chunk.data
        }));
      }
    }
  };

  return (
    <div className="sandbox-container">
      <FileEditor files={files} onChange={setFiles} />
      <Console output={output} />
      <ActionBar onRun={runCode} />
    </div>
  );
};
```

---

## Monitoring & Observability

### Metrics to Track
1. **Usage Metrics**
   - Executions per day
   - Average execution time
   - Languages used
   - Package installations

2. **Performance Metrics**
   - Cold start time
   - Execution latency
   - Error rate
   - Timeout rate

3. **Resource Metrics**
   - CPU usage distribution
   - Memory consumption
   - Disk usage
   - Network traffic

4. **Cost Metrics**
   - Cost per execution
   - Cost per user
   - Total monthly spend
   - Cost by runtime

### Alerts
- Execution failures > 5%
- Average latency > 10s
- Daily cost > $100
- User quota exceeded

---

## Future Enhancements

### Advanced Features
1. **GPU Support** (Modal/RunPod)
   - ML model training
   - Image/video processing
   - Scientific computing

2. **Collaborative Editing** (Realtime sync)
   - Multiple users in same sandbox
   - Live cursors and presence
   - Shared execution

3. **Scheduled Execution** (Cron jobs)
   - Daily data processing
   - Automated reports
   - Monitoring scripts

4. **Version Control** (Git integration)
   - Save sandbox states
   - Branch and merge
   - Rollback changes

5. **Debugging Tools**
   - Breakpoints
   - Variable inspection
   - Step-through execution

6. **Database Connections**
   - Postgres, MySQL, MongoDB
   - Secure credential management
   - Query builders

---

## Success Criteria

### Phase 1 Success (MVP)
- [ ] 100+ sandbox executions/day
- [ ] <5% error rate
- [ ] <5s average execution time
- [ ] Positive user feedback (4+/5)

### Phase 2 Success (Growth)
- [ ] 1000+ executions/day
- [ ] 5+ languages supported
- [ ] <$0.10 cost per execution
- [ ] 20%+ user retention with sandboxes

### Phase 3 Success (Scale)
- [ ] 10,000+ executions/day
- [ ] Self-hosted infrastructure
- [ ] <$0.01 cost per execution
- [ ] Premium tier adoption

---

## Open Questions

1. **Quota System:** Free tier limits?
   - Option A: 50 executions/day
   - Option B: 2 hours compute/month
   - Option C: 100MB output/day

2. **Execution Timeout:** Maximum allowed?
   - Option A: 30 seconds (quick tasks)
   - Option B: 5 minutes (data processing)
   - Option C: 30 minutes (premium only)

3. **Storage:** How long to keep sandbox files?
   - Option A: 24 hours
   - Option B: 7 days
   - Option C: Until user deletes

4. **Sharing:** Allow public sandbox sharing?
   - Could enable portfolio/showcase
   - Security implications
   - Moderation requirements

---

## Conclusion

Code Sandboxes represent a significant enhancement to the chat application, enabling true multi-language code execution with full runtime support. By starting with a managed service (E2B) and migrating to self-hosted infrastructure at scale, we can deliver this feature efficiently while controlling costs.

**Key Benefits:**
- Expands beyond Python to 10+ languages
- Enables complex data science workflows
- Differentiates from chat-only competitors
- Opens premium tier opportunities
- Complements existing artifact system

**Recommended Timeline:**
- **Month 1-2:** MVP with Python/Node.js (E2B)
- **Month 3-4:** Multi-language support
- **Month 5-6:** Advanced features
- **Month 7+:** Self-hosted migration

This feature positions bedda.ai as a comprehensive development and data science platform, not just a chat interface.
