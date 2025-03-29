import { pgTable, text, serial, integer, timestamp, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table with role distinction
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["startup", "investor"] }).notNull(),
  walletAddress: text("wallet_address"),
  upiId: text("upi_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Startup profiles
export const startups = pgTable("startups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pitch: text("pitch").notNull(),
  stage: text("stage", { enum: ["pre-seed", "seed", "series-a", "series-b", "series-c"] }).notNull(),
  fundingGoal: doublePrecision("funding_goal").notNull(),
  fundsRaised: doublePrecision("funds_raised").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Documents for startups
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").notNull().references(() => startups.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  path: text("path").notNull(),
  sizeInMb: doublePrecision("size_in_mb").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Updates from startups to investors
export const updates = pgTable("updates", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").notNull().references(() => startups.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  visibility: text("visibility", { enum: ["all-investors", "major-investors"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transactions between investors and startups
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  investorId: integer("investor_id").notNull().references(() => users.id),
  startupId: integer("startup_id").notNull().references(() => startups.id),
  amount: doublePrecision("amount").notNull(),
  method: text("method", { enum: ["metamask", "upi"] }).notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] }).notNull(),
  transactionReference: text("transaction_reference"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
});

export const insertStartupSchema = createInsertSchema(startups).pick({
  userId: true,
  name: true,
  description: true,
  pitch: true,
  stage: true,
  fundingGoal: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  startupId: true,
  name: true,
  type: true,
  path: true,
  sizeInMb: true,
});

export const insertUpdateSchema = createInsertSchema(updates).pick({
  startupId: true,
  title: true,
  content: true,
  visibility: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  investorId: true,
  startupId: true,
  amount: true,
  method: true,
  status: true,
  transactionReference: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const walletConnectSchema = z.object({
  walletAddress: z.string().min(42).max(42),
});

export const upiPaymentSchema = z.object({
  amount: z.number().positive(),
  transactionId: z.string().min(1),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStartup = z.infer<typeof insertStartupSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertUpdate = z.infer<typeof insertUpdateSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type WalletConnect = z.infer<typeof walletConnectSchema>;
export type UpiPayment = z.infer<typeof upiPaymentSchema>;

export type User = typeof users.$inferSelect;
export type Startup = typeof startups.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Update = typeof updates.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
