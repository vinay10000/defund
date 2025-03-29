import type { Express } from "express";
import { createServer, type Server } from "http";
import { mongoDBStorage as storage } from "./storage-mongodb";
import { setupAuth } from "./auth";
import { setupUploads } from "./routes/upload";
import { insertStartupSchema, insertUpdateSchema, insertTransactionSchema } from "@shared/schema";
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

  const httpServer = createServer(app);
  return httpServer;
}
