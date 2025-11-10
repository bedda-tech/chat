"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SubscriptionStatus = {
  tier: "free" | "pro" | "premium" | "enterprise";
  usage: {
    messageCount: number;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    totalCost: number;
    cachedSavings: number;
  };
  limits: {
    messagesPerMonth: number;
    messagesPerDay: number;
    messagesPerMinute: number;
  };
  percentUsed: number;
};

export function UsageDisplay() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch("/api/subscription/status");
        if (!response.ok) {
          throw new Error("Failed to fetch subscription status");
        }
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error || !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription className="text-destructive">
            {error || "Failed to load usage data"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "pro":
        return "bg-blue-500";
      case "premium":
        return "bg-purple-500";
      case "enterprise":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(cost);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your subscription tier and usage</CardDescription>
            </div>
            <Badge className={getTierColor(status.tier)}>
              {status.tier.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Message Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Messages this month</span>
              <span className="font-medium">
                {formatNumber(status.usage.messageCount)} /{" "}
                {formatNumber(status.limits.messagesPerMonth)}
              </span>
            </div>
            <Progress value={status.percentUsed} className="h-2" />
            <p className="text-muted-foreground text-xs">
              {status.percentUsed.toFixed(1)}% of monthly limit used
            </p>
          </div>

          {/* Rate Limits */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Per Minute</p>
              <p className="font-semibold text-2xl">
                {status.limits.messagesPerMinute}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Per Day</p>
              <p className="font-semibold text-2xl">
                {formatNumber(status.limits.messagesPerDay)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Usage & Cost */}
      <Card>
        <CardHeader>
          <CardTitle>Token Usage & Cost</CardTitle>
          <CardDescription>Detailed usage metrics for this month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Input Tokens</p>
              <p className="font-semibold text-xl">
                {formatNumber(status.usage.inputTokens)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Output Tokens</p>
              <p className="font-semibold text-xl">
                {formatNumber(status.usage.outputTokens)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Cached Tokens</p>
              <p className="font-semibold text-xl text-green-600">
                {formatNumber(status.usage.cachedTokens)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Estimated Cost</p>
              <p className="font-semibold text-xl">
                {formatCost(status.usage.totalCost)}
              </p>
            </div>
          </div>

          {/* Savings Display */}
          {status.usage.cachedSavings > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-600">Savings from caching</p>
                <p className="font-semibold text-green-600">
                  {formatCost(status.usage.cachedSavings)}
                </p>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {(
                  (status.usage.cachedTokens /
                    (status.usage.inputTokens + status.usage.cachedTokens)) *
                  100
                ).toFixed(1)}
                % cache hit rate
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
