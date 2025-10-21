# AI Video Generation

## Document Purpose
This document outlines the implementation of AI-powered video generation capabilities, analyzing providers, pricing models, technical approaches, and cost-optimization strategies to offer video generation as a premium feature.

## 1. Overview

AI video generation is rapidly becoming a mainstream capability, allowing users to create videos from text prompts, images, or both. This feature would differentiate bedda.ai as a comprehensive AI creative platform.

**Key Use Cases**:
- Marketing & advertising content
- Social media videos
- Product demonstrations
- Educational content
- Creative storytelling
- Animations & motion graphics
- Video prototypes

**Benefits**:
- High-value premium feature
- Strong user engagement
- Revenue driver (premium tier only)
- Competitive differentiation
- Creative professional appeal

## 2. Current State

### What We Have
- Image generation (Gemini 2.5 Flash Image)
- Text generation capabilities
- No video generation

### What's Missing
- Video generation models
- Video processing pipeline
- Video storage and delivery
- Cost-effective provider integration
- Quality tiering system
- Video preview/playback UI

## 3. Provider Research & Analysis

### Available Providers (Early 2025)

#### **Tier 1: Premium Quality (Expensive)**

**1. OpenAI Sora**
- **Status**: Limited availability, likely coming to API in 2025
- **Quality**: Highest quality, most realistic
- **Pricing**: Estimated $0.10-0.30 per second
- **Max Length**: Up to 60 seconds
- **Resolution**: Up to 1080p
- **Generation Time**: 2-5 minutes
- **Best For**: High-end professional content
- **AI Gateway Support**: TBD (not yet publicly available)

**2. Google Veo (Vertex AI)**
- **Status**: Available through Google Cloud
- **Quality**: Very high quality
- **Pricing**: Estimated $0.08-0.20 per second
- **Max Length**: Up to 60 seconds
- **Resolution**: 1080p
- **Generation Time**: 2-4 minutes
- **Best For**: Professional content with Google ecosystem
- **AI Gateway Support**: Possibly through Vertex AI

**3. Runway Gen-3 Alpha**
- **Status**: Available via API
- **Quality**: Professional grade
- **Pricing**: $0.05-0.15 per second
- **Max Length**: 10-18 seconds per generation
- **Resolution**: 1280x768
- **Generation Time**: 1-3 minutes
- **Best For**: Professional creative work
- **API**: Direct REST API

---

#### **Tier 2: Good Quality (Moderate Cost)**

**4. Luma AI Dream Machine**
- **Status**: Available via API
- **Quality**: Good quality, fast generation
- **Pricing**: $0.04-0.10 per second
- **Max Length**: 5 seconds (extendable)
- **Resolution**: 720p
- **Generation Time**: 20-120 seconds
- **Best For**: Quick social media content
- **API**: REST API with good documentation

**5. Pika Labs**
- **Status**: Available via API
- **Quality**: Good quality
- **Pricing**: $0.03-0.08 per second
- **Max Length**: 3-4 seconds
- **Resolution**: 720p-1080p
- **Generation Time**: 1-2 minutes
- **Best For**: Short form content, memes
- **API**: REST API

**6. Stability AI (Stable Video Diffusion)**
- **Status**: Open source + hosted API
- **Quality**: Good quality
- **Pricing**: $0.02-0.05 per second (hosted), FREE (self-hosted)
- **Max Length**: 4-14 frames (extension possible)
- **Resolution**: 576x1024
- **Generation Time**: 30-90 seconds
- **Best For**: Budget-conscious, customizable
- **API**: Stability AI API + self-hosting option

---

#### **Tier 3: Budget Options (Cheap)**

**7. Haiper AI**
- **Status**: Available, free tier
- **Quality**: Decent quality
- **Pricing**: FREE tier, $0.01-0.03 per second (paid)
- **Max Length**: 2-4 seconds
- **Resolution**: 720p
- **Generation Time**: 1-2 minutes
- **Best For**: Free tier users, testing
- **API**: Web API available

**8. Kling AI**
- **Status**: Available (Chinese provider)
- **Quality**: Surprisingly good for price
- **Pricing**: $0.005-0.02 per second
- **Max Length**: 5-10 seconds
- **Resolution**: 720p-1080p
- **Generation Time**: 2-5 minutes
- **Best For**: Cost-conscious, high volume
- **API**: REST API

