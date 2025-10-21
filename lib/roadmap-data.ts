export type FeatureStatus = "planned" | "in-progress" | "completed";
export type FeaturePriority = "critical" | "high" | "medium" | "low";

export interface Feature {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  priority: FeaturePriority;
  effort: string;
  impact?: string;
  roi?: string;
  documentLink?: string;
  keyFeatures?: string[];
}

export interface RoadmapPhase {
  id: string;
  title: string;
  description: string;
  timeline: string;
  features: Feature[];
}

export const roadmapData: RoadmapPhase[] = [
  {
    id: "phase-1",
    title: "Phase 1: Foundation",
    description:
      "Core infrastructure and business model implementation for sustainable growth",
    timeline: "Months 1-2 (Q1 2025)",
    features: [
      {
        id: "usage-analytics",
        title: "Usage Analytics & Monitoring",
        description:
          "Comprehensive usage tracking, rate limiting, and analytics dashboard for informed decision-making",
        status: "planned",
        priority: "critical",
        effort: "1-2 weeks",
        impact: "High",
        roi: "High",
        documentLink: "USAGE_ANALYTICS_MONITORING.md",
        keyFeatures: [
          "Per-user usage tracking",
          "Tier-based rate limiting",
          "Cost monitoring dashboard",
          "Admin insights panel",
        ],
      },
      {
        id: "pricing-monetization",
        title: "Pricing & Monetization Strategy",
        description:
          "Multi-tier pricing with free, pro, premium, and enterprise plans targeting 70-80% profit margins",
        status: "planned",
        priority: "critical",
        effort: "1-2 months",
        impact: "High",
        roi: "High",
        documentLink: "PRICING_MONETIZATION_STRATEGY.md",
        keyFeatures: [
          "Free tier: 75 messages/month",
          "Pro tier: $20/month, 750 messages",
          "Premium tier: $50/month, 3000 messages",
          "Enterprise tier: Custom pricing",
        ],
      },
      {
        id: "prompt-caching",
        title: "Prompt Caching Implementation",
        description:
          "Reduce API costs by 50-90% through intelligent prompt caching strategies",
        status: "planned",
        priority: "high",
        effort: "2-3 days",
        impact: "Immediate",
        roi: "Immediate ($200+ savings per 1000 users/month)",
        documentLink: "PROMPT_CACHING_IMPLEMENTATION.md",
        keyFeatures: [
          "System prompt caching",
          "Document context caching",
          "Conversation history caching",
          "90% cost reduction on cached tokens",
        ],
      },
      {
        id: "mobile-accessibility",
        title: "Mobile & Accessibility Features",
        description:
          "Mobile-first responsive design with advanced accessibility for inclusive user experience",
        status: "planned",
        priority: "high",
        effort: "1-2 months",
        impact: "High",
        roi: "High",
        documentLink: "MOBILE_AND_ACCESSIBILITY.md",
        keyFeatures: [
          "Progressive Web App (PWA)",
          "Screen reader optimization",
          "Keyboard navigation",
          "Offline capabilities",
        ],
      },
    ],
  },
  {
    id: "phase-2",
    title: "Phase 2: Core Features",
    description:
      "Premium features and enhanced capabilities to differentiate from competitors",
    timeline: "Months 3-5 (Q2 2025)",
    features: [
      {
        id: "rag-document-search",
        title: "RAG & Intelligent Document Search",
        description:
          "Enable AI-powered conversations with user documents using vector embeddings and semantic search",
        status: "planned",
        priority: "high",
        effort: "2-3 weeks",
        impact: "High",
        roi: "90% cost reduction for document workflows",
        documentLink: "RAG_DOCUMENT_SEARCH.md",
        keyFeatures: [
          "PDF, DOCX, TXT, MD uploads",
          "Vector database (pgvector/Pinecone)",
          "Semantic search with citations",
          "Knowledge base management",
        ],
      },
      {
        id: "artifacts-tools-expansion",
        title: "Artifacts & Tools Expansion",
        description:
          "12 new artifact types and 22 AI tools to enhance user capabilities",
        status: "planned",
        priority: "high",
        effort: "3-6 months",
        impact: "10x feature expansion",
        roi: "High",
        documentLink: "ARTIFACTS_AND_TOOLS_EXPANSION.md",
        keyFeatures: [
          "Chart, Diagram, HTML Preview artifacts",
          "Web search, PDF reading, Translation tools",
          "Code review, Math calculation",
          "Image editing, Speech generation",
        ],
      },
      {
        id: "ai-video-generation",
        title: "AI Video Generation",
        description:
          "Text-to-video and image-to-video generation using cost-effective AI providers",
        status: "planned",
        priority: "high",
        effort: "2-3 weeks",
        impact: "Premium tier differentiator",
        roi: "High ($300-500/month cost at 10k users)",
        documentLink: "AI_VIDEO_GENERATION.md",
        keyFeatures: [
          "3-10 second video clips",
          "Multiple quality tiers",
          "Queue-based processing",
          "Tier-based quotas (Pro: 2/month, Premium: 10/month)",
        ],
      },
      {
        id: "advanced-streaming",
        title: "Advanced Streaming Features",
        description:
          "Enhanced real-time streaming with rich UI components and collaborative features",
        status: "planned",
        priority: "medium",
        effort: "1-2 weeks",
        impact: "10x better perceived performance",
        roi: "Medium",
        documentLink: "ADVANCED_STREAMING_FEATURES.md",
        keyFeatures: [
          "Streaming UI components (charts, tables)",
          "Reasoning visualization",
          "Real-time collaboration",
          "Stream cancellation & progress",
        ],
      },
      {
        id: "advanced-ai-gateway",
        title: "Advanced AI Gateway Features",
        description:
          "Intelligent routing, failover, and enterprise-grade AI infrastructure",
        status: "planned",
        priority: "high",
        effort: "2-3 months",
        impact: "Enterprise capabilities",
        roi: "30-50% cost reduction",
        documentLink: "ADVANCED_AI_GATEWAY_FEATURES.md",
        keyFeatures: [
          "Intelligent model routing",
          "Automatic failover & HA",
          "Advanced caching strategies",
          "Budget management & alerts",
        ],
      },
      {
        id: "dynamic-model-discovery",
        title: "Dynamic Model Discovery",
        description:
          "Automatically discover and integrate new AI models as they become available",
        status: "planned",
        priority: "medium",
        effort: "2-3 days",
        impact: "Reduced maintenance",
        roi: "Medium",
        documentLink: "DYNAMIC_MODEL_DISCOVERY.md",
        keyFeatures: [
          "Automatic model updates",
          "No manual configuration",
          "Always up-to-date pricing",
          "Provider integration",
        ],
      },
    ],
  },
  {
    id: "phase-3",
    title: "Phase 3: Advanced Features",
    description:
      "Enterprise integrations and cutting-edge AI capabilities for team collaboration",
    timeline: "Months 6-8 (Q3 2025)",
    features: [
      {
        id: "artifacts-tools-phase-2",
        title: "Artifacts & Tools Expansion (Phase 2-3)",
        description:
          "Advanced artifact types and specialized AI tools for power users",
        status: "planned",
        priority: "high",
        effort: "Ongoing",
        impact: "Enhanced capabilities",
        roi: "High",
        documentLink: "ARTIFACTS_AND_TOOLS_EXPANSION.md",
        keyFeatures: [
          "Notebook, 3D Viewer, Presentation artifacts",
          "Music/Video generation tools",
          "Advanced data processing",
        ],
      },
      {
        id: "real-time-collaboration",
        title: "Real-Time Collaboration",
        description:
          "Transform into a team collaboration platform with live shared sessions",
        status: "planned",
        priority: "high",
        effort: "2-3 months",
        impact: "Team features unlock",
        roi: "High",
        documentLink: "REAL_TIME_COLLABORATION.md",
        keyFeatures: [
          "Live shared chat sessions",
          "Collaborative artifact editing",
          "Team workspaces & permissions",
          "Real-time notifications",
        ],
      },
      {
        id: "advanced-ai-capabilities",
        title: "Advanced AI Capabilities",
        description:
          "Cutting-edge AI features with multi-modal interactions and autonomous execution",
        status: "planned",
        priority: "high",
        effort: "2-3 months",
        impact: "Premium tier enhancement",
        roi: "High",
        documentLink: "ADVANCED_AI_CAPABILITIES.md",
        keyFeatures: [
          "Multi-modal AI (vision, audio)",
          "Chain-of-thought reasoning",
          "Multi-step task planning",
          "Autonomous task execution",
        ],
      },
      {
        id: "enterprise-integrations",
        title: "Enterprise Integrations & API Ecosystem",
        description:
          "Comprehensive integration ecosystem for enterprise workflows and business processes",
        status: "planned",
        priority: "high",
        effort: "2-3 months",
        impact: "Enterprise tier unlock",
        roi: "High ($50k-200k/month potential)",
        documentLink: "ENTERPRISE_INTEGRATIONS.md",
        keyFeatures: [
          "Slack, Teams integration",
          "Google Workspace, Microsoft 365",
          "CRM systems (Salesforce, HubSpot)",
          "Public API & webhook system",
        ],
      },
    ],
  },
  {
    id: "phase-4",
    title: "Phase 4: Optimization",
    description: "Refinement, scaling, and market expansion",
    timeline: "Months 9-12 (Q4 2025)",
    features: [
      {
        id: "ab-testing",
        title: "A/B Testing & Optimization",
        description:
          "Data-driven feature optimization and user experience improvements",
        status: "planned",
        priority: "medium",
        effort: "Ongoing",
        impact: "Conversion optimization",
        roi: "High",
        keyFeatures: [
          "Feature flag system",
          "Conversion funnel tracking",
          "Multivariate testing",
          "User cohort analysis",
        ],
      },
      {
        id: "advanced-analytics",
        title: "Advanced Analytics",
        description:
          "Deep insights into user behavior, model performance, and business metrics",
        status: "planned",
        priority: "medium",
        effort: "Ongoing",
        impact: "Business intelligence",
        roi: "High",
        keyFeatures: [
          "Custom dashboards",
          "Predictive analytics",
          "Cohort retention analysis",
          "Revenue forecasting",
        ],
      },
      {
        id: "performance-tuning",
        title: "Performance Tuning",
        description:
          "Optimization for speed, reliability, and cost efficiency at scale",
        status: "planned",
        priority: "high",
        effort: "Ongoing",
        impact: "Scalability",
        roi: "High",
        keyFeatures: [
          "Database query optimization",
          "CDN and edge caching",
          "Load balancing",
          "Auto-scaling infrastructure",
        ],
      },
      {
        id: "market-expansion",
        title: "Market Expansion",
        description:
          "International markets, localization, and strategic partnerships",
        status: "planned",
        priority: "medium",
        effort: "Ongoing",
        impact: "Revenue growth",
        roi: "High",
        keyFeatures: [
          "Multi-language support",
          "Regional pricing",
          "Partner integrations",
          "White-label options",
        ],
      },
    ],
  },
];

export const roadmapStats = {
  totalFeatures: 13,
  estimatedValue: "$500k+/month (at 100k users)",
  estimatedEffort: "12-18 months (2-3 developers)",
  targetMargins: "70-80% gross profit",
};

export const expectedImpact = {
  costSavings: {
    promptCaching: "50-90% reduction in API costs",
    rag: "90% reduction for document workflows",
    intelligentRouting: "30-50% reduction through model optimization",
    totalPotential: "$10k-50k/month at scale",
  },
  revenueGeneration: {
    "10k users": "~$16k/month",
    "50k users": "~$177k/month",
    "100k users": "~$350k/month",
    enterprise: "Additional $50k-200k/month",
    api: "Additional $20k-100k/month",
  },
};
