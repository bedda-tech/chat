import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { stripe, getSubscriptionTier } from "@/lib/stripe";
import { userTier } from "@/lib/db/schema";

const connectionString = process.env.POSTGRES_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

/**
 * Stripe webhook handler
 * Handles subscription lifecycle events and syncs user tier to database
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session completion
 * This is the first event fired when a customer completes payment
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error("No userId in checkout session metadata:", session.id);
    return;
  }

  // Checkout successful - subscription is being created
  // The subscription.created event will handle the actual provisioning
  console.log(`Checkout completed for user ${userId}, session: ${session.id}`);

  // Store customer ID immediately for billing portal access
  if (session.customer) {
    const existing = await db
      .select()
      .from(userTier)
      .where(eq(userTier.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userTier)
        .set({
          stripeCustomerId: session.customer as string,
          updatedAt: new Date(),
        })
        .where(eq(userTier.userId, userId));
    } else {
      // Create user tier record if it doesn't exist
      await db.insert(userTier).values({
        userId,
        tier: "free", // Will be updated by subscription.created event
        stripeCustomerId: session.customer as string,
      });
    }
  }
}

/**
 * Handle subscription creation or update
 */
async function handleSubscriptionChange(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error("No userId in subscription metadata:", subscription.id);
    return;
  }

  // Get the tier from the subscription
  const tier = await getSubscriptionTier(subscription);

  console.log(`Updating user ${userId} to tier: ${tier}`);

  // Update or create user tier
  const existing = await db
    .select()
    .from(userTier)
    .where(eq(userTier.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(userTier)
      .set({
        tier,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        stripeCustomerId: subscription.customer as string,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date(),
      })
      .where(eq(userTier.userId, userId));
  } else {
    await db.insert(userTier).values({
      userId,
      tier,
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      stripeCustomerId: subscription.customer as string,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  }
}

/**
 * Handle subscription deletion (downgrade to free tier)
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error("No userId in subscription metadata:", subscription.id);
    return;
  }

  console.log(`Downgrading user ${userId} to free tier`);

  // Downgrade to free tier
  await db
    .update(userTier)
    .set({
      tier: "free",
      subscriptionId: null,
      subscriptionStatus: null,
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(userTier.userId, userId));
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  console.log(`Payment succeeded for invoice: ${invoice.id}`);
  // Can be used to send payment confirmation emails, update payment history, etc.
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  console.error(`Payment failed for invoice: ${invoice.id}`);
  // Can be used to send payment failure notifications, retry logic, etc.
}