**9. Zeroscope (Open Source)**
- **Status**: Open source, self-hostable
- **Quality**: Basic quality
- **Pricing**: FREE (compute costs only)
- **Max Length**: 2-3 seconds
- **Resolution**: 576x320
- **Generation Time**: 1-2 minutes (on GPU)
- **Best For**: Self-hosting, experimentation
- **API**: Hugging Face Inference

---

### **Alternative Approach: Image-to-Video**

Convert static images to short video clips (cheaper than text-to-video):

**10. Image Animation Services**
- **D-ID**: $0.02-0.05 per video (talking heads)
- **Genmo**: $0.01-0.03 per animation
- **Animated Drawings**: FREE (Meta's open source)
- **Best For**: Animating generated images cheaply

## 4. Cost Analysis

### Pricing Comparison (5-second video)

| Provider | Cost per 5s | Quality | Speed | AI Gateway |
|----------|-------------|---------|-------|------------|
| OpenAI Sora | $0.50-1.50 | Excellent | Slow | TBD |
| Google Veo | $0.40-1.00 | Excellent | Slow | Maybe |
| Runway Gen-3 | $0.25-0.75 | Very Good | Medium | No |
| Luma Dream | $0.20-0.50 | Good | Fast | No |
| Pika Labs | $0.15-0.40 | Good | Medium | No |
| Stability AI | $0.10-0.25 | Good | Medium | No |
| Haiper | FREE-$0.15 | Decent | Medium | No |
| Kling AI | $0.03-0.10 | Good | Medium | No |
| Image-to-Video | $0.05-0.15 | Variable | Fast | No |

### Cost Optimization Strategies

**1. Tiered Quality System**
```
Free Tier:    Not available
Pro Tier:     2 videos/month (Haiper - $0.03/5s) = $0.06/month
Premium Tier: 10 videos/month (Kling AI - $0.10/5s) = $1.00/month
Enterprise:   Unlimited (Runway/Luma - volume pricing)
```

**2. Length Limits**
- Free: No video generation
- Pro: Max 3 seconds
- Premium: Max 5 seconds
- Enterprise: Max 10-30 seconds

**3. Queue & Batch Processing**
- Process during off-peak hours
- Batch multiple requests
- Cache popular prompts
- Negotiate volume discounts

**4. Hybrid Approach**
- Use cheap providers for free/pro tiers
- Use premium providers for enterprise
- Image-to-video for animations
- User-selectable quality levels

## 5. Recommended Implementation Strategy

### **Phase 1: MVP (Cheapest Option)**

**Provider**: Haiper AI + Kling AI
**Cost**: ~$0.01-0.05 per 5-second video
**Features**:
- Text-to-video (3-5 seconds)
- Basic quality (720p)
- Queue-based processing
- Pro tier only (2 videos/month)

**Why This Approach**:
- Lowest cost to test market demand
- No upfront infrastructure costs
- Good quality for price
- Fast time to market

**Implementation**:

```typescript
// lib/video/providers/kling.ts
export class KlingVideoProvider {
  private apiKey: string;
  private baseUrl = 'https://api.kling.ai/v1';

  async generateVideo(params: {
    prompt: string;
    duration?: number; // 3, 5, or 10 seconds
    aspectRatio?: '16:9' | '9:16' | '1:1';
  }): Promise<VideoGenerationJob> {
    const response = await fetch(`${this.baseUrl}/videos/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'kling-v1',
        prompt: params.prompt,
        duration: params.duration || 5,
        aspect_ratio: params.aspectRatio || '16:9',
        quality: 'standard', // or 'high' for 2x cost
      }),
    });

    const data = await response.json();
    return {
      jobId: data.id,
      status: 'processing',
      estimatedTime: 120, // 2 minutes
    };
  }

  async checkStatus(jobId: string): Promise<VideoJob> {
    const response = await fetch(`${this.baseUrl}/videos/${jobId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    const data = await response.json();
    return {
      jobId: data.id,
      status: data.status, // 'processing' | 'completed' | 'failed'
      videoUrl: data.video_url,
      thumbnailUrl: data.thumbnail_url,
      cost: data.cost, // Track actual cost
    };
  }
}
```

### **Phase 2: Image-to-Video (Even Cheaper)**

**Cost**: $0.02-0.05 per animation
**Approach**: Generate images with existing models, animate them

```typescript
// lib/video/image-to-video.ts
export async function animateImage(imageUrl: string): Promise<string> {
  // Use Stability AI Stable Video Diffusion
  const response = await fetch('https://api.stability.ai/v2beta/image-to-video', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
    },
    body: JSON.stringify({
      image: imageUrl,
      seed: 0,
      cfg_scale: 1.8,
      motion_bucket_id: 127,
    }),
  });

  const { id } = await response.json();

  // Poll for completion
  return await pollForVideo(id);
}

// Workflow:
// 1. User requests "cat playing piano"
// 2. Generate image with Gemini 2.5 Flash Image ($0.001)
// 3. Animate image with Stability AI ($0.02)
// 4. Total cost: ~$0.021 for 3-second video
```

### **Phase 3: Self-Hosted Option (Cheapest Long-Term)**

**Cost**: Compute only (~$0.10/hour GPU = $0.003 per 5s video)
**Approach**: Self-host Stable Video Diffusion on GPU instance

```typescript
// Self-hosted setup (one-time cost)
// AWS g4dn.xlarge: $0.526/hour (T4 GPU)
// Or Vast.ai: $0.10-0.20/hour

// Can generate ~30 videos per hour
// Cost per video: $0.526 / 30 = $0.018

// At 1000 videos/month:
// Self-hosted: $18/month
// Kling AI: $50-100/month
// Break-even: ~500 videos/month
```

### **Phase 4: Premium Provider Integration**

**For Enterprise Tier Only**
- Runway Gen-3 for highest quality
- Google Veo when available through AI Gateway
- OpenAI Sora when available

## 6. Database Schema

```sql
-- Video generation jobs
CREATE TABLE video_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Input
  prompt TEXT NOT NULL,
  duration INT DEFAULT 5, -- seconds
  aspect_ratio VARCHAR(10) DEFAULT '16:9',
  quality VARCHAR(20) DEFAULT 'standard', -- standard, high, premium

  -- Provider
  provider VARCHAR(50) NOT NULL, -- 'kling', 'haiper', 'runway', etc.
  provider_job_id VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'queued', -- queued, processing, completed, failed
  progress INT DEFAULT 0, -- 0-100
  error_message TEXT,

  -- Output
  video_url TEXT,
  thumbnail_url TEXT,
  video_duration INT, -- actual duration in seconds
  file_size BIGINT, -- bytes

  -- Cost tracking
  estimated_cost DECIMAL(10, 4),
  actual_cost DECIMAL(10, 4),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  INDEX idx_user_status (user_id, status),
  INDEX idx_created_at (created_at),
  INDEX idx_provider_job (provider, provider_job_id)
);

-- Video generation quotas (per tier)
CREATE TABLE video_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of month

  -- Usage
  videos_generated INT DEFAULT 0,
  total_seconds DECIMAL(10, 2) DEFAULT 0,
  total_cost DECIMAL(10, 2) DEFAULT 0,

  -- Limits (based on tier)
  video_limit INT, -- Max videos per month
  seconds_limit INT, -- Max total seconds per month

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, month)
);
```

## 7. API Implementation

**File**: `app/api/video/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { KlingVideoProvider } from '@/lib/video/providers/kling';
import { checkVideoQuota, recordVideoGeneration } from '@/lib/video/quotas';

export async function POST(req: NextRequest) {
  const { userId, prompt, duration, aspectRatio } = await req.json();

  // Check tier and quotas
  const user = await getUser(userId);
  if (user.tier === 'free') {
    return NextResponse.json(
      { error: 'Video generation requires Pro tier or higher' },
      { status: 403 }
    );
  }

  const quotaCheck = await checkVideoQuota(userId, duration);
  if (!quotaCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Monthly video quota exceeded',
        limit: quotaCheck.limit,
        used: quotaCheck.used,
      },
      { status: 429 }
    );
  }

  // Select provider based on tier
  const provider = selectProvider(user.tier);

  // Create job
  const job = await db.query(`
    INSERT INTO video_generation_jobs (user_id, prompt, duration, aspect_ratio, provider, status)
    VALUES ($1, $2, $3, $4, $5, 'queued')
    RETURNING id
  `, [userId, prompt, duration, aspectRatio, provider]);

  const jobId = job.rows[0].id;

  // Queue for processing (background worker)
  await queueVideoGeneration(jobId);

  return NextResponse.json({
    jobId,
    status: 'queued',
    estimatedTime: 120, // seconds
    message: 'Video generation started',
  });
}

function selectProvider(tier: string): string {
  if (tier === 'enterprise') return 'runway'; // Best quality
  if (tier === 'premium') return 'kling'; // Good quality
  if (tier === 'pro') return 'haiper'; // Budget option
  return 'haiper'; // Default
}
```

**Background Worker**: `lib/workers/video-processor.ts`

```typescript
export async function processVideoJobs() {
  // Get queued jobs
  const jobs = await db.query(`
    SELECT * FROM video_generation_jobs
    WHERE status = 'queued'
    ORDER BY created_at ASC
    LIMIT 10
  `);

  for (const job of jobs.rows) {
    await processVideoJob(job);
  }
}

async function processVideoJob(job: VideoJob) {
  try {
    // Update status
    await updateJobStatus(job.id, 'processing');

    // Select provider
    const provider = getProvider(job.provider);

    // Generate video
    const result = await provider.generateVideo({
      prompt: job.prompt,
      duration: job.duration,
      aspectRatio: job.aspect_ratio,
    });

    // Poll for completion
    let videoUrl;
    while (true) {
      const status = await provider.checkStatus(result.jobId);

      if (status.status === 'completed') {
        videoUrl = status.videoUrl;
        break;
      }

      if (status.status === 'failed') {
        throw new Error(status.error);
      }

      await sleep(10000); // Check every 10 seconds
    }

    // Upload to storage
    const storedUrl = await uploadToStorage(videoUrl, job.id);

    // Update job
    await db.query(`
      UPDATE video_generation_jobs
      SET status = 'completed',
          video_url = $1,
          actual_cost = $2,
          completed_at = NOW()
      WHERE id = $3
    `, [storedUrl, result.cost, job.id]);

    // Update quota
    await recordVideoGeneration(job.user_id, job.duration, result.cost);

  } catch (error) {
    await updateJobStatus(job.id, 'failed', error.message);
  }
}
```

## 8. UI Components

**File**: `components/video/video-generator.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Loader2, Video, Download } from 'lucide-react';

export function VideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);

    const response = await fetch('/api/video/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        duration: 5,
        aspectRatio: '16:9',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setJobId(data.jobId);
      pollForCompletion(data.jobId);
    } else {
      alert(data.error);
      setGenerating(false);
    }
  };

  const pollForCompletion = async (id: string) => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/video/status/${id}`);
      const data = await response.json();

      if (data.status === 'completed') {
        setVideoUrl(data.videoUrl);
        setGenerating(false);
        clearInterval(interval);
      }

      if (data.status === 'failed') {
        alert('Video generation failed');
        setGenerating(false);
        clearInterval(interval);
      }
    }, 5000); // Poll every 5 seconds
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Video Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A cat playing piano in a jazz club..."
          className="w-full p-3 border rounded-lg"
          rows={3}
          disabled={generating}
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating || !prompt}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Video className="h-4 w-4" />
            Generate Video
          </>
        )}
      </button>

      {videoUrl && (
        <div className="border rounded-lg p-4">
          <video
            src={videoUrl}
            controls
            className="w-full rounded-lg"
          />
          <button className="mt-2 flex items-center gap-2 text-sm">
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      )}
    </div>
  );
}
```

## 9. Cost Projections

### Pro Tier ($20/month)
- **Allowance**: 2 videos/month (5 seconds each)
- **Cost**: 2 × $0.05 = $0.10/month
- **Margin**: $19.90 (99.5%)

### Premium Tier ($50/month)
- **Allowance**: 10 videos/month (5 seconds each)
- **Cost**: 10 × $0.10 = $1.00/month
- **Margin**: $49.00 (98%)

### Enterprise Tier (Custom)
- **Allowance**: 50-100 videos/month
- **Cost**: 50 × $0.30 = $15/month
- **Pricing**: $200/month
- **Margin**: $185 (92.5%)

### At Scale (10,000 users)
**Assuming**:
- 500 Pro users (2 videos each) = 1,000 videos
- 100 Premium users (10 videos each) = 1,000 videos
- 10 Enterprise users (50 videos each) = 500 videos

**Total**: 2,500 videos/month
**Cost**: (1,000 × $0.05) + (1,000 × $0.10) + (500 × $0.30) = $50 + $100 + $150 = **$300/month**

**Revenue from video feature**: Minimal (included in existing tiers)
**Incremental cost**: $300/month (0.7% of revenue at 10k users)

## 10. Alternative: Image Animation Approach

**Cheaper option for basic animations**:

```typescript
// Generate image with Gemini 2.5 Flash Image
const { image } = await generateImage({
  model: 'google/gemini-2.5-flash-image',
  prompt: 'A cat playing piano',
});

