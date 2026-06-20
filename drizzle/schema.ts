import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * DOC News Articles table
 * Stores aggregated news articles about Kentucky Department of Corrections incidents
 */
export const docNewsArticles = mysqlTable("doc_news_articles", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  source: varchar("source", { length: 255 }).notNull(), // e.g., "KDOC Press Release", "News Source Name"
  url: varchar("url", { length: 2048 }).notNull().unique(), // Unique to prevent duplicates
  publishedAt: timestamp("publishedAt").notNull(),
  category: mysqlEnum("category", [
    "incident",
    "policy",
    "staffing",
    "reform",
    "memorial",
    "legal",
    "other",
  ]).default("other").notNull(),
  facilityTags: text("facilityTags"), // JSON array of facility names/codes
  summary: text("summary"), // Brief summary or excerpt
  status: mysqlEnum("status", ["new", "reviewed", "archived"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"), // Foreign key to users table
});

export type DocNewsArticle = typeof docNewsArticles.$inferSelect;
export type InsertDocNewsArticle = typeof docNewsArticles.$inferInsert;

/**
 * Aggregation Run Logs table
 * Tracks each news aggregation job execution for monitoring and debugging
 */
export const aggregationRunLogs = mysqlTable("aggregation_run_logs", {
  id: int("id").autoincrement().primaryKey(),
  runStartedAt: timestamp("runStartedAt").defaultNow().notNull(),
  runCompletedAt: timestamp("runCompletedAt"),
  articlesFound: int("articlesFound").default(0).notNull(),
  articlesUpserted: int("articlesUpserted").default(0).notNull(),
  status: mysqlEnum("status", ["running", "success", "failed"]).default("running").notNull(),
  errorMessage: text("errorMessage"),
  sourcesPolled: text("sourcesPolled"), // JSON array of sources checked
});

export type AggregationRunLog = typeof aggregationRunLogs.$inferSelect;
export type InsertAggregationRunLog = typeof aggregationRunLogs.$inferInsert;