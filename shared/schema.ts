import { pgTable, text, serial, integer, timestamp, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// For MongoDB compatibility, using string or number for ID
const idType = z.union([z.string(), z.number()]);

// User table with role distinction
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["startup", "investor", "admin"] }).notNull(),
  walletAddress: text("wallet_address"),
  upiId: text("upi_id"),
  upiQrCode: text("upi_qr_code"),
  bio: text("bio"),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Startup profiles
export const startups = pgTable("startups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pitch: text("pitch").notNull(),  // We'll keep this as a required field in the schema but use description in the form
  stage: text("stage", { enum: ["pre-seed", "seed", "series-a", "series-b", "series-c"] }).notNull(),
  fundingGoal: doublePrecision("funding_goal").notNull(),
  fundsRaised: doublePrecision("funds_raised").default(0).notNull(),
  imageUrl: text("image_url"),
  documentUrl: text("document_url"),
  upiId: text("upi_id"),
  walletAddress: text("wallet_address"),
  endDate: timestamp("end_date"),
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

export const insertStartupSchema = createInsertSchema(startups)
  .pick({
    userId: true,
    name: true,
    description: true,
    pitch: true,
    stage: true,
    fundingGoal: true,
    imageUrl: true,
    documentUrl: true,
    upiId: true,
    walletAddress: true,
    endDate: true,
  })
  .extend({
    userId: idType,
  });

export const insertDocumentSchema = createInsertSchema(documents)
  .pick({
    startupId: true,
    name: true,
    type: true,
    path: true,
    sizeInMb: true,
  })
  .extend({
    startupId: idType,
  });

export const insertUpdateSchema = createInsertSchema(updates)
  .pick({
    startupId: true,
    title: true,
    content: true,
    visibility: true,
  })
  .extend({
    startupId: idType,
  });

export const insertTransactionSchema = createInsertSchema(transactions)
  .pick({
    investorId: true,
    startupId: true,
    amount: true,
    method: true,
    status: true,
    transactionReference: true,
  })
  .extend({
    investorId: idType,
    startupId: idType,
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
  fullName: z.string().min(1, "Full name is required"),
  transactionId: z.string().min(6, "Transaction ID must be at least 6 characters"),
  upiId: z.string().optional(),
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

// Base types from Drizzle
type BaseUser = typeof users.$inferSelect;
type BaseStartup = typeof startups.$inferSelect;
type BaseDocument = typeof documents.$inferSelect;
type BaseUpdate = typeof updates.$inferSelect;
type BaseTransaction = typeof transactions.$inferSelect;

// Modified types to work with both SQL and MongoDB
export interface User extends Omit<BaseUser, 'id'> {
  id: string | number;
}

export interface Startup extends Omit<BaseStartup, 'id' | 'userId'> {
  id: string | number;
  userId: string | number;
}

export interface Document extends Omit<BaseDocument, 'id' | 'startupId'> {
  id: string | number;
  startupId: string | number;
}

export interface Update extends Omit<BaseUpdate, 'id' | 'startupId'> {
  id: string | number;
  startupId: string | number;
}

export interface Transaction extends Omit<BaseTransaction, 'id' | 'investorId' | 'startupId'> {
  id: string | number;
  investorId: string | number;
  startupId: string | number;
}
