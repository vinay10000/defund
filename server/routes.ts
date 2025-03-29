import type { Express } from "express";
import { createServer, type Server } from "http";
import { mongoDBStorage as storage } from "./storage-mongodb";
import { setupAuth } from "./auth";
import { setupUploads } from "./routes/upload";
import { insertStartupSchema, insertUpdateSchema, insertTransactionSchema, walletConnectSchema, upiPaymentSchema } from "@shared/schema";
import { z } from "zod";

// Create a modified schema that properly handles the endDate field
const startupValidationSchema = insertStartupSchema.extend({
  endDate: z.string()
    .transform((val) => val ? new Date(val) : undefined)
    .or(z.date())
    .optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Setup file upload routes
  setupUploads(app);

  // Startup routes
  app.get("/api/startups", async (req, res, next) => {
    try {
      const stage = req.query.stage as string | undefined;
      let startups;
      
      if (stage) {
        startups = await storage.getStartupsByStage(stage);
      } else {
        startups = await storage.getAllStartups();
      }
      
      res.json(startups);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/startups/:id", async (req, res, next) => {
    try {
      // Handle both numeric IDs and MongoDB ObjectIds
      const id = req.params.id;
      
      const startup = await storage.getStartup(id);
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      res.json(startup);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/startups", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      // Check if user is a startup
      if (req.user.role !== "startup") {
        return res.status(403).json({ message: "Only startup users can create a startup profile" });
      }
      
      // Check if user already has a startup
      const existingStartup = await storage.getStartupByUserId(req.user.id);
      if (existingStartup) {
        return res.status(400).json({ message: "You already have a startup profile" });
      }
      
      // Validate request body using our transforming schema
      const validatedData = startupValidationSchema.safeParse({
        ...req.body,
        userId: req.user.id
      });
      
      if (!validatedData.success) {
        return res.status(400).json({ message: "Invalid startup data", errors: validatedData.error.errors });
      }
      
      const startup = await storage.createStartup(validatedData.data);
      res.status(201).json(startup);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/startups/user/me", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const startup = await storage.getStartupByUserId(req.user.id);
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      res.json(startup);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/startups/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      // Get the startup
      const startupId = req.params.id;
      const startup = await storage.getStartup(startupId);
      
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      // Check if the user owns this startup
      const userStartup = await storage.getStartupByUserId(req.user.id);
      if (!userStartup || userStartup.id !== startup.id) {
        return res.status(403).json({ message: "You don't have permission to edit this startup" });
      }
      
      // Validate request body using our transforming schema
      const validatedData = startupValidationSchema.partial().safeParse({
        ...req.body
      });
      
      if (!validatedData.success) {
        return res.status(400).json({ message: "Invalid startup data", errors: validatedData.error.errors });
      }
      
      // Update the startup
      const updatedStartup = await storage.updateStartup(startupId, validatedData.data);
      if (!updatedStartup) {
        return res.status(500).json({ message: "Failed to update startup" });
      }
      
      res.json(updatedStartup);
    } catch (error) {
      next(error);
    }
  });

  // Document routes
  app.get("/api/startups/:startupId/documents", async (req, res, next) => {
    try {
      // Handle both numeric IDs and MongoDB ObjectIds
      const startupId = req.params.startupId;
      
      const documents = await storage.getDocumentsByStartupId(startupId);
      res.json(documents);
    } catch (error) {
      next(error);
    }
  });

  // Update routes
  app.post("/api/updates", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      // Check if user is a startup
      if (req.user.role !== "startup") {
        return res.status(403).json({ message: "Only startup users can post updates" });
      }
      
      // Get the user's startup
      const startup = await storage.getStartupByUserId(req.user.id);
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      // Validate request body
      const validatedData = insertUpdateSchema.safeParse({
        ...req.body,
        startupId: startup.id
      });
      
      if (!validatedData.success) {
        return res.status(400).json({ message: "Invalid update data", errors: validatedData.error.errors });
      }
      
      const update = await storage.createUpdate(validatedData.data);
      res.status(201).json(update);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/updates/startup/:startupId", async (req, res, next) => {
    try {
      // Handle both numeric IDs and MongoDB ObjectIds
      const startupId = req.params.startupId;
      
      const updates = await storage.getUpdatesByStartupId(startupId);
      res.json(updates);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/updates/investor/me", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      // Check if user is an investor
      if (req.user.role !== "investor") {
        return res.status(403).json({ message: "Only investors can access this endpoint" });
      }
      
      const updates = await storage.getUpdatesForInvestor(req.user.id);
      res.json(updates);
    } catch (error) {
      next(error);
    }
  });

  // Transaction routes
  app.post("/api/transactions", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      // Check if user is an investor
      if (req.user.role !== "investor") {
        return res.status(403).json({ message: "Only investors can create transactions" });
      }
      
      // Validate request body
      const validatedData = insertTransactionSchema.safeParse({
        ...req.body,
        investorId: req.user.id
      });
      
      if (!validatedData.success) {
        return res.status(400).json({ message: "Invalid transaction data", errors: validatedData.error.errors });
      }
      
      // Check if startup exists
      const startup = await storage.getStartup(validatedData.data.startupId);
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      const transaction = await storage.createTransaction(validatedData.data);
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/transactions/investor/me", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      // Check if user is an investor
      if (req.user.role !== "investor") {
        return res.status(403).json({ message: "Only investors can access this endpoint" });
      }
      
      const transactions = await storage.getTransactionsByInvestorId(req.user.id);
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/transactions/startup/me", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      // Check if user is a startup
      if (req.user.role !== "startup") {
        return res.status(403).json({ message: "Only startups can access this endpoint" });
      }
      
      // Get the user's startup
      const startup = await storage.getStartupByUserId(req.user.id);
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      
      const transactions = await storage.getTransactionsByStartupId(startup.id);
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });

  // Wallet connect endpoint
  app.post("/api/wallet-connect", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Validate request body
      const validatedData = walletConnectSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: "Invalid wallet data", errors: validatedData.error.errors });
      }
      
      // Check if wallet is already in use
      const existingUser = await storage.getUserByWalletAddress(validatedData.data.walletAddress);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ message: "Wallet address is already linked to another account" });
      }
      
      // Update user's wallet address
      const user = await storage.updateUserWallet(req.user.id, validatedData.data.walletAddress);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  // UPI connect endpoint
  app.post("/api/upi-connect", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Validate request body
      const validatedData = upiPaymentSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: "Invalid UPI data", errors: validatedData.error.errors });
      }
      
      // Update user's UPI ID
      const user = await storage.updateUserUpi(req.user.id, validatedData.data.upiId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Special admin routes (ensure these are properly secured in production)
  app.post('/api/admin/sync-wallets', async (req, res) => {
    try {
      await storage.syncStartupsWalletAddresses();
      res.status(200).json({ success: true, message: 'Wallet addresses synchronized successfully' });
    } catch (error) {
      console.error('Error syncing wallet addresses:', error);
      res.status(500).json({ success: false, message: 'Failed to sync wallet addresses', error: (error as Error).message });
    }
  });
  
  app.post('/api/admin/clear-startups', async (req, res) => {
    try {
      await storage.deleteAllStartups();
      res.status(200).json({ success: true, message: 'All startups deleted successfully' });
    } catch (error) {
      console.error('Error deleting all startups:', error);
      res.status(500).json({ success: false, message: 'Failed to delete startups', error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
