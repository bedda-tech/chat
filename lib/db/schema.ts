import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  json,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { AppUsage } from "../usage";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
  lastContext: jsonb("lastContext").$type<AppUsage | null>(),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId] }),
  })
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId] }),
  })
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
  })
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

// User tier and subscription management
export const userTier = pgTable("UserTier", {
  userId: uuid("userId")
    .primaryKey()
    .notNull()
    .references(() => user.id),
  tier: varchar("tier", { enum: ["free", "pro", "premium", "enterprise"] })
    .notNull()
    .default("free"),
  subscriptionId: varchar("subscriptionId", { length: 255 }),
  subscriptionStatus: varchar("subscriptionStatus", { length: 50 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type UserTier = InferSelectModel<typeof userTier>;

// User usage tracking (monthly aggregation)
export const userUsage = pgTable(
  "UserUsage",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    month: timestamp("month").notNull(), // First day of month

    // Message counts
    messageCount: varchar("messageCount", { length: 255 })
      .notNull()
      .default("0"),
    freeTierUsed: varchar("freeTierUsed", { length: 255 })
      .notNull()
      .default("0"),

    // Token counts (stored as strings to handle large numbers)
    inputTokens: varchar("inputTokens", { length: 255 }).notNull().default("0"),
    outputTokens: varchar("outputTokens", { length: 255 })
      .notNull()
      .default("0"),
    cachedTokens: varchar("cachedTokens", { length: 255 })
      .notNull()
      .default("0"),

    // Costs (in USD, stored as strings for precision)
    totalCost: varchar("totalCost", { length: 50 }).notNull().default("0"),
    cachedSavings: varchar("cachedSavings", { length: 50 })
      .notNull()
      .default("0"),

    // Timestamps
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.month] }),
  })
);

export type UserUsage = InferSelectModel<typeof userUsage>;

// Individual request tracking (detailed)
export const usageEvent = pgTable("UsageEvent", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),

  // Request metadata
  modelId: varchar("modelId", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  sessionId: uuid("sessionId"),

  // Tokens
  inputTokens: varchar("inputTokens", { length: 255 }).notNull(),
  outputTokens: varchar("outputTokens", { length: 255 }).notNull(),
  cachedTokens: varchar("cachedTokens", { length: 255 }).notNull().default("0"),
  totalTokens: varchar("totalTokens", { length: 255 }).notNull(),

  // Cost (stored as string for precision)
  cost: varchar("cost", { length: 50 }).notNull(),
  cachedSavings: varchar("cachedSavings", { length: 50 })
    .notNull()
    .default("0"),

  // Performance
  latencyMs: varchar("latencyMs", { length: 255 }), // Response time in milliseconds
  cacheHit: boolean("cacheHit").default(false),

  // Tools used
  toolsUsed: json("toolsUsed").$type<string[]>(),

  // Status
  success: boolean("success").default(true),
  errorType: varchar("errorType", { length: 100 }),

  // Timestamps
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type UsageEvent = InferSelectModel<typeof usageEvent>;

// Rate limiting tracking
export const rateLimit = pgTable(
  "RateLimit",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),

    // Rate limit type
    limitType: varchar("limitType", { length: 50 }).notNull(), // 'messages_per_minute', 'messages_per_day', etc.

    // Counts
    currentCount: varchar("currentCount", { length: 255 })
      .notNull()
      .default("0"),
    limitValue: varchar("limitValue", { length: 255 }).notNull(),

    // Time window
    windowStart: timestamp("windowStart").notNull(),
    windowEnd: timestamp("windowEnd").notNull(),

    // Reset tracking
    lastReset: timestamp("lastReset").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.userId, table.limitType, table.windowStart],
    }),
  })
);

export type RateLimit = InferSelectModel<typeof rateLimit>;
