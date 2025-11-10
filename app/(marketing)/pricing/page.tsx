import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for trying out Bedda Chat",
    features: [
      "75 messages per month",
      "Access to basic AI models",
      "3 messages per minute",
      "30 messages per day",
      "Standard response time",
    ],
    cta: "Get Started",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$20",
    description: "For power users and professionals",
    features: [
      "750 messages per month",
      "Access to advanced AI models",
      "10 messages per minute",
      "300 messages per day",
      "Priority support",
      "Code execution & artifacts",
      "Image generation",
    ],
    cta: "Upgrade to Pro",
    href: "/register",
    highlighted: true,
  },
  {
    name: "Premium",
    price: "$50",
    description: "For teams and heavy users",
    features: [
      "3,000 messages per month",
      "Access to all AI models",
      "20 messages per minute",
      "1,000 messages per day",
      "Priority support",
      "Code execution & artifacts",
      "Image generation",
      "Advanced analytics",
    ],
    cta: "Upgrade to Premium",
    href: "/register",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="container py-12 md:py-24">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h1 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          Simple, transparent pricing
        </h1>
        <p className="max-w-[85%] text-muted-foreground leading-normal sm:text-lg sm:leading-7">
          Choose the plan that's right for you. Upgrade, downgrade, or cancel
          anytime.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-3">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={
              tier.highlighted
                ? "border-primary relative shadow-lg"
                : "relative"
            }
          >
            {tier.highlighted && (
              <div className="bg-primary text-primary-foreground absolute top-0 right-0 rounded-bl-lg rounded-tr-lg px-3 py-1 text-sm font-medium">
                Popular
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.price !== "$0" && (
                  <span className="text-muted-foreground text-sm">/month</span>
                )}
              </div>
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 flex-shrink-0 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="w-full"
                variant={tier.highlighted ? "default" : "outline"}
              >
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-3xl">
        <h2 className="mb-8 text-center font-bold text-2xl">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 font-semibold text-lg">
              Can I change plans later?
            </h3>
            <p className="text-muted-foreground">
              Yes! You can upgrade, downgrade, or cancel your subscription at
              any time from your account settings. Changes take effect
              immediately, and we'll prorate any charges.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-lg">
              What happens when I hit my message limit?
            </h3>
            <p className="text-muted-foreground">
              Your account will be rate-limited until the next billing cycle.
              You can upgrade to a higher tier at any time to get more messages
              immediately.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-lg">
              What AI models are included?
            </h3>
            <p className="text-muted-foreground">
              Free tier includes GPT-3.5 and Claude Haiku. Pro adds GPT-4,
              Claude Sonnet, and Gemini Pro. Premium includes all models
              including GPT-4 Turbo, Claude Opus, and specialized models.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-lg">
              Do you offer refunds?
            </h3>
            <p className="text-muted-foreground">
              We offer a 7-day money-back guarantee for all paid plans. If
              you're not satisfied, contact support for a full refund.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
