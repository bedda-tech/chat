-- User tier and subscription management
CREATE TABLE "UserTier" (
	"userId" uuid PRIMARY KEY NOT NULL REFERENCES "User"("id"),
	"tier" varchar DEFAULT 'free' NOT NULL,
	"subscriptionId" varchar(255),
	"subscriptionStatus" varchar(50),
	"currentPeriodStart" timestamp,
	"currentPeriodEnd" timestamp,
	"cancelAtPeriodEnd" boolean DEFAULT false,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

-- User usage tracking (monthly aggregation)
CREATE TABLE "UserUsage" (
	"userId" uuid NOT NULL REFERENCES "User"("id"),
	"month" timestamp NOT NULL,
	"messageCount" varchar(255) DEFAULT '0' NOT NULL,
	"freeTierUsed" varchar(255) DEFAULT '0' NOT NULL,
	"inputTokens" varchar(255) DEFAULT '0' NOT NULL,
	"outputTokens" varchar(255) DEFAULT '0' NOT NULL,
	"cachedTokens" varchar(255) DEFAULT '0' NOT NULL,
	"totalCost" varchar(50) DEFAULT '0' NOT NULL,
	"cachedSavings" varchar(50) DEFAULT '0' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserUsage_userId_month_pk" PRIMARY KEY("userId","month")
);

-- Individual request tracking (detailed)
CREATE TABLE "UsageEvent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL REFERENCES "User"("id"),
	"modelId" varchar(255) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"sessionId" uuid,
	"inputTokens" varchar(255) NOT NULL,
	"outputTokens" varchar(255) NOT NULL,
	"cachedTokens" varchar(255) DEFAULT '0' NOT NULL,
	"totalTokens" varchar(255) NOT NULL,
	"cost" varchar(50) NOT NULL,
	"cachedSavings" varchar(50) DEFAULT '0' NOT NULL,
	"latencyMs" varchar(255),
	"cacheHit" boolean DEFAULT false,
	"toolsUsed" json,
	"success" boolean DEFAULT true,
	"errorType" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL
);

-- Rate limiting tracking
CREATE TABLE "RateLimit" (
	"userId" uuid NOT NULL REFERENCES "User"("id"),
	"limitType" varchar(50) NOT NULL,
	"currentCount" varchar(255) DEFAULT '0' NOT NULL,
	"limitValue" varchar(255) NOT NULL,
	"windowStart" timestamp NOT NULL,
	"windowEnd" timestamp NOT NULL,
	"lastReset" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "RateLimit_userId_limitType_windowStart_pk" PRIMARY KEY("userId","limitType","windowStart")
);