// Animate with Stability AI Stable Video Diffusion
const video = await animateImage(image.url, {
  motionBucketId: 127, // Controls amount of motion
  frames: 14, // ~0.5 seconds at 25fps
});

// Cost: $0.001 (image) + $0.02 (animation) = $0.021 per video
// 90% cheaper than Kling AI!
```

## 11. Implementation Checklist

- [ ] Research and select 2-3 video providers
- [ ] Create provider abstraction layer
- [ ] Implement Kling AI integration (primary)
- [ ] Implement Haiper integration (backup)
- [ ] Set up video storage (S3/Supabase)
- [ ] Create database schema for jobs and quotas
- [ ] Build API routes (generate, status, list)
- [ ] Implement background job processor
- [ ] Create video generator UI component
- [ ] Add video quota tracking
- [ ] Implement tier-based limits
- [ ] Add video preview/playback
- [ ] Test with various prompts
- [ ] Optimize costs (caching, batching)
- [ ] Add video download functionality
- [ ] Implement image-to-video fallback
- [ ] Monitor generation costs
- [ ] Add analytics dashboard

## 12. Risks & Mitigation

### Risk: High Costs
- **Mitigation**: Strict quotas, cheap providers, length limits
- **Backup**: Image-to-video as fallback

### Risk: Slow Generation
- **Mitigation**: Queue system, realistic expectations (2-5 min wait)
- **UX**: Show progress, allow background generation

### Risk: Poor Quality
- **Mitigation**: Multiple provider options, quality tiers
- **Solution**: User feedback loop, provider switching

### Risk: Provider Downtime
- **Mitigation**: Multiple providers, automatic failover
- **Monitoring**: Health checks, status page

## 13. Future Enhancements

1. **Video Editing**: Trim, merge, add music
2. **Advanced Controls**: Camera movement, style transfer
3. **Longer Videos**: Extend beyond 10 seconds (expensive)
4. **Batch Generation**: Queue multiple videos
5. **Templates**: Pre-made styles and formats
6. **Social Media Export**: Auto-format for Instagram, TikTok
7. **Custom Models**: Fine-tuned for specific styles
8. **Real-time Preview**: Show generation progress

## 14. Recommended Action Plan

### **Month 1: MVP**
1. Integrate Kling AI (cheapest, good quality)
2. Add Haiper as backup (free tier available)
3. Basic UI with queue system
4. Pro tier: 2 videos/month
5. Premium tier: 10 videos/month

### **Month 2: Optimization**
1. Add image-to-video animation
2. Implement caching for popular prompts
3. Optimize batch processing
4. Add analytics

### **Month 3: Premium Features**
1. Add Runway Gen-3 for enterprise
2. Longer video support (10+ seconds)
3. Advanced controls (aspect ratio, style)
4. Social media export

---

**Document Version**: 1.0
**Created**: 2025-10-20
**Last Updated**: 2025-10-20
**Status**: Planning Phase
**Priority**: High (Premium tier differentiator)
**Estimated Effort**: 2-3 weeks
**Expected Cost**: $300-500/month (at 10k users)
**Expected Value**: High engagement, competitive advantage
**Recommended Provider**: Kling AI (best price/quality ratio)
