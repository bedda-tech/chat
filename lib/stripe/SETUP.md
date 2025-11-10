# Stripe Setup Guide

This guide explains how to set up Stripe for the Bedda Chat subscription system.

## Prerequisites

1. Create a Stripe account at https://stripe.com
2. Get your API keys from https://dashboard.stripe.com/apikeys

## Step 1: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_... # Use sk_live_... for production
STRIPE_PUBLISHABLE_KEY=pk_test_... # Use pk_live_... for production

# These will be filled in after creating products in Step 2
STRIPE_PRO_PRICE_ID=
STRIPE_PREMIUM_PRICE_ID=

# Webhook secret (filled in Step 3)
STRIPE_WEBHOOK_SECRET=
```

## Step 2: Create Products and Prices

### Option A: Using Stripe Dashboard (Recommended for First Time)

1. Go to https://dashboard.stripe.com/products
2. Click "Add product" for each tier:

#### Pro Plan ($20/month)
- **Name**: Bedda Chat Pro
- **Description**: 750 messages per month with advanced AI models
- **Pricing**: $20.00 USD
- **Billing period**: Monthly
- **Recurring**: Yes

After creating, copy the **Price ID** (starts with `price_`) and add to `STRIPE_PRO_PRICE_ID`

#### Premium Plan ($50/month)
- **Name**: Bedda Chat Premium
- **Description**: 3,000 messages per month with all AI models
- **Pricing**: $50.00 USD
- **Billing period**: Monthly
- **Recurring**: Yes

After creating, copy the **Price ID** (starts with `price_`) and add to `STRIPE_PREMIUM_PRICE_ID`

### Option B: Using Stripe CLI (Automated)

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Create Pro product and price
stripe products create \
  --name="Bedda Chat Pro" \
  --description="750 messages per month with advanced AI models"

# Note the product ID (prod_xxx), then create price:
stripe prices create \
  --product=prod_xxx \
  --unit-amount=2000 \
  --currency=usd \
  --recurring[interval]=month

# Create Premium product and price
stripe products create \
  --name="Bedda Chat Premium" \
  --description="3,000 messages per month with all AI models"

# Note the product ID (prod_yyy), then create price:
stripe prices create \
  --product=prod_yyy \
  --unit-amount=5000 \
  --currency=usd \
  --recurring[interval]=month
```

## Step 3: Set Up Webhooks

Webhooks are required to sync subscription events with your database.

### Local Development

1. Install Stripe CLI (if not already): https://stripe.com/docs/stripe-cli
2. Forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

3. Copy the webhook signing secret (starts with `whsec_`) to `STRIPE_WEBHOOK_SECRET`

### Production

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed` (Primary event - payment successful)
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Step 4: Test the Integration

1. Start your local development server
2. Create a test checkout session
3. Use Stripe test card: `4242 4242 4242 4242` (any future expiry, any CVC)
4. Verify subscription created in Stripe Dashboard
5. Verify user tier updated in your database

## Pricing Tiers Summary

| Tier | Price | Messages/Month | Features |
|------|-------|----------------|----------|
| Free | $0 | 75 | Basic AI models, rate limits |
| Pro | $20 | 750 | Advanced models, higher limits |
| Premium | $50 | 3,000 | All models, priority support |

## Stripe Configuration in Code

The Stripe configuration is located in:
- `lib/stripe/config.ts` - Client setup and plan definitions
- `lib/stripe/subscriptions.ts` - Subscription management functions
- `lib/stripe/index.ts` - Public exports

## Usage Limits

Rate limits are defined in `lib/usage/tracking.ts`:

```typescript
free: {
  messagesPerMinute: 3,
  messagesPerDay: 30,
  messagesPerMonth: 75,
}
pro: {
  messagesPerMinute: 10,
  messagesPerDay: 300,
  messagesPerMonth: 750,
}
premium: {
  messagesPerMinute: 20,
  messagesPerDay: 1000,
  messagesPerMonth: 3000,
}
```

## Next Steps

After completing this setup:
1. Build the webhook handler (`/api/webhooks/stripe`)
2. Create subscription management UI
3. Add user tier synchronization with Stripe subscriptions
4. Test end-to-end subscription flow

## Resources

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe API Docs: https://stripe.com/docs/api
- Stripe Testing: https://stripe.com/docs/testing
- Stripe CLI: https://stripe.com/docs/stripe-cli
