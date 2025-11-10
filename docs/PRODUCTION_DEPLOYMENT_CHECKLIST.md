# Production Deployment Checklist - Phase 1

**Version**: 1.0
**Last Updated**: 2025-11-05
**Status**: Ready for Production

---

## Pre-Deployment

### Environment Variables

#### Required Variables
- [ ] `AUTH_SECRET` - Next-auth secret key (generate with `openssl rand -base64 32`)
- [ ] `AI_GATEWAY_API_KEY` - Vercel AI Gateway API key
- [ ] `POSTGRES_URL` - Production database connection string
- [ ] `REDIS_URL` - Redis connection string for rate limiting
- [ ] `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token

#### Stripe Configuration
- [ ] `STRIPE_SECRET_KEY` - Production secret key (starts with `sk_live_`)
- [ ] `STRIPE_PUBLISHABLE_KEY` - Production publishable key (starts with `pk_live_`)
- [ ] `STRIPE_PRO_PRICE_ID` - Production Pro plan price ID
- [ ] `STRIPE_PREMIUM_PRICE_ID` - Production Premium plan price ID
- [ ] `STRIPE_WEBHOOK_SECRET` - Production webhook signing secret

#### Optional But Recommended
- [ ] `SENTRY_DSN` - Error tracking (if using Sentry)
- [ ] `ANALYTICS_ID` - Analytics tracking ID (if applicable)

### Stripe Setup

#### 1. Create Production Products
- [ ] Create "Pro" product in Stripe Dashboard
  - Price: $20/month
  - Recurring billing
  - Copy price ID to `STRIPE_PRO_PRICE_ID`
- [ ] Create "Premium" product in Stripe Dashboard
  - Price: $50/month
  - Recurring billing
  - Copy price ID to `STRIPE_PREMIUM_PRICE_ID`

#### 2. Configure Webhook Endpoint
- [ ] Go to https://dashboard.stripe.com/webhooks
- [ ] Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Select events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`
- [ ] Test webhook with Stripe CLI:
  ```bash
  stripe trigger checkout.session.completed
  ```

#### 3. Payment Settings
- [ ] Enable Stripe Checkout in production mode
- [ ] Configure allowed payment methods (cards, wallets)
- [ ] Set up email receipts
- [ ] Configure invoice settings
- [ ] Test payment flow with real card (then refund)

### Database Setup

#### 1. Run Migrations
```bash
# Verify all migrations are applied
psql $POSTGRES_URL -c "SELECT * FROM migrations ORDER BY id;"

# Expected migrations:
# 0001_initial_schema.sql
# 0002_add_usage_tracking.sql
# ...
# 0009_add_stripe_customer_id.sql
```

#### 2. Database Indexes
- [ ] Verify indexes exist on:
  - `User.email` (for auth lookups)
  - `Chat.userId` (for user chat queries)
  - `Message.chatId` (for message queries)
  - `UserTier.userId` (for subscription lookups)
  - `UsageRecord.userId` (for usage queries)

#### 3. Database Backup
- [ ] Set up automated daily backups
- [ ] Test backup restoration process
- [ ] Document backup retention policy

### Redis Setup

#### 1. Rate Limiting Cache
- [ ] Verify Redis connection
- [ ] Test rate limiting:
  ```bash
  # Should block after limit
  for i in {1..25}; do curl -X POST https://yourdomain.com/api/chat; done
  ```
- [ ] Set up Redis persistence (AOF or RDB)
- [ ] Configure eviction policy: `allkeys-lru`

#### 2. Model Cache (Optional)
- [ ] Consider Redis for model cache (instead of in-memory)
- [ ] Configure cache TTL: 1 hour
- [ ] Set up cache warming script

---

## Deployment Steps

### 1. Pre-Deployment Checks

#### Code Quality
- [ ] All tests passing:
  ```bash
  pnpm test
  ```
- [ ] No TypeScript errors:
  ```bash
  pnpm tsc --noEmit
  ```
- [ ] Linting passed:
  ```bash
  pnpm lint
  ```
- [ ] Build succeeds:
  ```bash
  pnpm build
  ```

#### Security Review
- [ ] No API keys committed to repository
- [ ] `.env.local` not committed
- [ ] Webhook signature verification enabled
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Authentication middleware protecting routes

#### Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Model API cache working (< 500ms cached)

### 2. Deploy to Production

#### Vercel Deployment
```bash
# Deploy to production
vercel --prod

# Or push to main branch for auto-deploy
git push origin main
```

#### Environment Variables
- [ ] Set all production environment variables in Vercel Dashboard
- [ ] Verify environment variables are loaded:
  ```bash
  vercel env pull
  ```

#### Domain Configuration
- [ ] Configure custom domain
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Set up www redirect (if applicable)
- [ ] Configure DNS records

### 3. Post-Deployment Verification

#### Health Checks
- [ ] Homepage loads: https://yourdomain.com
- [ ] Pricing page loads: https://yourdomain.com/pricing
- [ ] API endpoints respond:
  - [ ] `GET /api/models` (200 OK)
  - [ ] `POST /api/webhooks/stripe` (test mode)
  - [ ] `GET /api/subscription/status` (with auth)
- [ ] Authentication flow works (sign up, log in, log out)

#### Dynamic Model Discovery
- [ ] Test model API:
  ```bash
  curl https://yourdomain.com/api/models | jq '.models | length'
  ```
- [ ] Expected: ~135 models
- [ ] Verify caching (second request < 500ms)
- [ ] Check server logs for discovery messages

#### Stripe Integration
- [ ] Test checkout flow with real card (then cancel)
- [ ] Verify webhook receives events (check Stripe Dashboard)
- [ ] Confirm subscription updates database
- [ ] Test billing portal access
- [ ] Verify invoice generation

#### Rate Limiting
- [ ] Test rate limit enforcement:
  ```bash
  # Should get 429 after limit
  for i in {1..25}; do curl -X POST https://yourdomain.com/api/chat -H "Authorization: Bearer $TOKEN"; done
  ```
- [ ] Verify different limits per tier (Free vs Pro)

#### Monitoring
- [ ] Set up error tracking (Sentry/etc)
- [ ] Configure logging (Vercel logs or external)
- [ ] Set up uptime monitoring (Better Uptime, Pingdom, etc)
- [ ] Create alerts for:
  - High error rate (> 5%)
  - Stripe webhook failures
  - Database connection issues
  - High cache miss rate (< 50%)

---

## Monitoring & Alerts

### Metrics to Track

#### Application Health
- [ ] Uptime (target: 99.9%)
- [ ] Error rate (target: < 1%)
- [ ] Response time (target: < 2s p95)
- [ ] API success rate (target: > 99%)

#### Business Metrics
- [ ] New user signups
- [ ] Conversion rate (Free → Pro/Premium)
- [ ] Monthly Recurring Revenue (MRR)
- [ ] Churn rate
- [ ] Active users (DAU/MAU)

#### Cost Metrics
- [ ] AI Gateway API costs
- [ ] Database costs
- [ ] Redis costs
- [ ] Total infra costs
- [ ] Cost per active user

#### Feature Metrics
- [ ] Cache hit rate (target: > 80%)
- [ ] Model discovery success rate (target: > 99%)
- [ ] Webhook delivery success rate (target: > 99%)
- [ ] Average response time per model

### Alert Thresholds

#### Critical (Page immediately)
- [ ] Site down (> 5 minute outage)
- [ ] Database unreachable
- [ ] Error rate > 10%
- [ ] Stripe webhook signature failures

#### Warning (Slack/Email)
- [ ] Error rate > 5%
- [ ] Response time > 5s (p95)
- [ ] Cache hit rate < 50%
- [ ] High Redis memory usage (> 80%)
- [ ] Failed payment webhooks

#### Info (Log only)
- [ ] New user signups
- [ ] Successful subscriptions
- [ ] Cache refreshes
- [ ] Model discovery updates

---

## Rollback Plan

### When to Rollback

Rollback if any of these occur within first hour:

- [ ] Error rate > 10%
- [ ] Critical feature broken (auth, payments)
- [ ] Database data corruption
- [ ] Security vulnerability discovered

### Rollback Steps

