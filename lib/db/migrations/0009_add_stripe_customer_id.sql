-- Add stripeCustomerId column to UserTier table
ALTER TABLE "UserTier" ADD COLUMN "stripeCustomerId" VARCHAR(255);
