# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Usage Analytics & Rate Limiting System** - Critical MVP feature to prevent cost overruns
  - Database schema for tracking user usage, tier management, and rate limits (lib/db/schema.ts:175-298)
  - Usage tracking service with cost calculation and monthly aggregation (lib/usage/tracking.ts)
  - Rate limiting middleware with tier-based limits (lib/middleware/rate-limit.ts)
  - Integration into chat API for real-time tracking (app/(chat)/api/chat/route.ts:350-389)

  **Tier Limits:**
  - Free: 3 msgs/min, 30 msgs/day, 75 msgs/month
  - Pro: 10 msgs/min, 300 msgs/day, 750 msgs/month
  - Premium: 20 msgs/min, 1000 msgs/day, 3000 msgs/month
  - Enterprise: 100 msgs/min, 10k msgs/day, 100k msgs/month

  **Database Tables:**
  - `UserTier` - User subscription and tier management
  - `UserUsage` - Monthly usage aggregation per user
  - `UsageEvent` - Detailed request-level tracking
  - `RateLimit` - Rate limiting state tracking

### Changed
- Updated chat API to use new tier-based rate limiting instead of legacy entitlements system
- Removed old message count rate limiting in favor of comprehensive usage tracking

### Technical Details
- All numeric data stored as strings to handle large token counts without overflow
- Cost tracking with 6 decimal precision for accurate billing
- Cache hit tracking for future prompt caching implementation
- Tool usage tracking for analytics
- Latency tracking for performance monitoring

## Previous Releases
_No previous releases documented yet._
