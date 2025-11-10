# Testing the Subscription Flow

This guide walks you through testing the complete subscription system locally.

## Prerequisites

1. **Stripe Account:** Sign up at https://stripe.com (free)
2. **Stripe CLI:** Install from https://stripe.com/docs/stripe-cli
3. **Environment Variables:** See setup below

## Step 1: Get Stripe API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with `sk_test_`)
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Add to `.env.local`:

```bash
STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE"
STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"

# These are already set from our Stripe setup:
STRIPE_PRO_PRICE_ID="price_1SPUpMGUAVWeO6RUZJ315Ulu"
STRIPE_PREMIUM_PRICE_ID="price_1SPUqOGUAVWeO6RUnMq80lnc"
```

## Step 2: Set Up Webhook Forwarding

Open a new terminal and run:

```bash
# Login to Stripe (first time only)
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook signing secret like:
```
Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

Copy that secret and add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET="whsec_YOUR_SECRET_HERE"
```

## Step 3: Start the Development Server

In your main terminal:

```bash
pnpm dev
```

Your app should now be running at http://localhost:3000

## Step 4: Test the Flow

### A. View Pricing Page
1. Go to http://localhost:3000/pricing
2. You should see 3 tiers: Free, Pro ($20), Premium ($50)
3. Each tier has feature lists and CTA buttons

### B. Create Account (if needed)
1. Click "Get Started"
2. Register a new account
3. You'll be logged in with Free tier by default

### C. Check Settings Page
1. Go to http://localhost:3000/settings
2. You should see:
   - Current plan: FREE badge
   - Usage metrics (should be mostly 0 for new account)
   - "Upgrade to Pro" and "Upgrade to Premium" buttons

### D. Test Pro Upgrade
1. Click "Upgrade to Pro ($20/mo)"
2. You'll be redirected to Stripe Checkout
3. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - Name: Any name
   - Email: Your test email
4. Click "Subscribe"

### E. Verify Webhook Processing
In the terminal running `stripe listen`, you should see:
```
✔ Received event checkout.session.completed
✔ Received event customer.subscription.created
✔ Received event invoice.payment_succeeded
```

### F. Check Success Page
1. You should be redirected to http://localhost:3000/subscription/success
2. Page shows "Subscription Successful!" with green checkmark

### G. Verify Subscription in Settings
1. Go back to http://localhost:3000/settings
2. You should now see:
   - Current plan: PRO badge (blue)
   - "Upgrade to Premium" button
   - "Manage Billing" button
   - Updated usage limits (750 messages/month)

### H. Test Billing Portal
1. Click "Manage Billing"
2. You'll be redirected to Stripe's billing portal
3. You can:
   - Update payment method
   - View invoice history
   - Cancel subscription

### I. Test Cancellation (Optional)
1. In the billing portal, click "Cancel plan"
2. Confirm cancellation
3. Webhook will fire `customer.subscription.deleted`
4. Go back to settings - you should be on Free tier again

## Step 5: Test Premium Upgrade

Repeat steps D-G but click "Upgrade to Premium" instead of Pro.

## Step 6: Test Usage Tracking

1. Go to the main chat: http://localhost:3000
2. Send some messages
3. Go back to settings
4. You should see:
   - Message count incremented
   - Token usage updated
   - If caching is working, you'll see "Cached Tokens" > 0
   - "Savings from caching" should show a dollar amount

## Stripe Test Cards

### Successful Payments
- `4242 4242 4242 4242` - Visa (succeeds immediately)
- `5555 5555 5555 4444` - Mastercard (succeeds immediately)

### Failed Payments
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds

### 3D Secure (Additional authentication)
- `4000 0025 0000 3155` - Requires 3D Secure authentication

## Verifying in Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/customers
2. Find your customer (search by email)
3. View subscription details
4. Check invoice history
5. Verify webhooks at https://dashboard.stripe.com/test/webhooks

## Common Issues

### "Webhook signature verification failed"
- Make sure `STRIPE_WEBHOOK_SECRET` matches the output from `stripe listen`
- Restart the dev server after adding the secret

### "No subscription found" in Manage Billing
- Subscription might not be synced yet
- Check webhook terminal for errors
- Verify `stripeCustomerId` is set in database

### Checkout redirects to wrong URL
- Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env.local`
- This ensures success/cancel URLs work correctly

### Usage not updating
- Check browser console for API errors
- Verify `/api/subscription/status` endpoint works
- Check database for usage records

## Database Verification

You can check the database directly:

```bash
# View user tiers
pnpm db:studio
```

Then navigate to the `UserTier` table and verify:
- `tier` column shows correct tier
- `stripeCustomerId` is populated
- `subscriptionId` is set
- `subscriptionStatus` is "active"

## Testing Checklist

- [ ] Pricing page loads and looks good
- [ ] Settings page shows usage metrics
- [ ] Free → Pro upgrade works
- [ ] Webhook fires and updates tier
- [ ] Success page displays correctly
- [ ] Settings shows Pro tier badge
- [ ] Billing portal opens
- [ ] Can view/cancel subscription
- [ ] Cancellation downgrades to free
- [ ] Free → Premium upgrade works
- [ ] Usage tracking increments after messages
- [ ] Cache savings display (if caching active)

## Next Steps

Once local testing is complete:

1. **Deploy to Vercel/Production**
2. **Switch to Live Stripe Keys**
   - Get from https://dashboard.stripe.com/apikeys (no /test/)
   - Update all env variables
3. **Set up production webhooks**
   - https://dashboard.stripe.com/webhooks
   - Point to `https://yourdomain.com/api/webhooks/stripe`
4. **Test with real card** (your own, small amount)
5. **Monitor first real customers**

## Support

If you encounter issues:
1. Check webhook terminal for errors
2. Check browser console for client errors
3. Check server logs for API errors
4. Verify all env variables are set
5. Ensure database migration ran successfully

---

Happy testing! 🚀
