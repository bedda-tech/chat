"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  Feature,
  FeaturePriority,
  FeatureStatus,
  RoadmapPhase,
} from "@/lib/roadmap-data";
import { expectedImpact, roadmapData, roadmapStats } from "@/lib/roadmap-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusColors: Record<FeatureStatus, string> = {
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  "in-progress": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  planned: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const priorityColors: Record<FeaturePriority, string> = {
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

function FeatureCard({ feature }: { feature: Feature }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{feature.title}</CardTitle>
            <CardDescription className="mt-1">
              {feature.description}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={statusColors[feature.status]} variant="outline">
              {feature.status}
            </Badge>
            <Badge className={priorityColors[feature.priority]} variant="outline">
              {feature.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Effort:</span>
              <span className="font-medium">{feature.effort}</span>
            </div>
            {feature.impact && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Impact:</span>
                <span className="font-medium">{feature.impact}</span>
              </div>
            )}
            {feature.roi && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">ROI:</span>
                <span className="font-medium">{feature.roi}</span>
              </div>
            )}
          </div>

          {feature.keyFeatures && feature.keyFeatures.length > 0 && (
            <div>
              <button
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => setIsExpanded(!isExpanded)}
                type="button"
              >
                {isExpanded ? "Hide" : "Show"} key features
              </button>
              {isExpanded && (
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {feature.keyFeatures.map((keyFeature, idx) => (
                    <li className="flex items-start gap-2" key={idx}>
                      <span className="text-primary">•</span>
                      <span>{keyFeature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {feature.documentLink && (
            <div>
              <Link
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                href={`https://github.com/bedda-tech/chat/blob/main/docs/feature-ideas/${feature.documentLink}`}
                target="_blank"
              >
                View detailed documentation →
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PhaseSection({ phase }: { phase: RoadmapPhase }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{phase.title}</h2>
          <Badge className="bg-primary/10" variant="outline">
            {phase.timeline}
          </Badge>
        </div>
        <p className="text-muted-foreground">{phase.description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {phase.features.map((feature) => (
          <FeatureCard feature={feature} key={feature.id} />
        ))}
      </div>
    </div>
  );
}

function StatsSection() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{roadmapStats.totalFeatures}</div>
          <p className="text-muted-foreground text-xs">
            Planned across all phases
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Estimated Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {roadmapStats.estimatedValue.split(" ")[0]}
          </div>
          <p className="text-muted-foreground text-xs">
            Monthly revenue at 100k users
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12-18 mo</div>
          <p className="text-muted-foreground text-xs">
            With 2-3 developers
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ImpactSection() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Cost Savings</CardTitle>
          <CardDescription>
            Expected reductions in operational costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prompt Caching:</span>
              <span className="font-medium">
                {expectedImpact.costSavings.promptCaching}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">RAG Implementation:</span>
              <span className="font-medium">
                {expectedImpact.costSavings.rag}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intelligent Routing:</span>
              <span className="font-medium">
                {expectedImpact.costSavings.intelligentRouting}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total Potential:</span>
              <span>{expectedImpact.costSavings.totalPotential}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Generation</CardTitle>
          <CardDescription>
            Projected monthly revenue at different scales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">10k users:</span>
              <span className="font-medium">
                {expectedImpact.revenueGeneration["10k users"]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">50k users:</span>
              <span className="font-medium">
                {expectedImpact.revenueGeneration["50k users"]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">100k users:</span>
              <span className="font-medium">
                {expectedImpact.revenueGeneration["100k users"]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Enterprise:</span>
              <span className="font-medium">
                {expectedImpact.revenueGeneration.enterprise}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">API Ecosystem:</span>
              <span className="font-medium">
                {expectedImpact.revenueGeneration.api}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RoadmapView() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Product Roadmap</h1>
        <p className="text-muted-foreground text-lg">
          Our vision for the future of bedda.ai - transforming AI chat into a
          comprehensive productivity platform
        </p>
      </div>

      <StatsSection />

      <Tabs className="space-y-6" defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="phase-1">Phase 1</TabsTrigger>
          <TabsTrigger value="phase-2">Phase 2</TabsTrigger>
          <TabsTrigger value="phase-3">Phase 3</TabsTrigger>
          <TabsTrigger value="phase-4">Phase 4</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-8" value="overview">
          {roadmapData.map((phase) => (
            <PhaseSection key={phase.id} phase={phase} />
          ))}
        </TabsContent>

        <TabsContent value="phase-1">
          <PhaseSection phase={roadmapData[0]} />
        </TabsContent>

        <TabsContent value="phase-2">
          <PhaseSection phase={roadmapData[1]} />
        </TabsContent>

        <TabsContent value="phase-3">
          <PhaseSection phase={roadmapData[2]} />
        </TabsContent>

        <TabsContent value="phase-4">
          <PhaseSection phase={roadmapData[3]} />
        </TabsContent>

        <TabsContent value="impact">
          <ImpactSection />
        </TabsContent>
      </Tabs>

      <div className="rounded-lg border bg-muted/50 p-6">
        <h3 className="mb-2 font-semibold">Want to contribute or suggest features?</h3>
        <p className="text-muted-foreground text-sm">
          We're building in public and welcome feedback from our community. Each
          feature has detailed documentation in our{" "}
          <Link
            className="font-medium text-primary hover:underline"
            href="https://github.com/bedda-tech/chat/tree/main/docs/feature-ideas"
            target="_blank"
          >
            GitHub repository
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
