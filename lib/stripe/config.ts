import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

/**
 * Stripe client instance
 * Configured with API version and TypeScript support
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
  appInfo: {
    name: "Bedda Chat",
    version: "1.0.0",
  },
});

/**
 * Stripe pricing plan IDs
 * These should match the product IDs created in Stripe Dashboard
 */
export const STRIPE_PLANS = {
  FREE: {
    id: null, // Free tier has no Stripe product
    name: "Free",
    price: 0,
    messagesPerMonth: 75,
  },
  PRO: {
    id: process.env.STRIPE_PRO_PRICE_ID,
    name: "Pro",
    price: 2000, // $20.00 in cents
    messagesPerMonth: 750,
  },
  PREMIUM: {
    id: process.env.STRIPE_PREMIUM_PRICE_ID,
    name: "Premium",
    price: 5000, // $50.00 in cents
    messagesPerMonth: 3000,
  },
} as const;

/**
 * Map Stripe price IDs to internal tier types
 */
export function mapStripePriceToTier(
  priceId: string
): "free" | "pro" | "premium" {
  if (priceId === STRIPE_PLANS.PRO.id) return "pro";
  if (priceId === STRIPE_PLANS.PREMIUM.id) return "premium";
  return "free";
}

/**
 * Map internal tier to Stripe price ID
 */
export function mapTierToStripePrice(
  tier: "free" | "pro" | "premium" | "enterprise"
): string | null {
  if (tier === "pro") return STRIPE_PLANS.PRO.id || null;
  if (tier === "premium") return STRIPE_PLANS.PREMIUM.id || null;
  return null;
}