```bash
# 1. Revert to previous deployment
vercel rollback

# 2. Verify previous version is working
curl https://yourdomain.com/api/health

# 3. Investigate issue in safe environment
git checkout <previous-commit>
pnpm dev

# 4. Fix issue and re-deploy
git commit -am "fix: critical issue"
git push origin main
```

### Rollback Verification
- [ ] Site is accessible
- [ ] Authentication works
- [ ] Payments processing normally
- [ ] Database connections stable
- [ ] No error spikes in logs

---

## Post-Deployment Tasks

### Day 1
- [ ] Monitor error logs continuously
- [ ] Watch webhook delivery rates
- [ ] Check cache hit rates
- [ ] Verify first real payment processes correctly
- [ ] Update team on deployment status

### Week 1
- [ ] Review error patterns
- [ ] Analyze cache performance
- [ ] Check cost projections vs actuals
- [ ] Gather user feedback
- [ ] Optimize slow queries (if any)

### Month 1
- [ ] Review business metrics (MRR, churn, etc)
- [ ] Analyze cost efficiency (AI Gateway usage)
- [ ] Plan optimizations based on usage patterns
- [ ] Review and update documentation
- [ ] Prepare Phase 2 planning

---

## Documentation Updates

### User-Facing
- [ ] Update landing page with new features
- [ ] Create pricing page FAQ
- [ ] Document subscription management
- [ ] Create billing support docs
- [ ] Add model selection guide

### Internal
- [ ] Update API documentation
- [ ] Document runbook for common issues
- [ ] Create troubleshooting guide
- [ ] Document cache invalidation process
- [ ] Update deployment procedures

---

## Known Issues & Mitigations

### Issue 1: Port 3000 in use locally
**Symptom**: Dev server starts on port 3001
**Mitigation**: Expected behavior, use 3001 or kill process on 3000
**Production Impact**: None

### Issue 2: Stale model cache
**Symptom**: New models not appearing
**Mitigation**: Cache auto-refreshes every hour, or force refresh:
```bash
curl https://yourdomain.com/api/models?refresh=true
```
**Production Impact**: Low - cache updates automatically

### Issue 3: Webhook retry storms
**Symptom**: Multiple webhook deliveries for same event
**Mitigation**: Webhook handler is idempotent (safe to process multiple times)
**Production Impact**: None - handled gracefully

---

## Emergency Contacts

### Critical Services

| Service | Dashboard | Status Page | Support |
|---------|-----------|-------------|---------|
| Vercel | https://vercel.com/dashboard | https://vercel-status.com | support@vercel.com |
| Stripe | https://dashboard.stripe.com | https://status.stripe.com | https://support.stripe.com |
| Vercel AI Gateway | https://vercel.com/ai-gateway | - | support@vercel.com |

### Escalation Path

1. **Developer on-call** (first responder)
2. **Tech Lead** (if issue > 30 minutes)
3. **CTO/VP Eng** (if customer-impacting > 1 hour)

---

## Success Criteria

### Deployment Successful If:

- [x] All health checks passing
- [x] Zero critical errors in first hour
- [x] Stripe payments processing
- [x] Model discovery working (135 models)
- [x] Cache performance optimal (< 500ms)
- [x] Authentication working
- [x] Rate limiting enforcing correctly

### Go Live Approval

**Approved By**: _______________ (CTO/Tech Lead)

**Date**: _____________

**Signature**: _______________

---

## Appendix

### Useful Commands

```bash
# Check production logs
vercel logs

# Force cache refresh
curl https://yourdomain.com/api/models?refresh=true

# Test webhook
stripe trigger checkout.session.completed --forward-to https://yourdomain.com/api/webhooks/stripe

# Check database
psql $POSTGRES_URL -c "SELECT COUNT(*) FROM \"User\";"

# Redis stats
redis-cli --url $REDIS_URL info stats

# Deployment status
vercel ls
```

### Configuration Files

- `.env.example` - Template for environment variables
- `next.config.js` - Next.js configuration
- `middleware.ts` - Authentication and rate limiting
- `lib/stripe/config.ts` - Stripe configuration
- `lib/ai/models-cache.ts` - Model caching logic

---

**Checklist Complete**: ___ / ___ items checked
**Deployment Date**: _______________
**Deployed By**: _______________
**Production URL**: _______________
