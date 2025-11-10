"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type SubscriptionManagementProps = {
  currentTier: "free" | "pro" | "premium" | "enterprise";
};

export function SubscriptionManagement({
  currentTier,
}: SubscriptionManagementProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleUpgrade = async (tier: "pro" | "premium") => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create checkout session");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create portal session");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Subscription</CardTitle>
        <CardDescription>
          Upgrade your plan or manage your billing settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        {currentTier === "free" && (
          <div className="space-y-2">
            <p className="text-sm">
              You're currently on the <strong>Free</strong> plan. Upgrade to get
              more messages and access to advanced AI models.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => handleUpgrade("pro")}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Upgrade to Pro ($20/mo)"
                )}
              </Button>
              <Button
                onClick={() => handleUpgrade("premium")}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Upgrade to Premium ($50/mo)"
                )}
              </Button>
            </div>
          </div>
        )}

        {currentTier === "pro" && (
          <div className="space-y-2">
            <p className="text-sm">
              You're currently on the <strong>Pro</strong> plan. Upgrade to
              Premium for even more messages and features.
            </p>
            <Button
              onClick={() => handleUpgrade("premium")}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Upgrade to Premium ($50/mo)"
              )}
            </Button>
          </div>
        )}

        {(currentTier === "pro" || currentTier === "premium") && (
          <Button
            onClick={handleManageBilling}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Manage Billing"
            )}
          </Button>
        )}

        {currentTier === "premium" && (
          <p className="text-muted-foreground text-sm">
            You're on the highest tier. Use "Manage Billing" to update payment
            methods or cancel your subscription.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start space-y-2">
        <p className="text-muted-foreground text-xs">
          All plans include automatic billing. You can cancel anytime.
        </p>
        {currentTier !== "free" && (
          <p className="text-muted-foreground text-xs">
            Changes take effect immediately. Downgrades are prorated.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
