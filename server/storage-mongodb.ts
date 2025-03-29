import { 
  User as UserType, InsertUser, 
  Startup as StartupType, InsertStartup, 
  Document as DocumentType, InsertDocument, 
  Update as UpdateType, InsertUpdate, 
  Transaction as TransactionType, InsertTransaction 
} from "@shared/schema";
import session from "express-session";
import { User, Startup, Document, Update, Transaction } from "./models/mongodb";
import createMemoryStore from "memorystore";
import { IStorage } from "./storage";
import mongoose from "mongoose";

// Define SessionStore type
declare module "express-session" {
  interface SessionStore {
    // Add required methods
    get: (sid: string, callback: (err: any, session?: session.SessionData | null) => void) => void;
    set: (sid: string, session: session.SessionData, callback?: (err?: any) => void) => void;
    destroy: (sid: string, callback?: (err?: any) => void) => void;
  }
}

const MemoryStore = createMemoryStore(session);

// Convert MongoDB document to the expected type format
function toUser(doc: any): UserType | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id.toString(),
    username: doc.username,
    email: doc.email,
    password: doc.password,
    role: doc.role,
    walletAddress: doc.walletAddress,
    upiId: doc.upiId,
    createdAt: doc.createdAt
  };
}

function toStartup(doc: any): StartupType | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    description: doc.description,
    pitch: doc.pitch,
    stage: doc.stage,
    fundingGoal: doc.fundingGoal,
    fundsRaised: doc.fundsRaised,
    imageUrl: doc.imageUrl,
    documentUrl: doc.documentUrl,
    upiId: doc.upiId,
    walletAddress: doc.walletAddress,
    endDate: doc.endDate,
    createdAt: doc.createdAt
  };
}

function toDocument(doc: any): DocumentType | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id.toString(),
    startupId: doc.startupId.toString(),
    name: doc.name,
    type: doc.type,
    path: doc.path,
    sizeInMb: doc.sizeInMb,
    uploadedAt: doc.uploadedAt
  };
}

function toUpdate(doc: any): UpdateType | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id.toString(),
    startupId: doc.startupId.toString(),
    title: doc.title,
    content: doc.content,
    visibility: doc.visibility,
    createdAt: doc.createdAt
  };
}

function toTransaction(doc: any): TransactionType | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id.toString(),
    investorId: doc.investorId.toString(),
    startupId: doc.startupId.toString(),
    amount: doc.amount,
    method: doc.method,
    status: doc.status,
    transactionReference: doc.transactionReference || null,
    createdAt: doc.createdAt
  };
}

export class MongoDBStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }

  // User methods
  async getUser(id: number | string): Promise<UserType | undefined> {
    try {
      const user = await User.findById(id);
      return toUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ email });
      return toUser(user);
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ username });
      return toUser(user);
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByWalletAddress(walletAddress: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ walletAddress });
      return toUser(user);
    } catch (error) {
      console.error('Error getting user by wallet address:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<UserType> {
    try {
      const newUser = new User(insertUser);
      const savedUser = await newUser.save();
      const user = toUser(savedUser);
      if (!user) {
        throw new Error('Failed to create user');
      }
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUserWallet(id: number | string, walletAddress: string): Promise<UserType | undefined> {
    try {
      // Update user wallet
      const user = await User.findByIdAndUpdate(
        id,
        { walletAddress },
        { new: true }
      );
      
      if (!user) return undefined;
      
      // If user is a startup founder, also update the startup wallet
      if (user.role === 'startup') {
        // Find the startup associated with this user
        const startup = await Startup.findOne({ userId: user._id });
        if (startup) {
          // Update the startup wallet address
          await Startup.findByIdAndUpdate(
            startup._id,
            { walletAddress },
            { new: true }
          );
        }
      }
      
      return toUser(user);
    } catch (error) {
      console.error('Error updating user wallet:', error);
      return undefined;
    }
  }

  async updateUserProfile(id: number | string, profilePath: string): Promise<UserType | undefined> {
    try {
      // Update user profile picture
      const user = await User.findByIdAndUpdate(
        id,
        { profilePicture: profilePath },
        { new: true }
      );
      
      if (!user) return undefined;
      
      return toUser(user);
    } catch (error) {
      console.error('Error updating user profile picture:', error);
      return undefined;
    }
  }

  async updateStartupImage(id: number | string, imagePath: string): Promise<StartupType | undefined> {
    try {
      // Update startup image
      const startup = await Startup.findByIdAndUpdate(
        id,
        { image: imagePath },
        { new: true }
      );
      
      if (!startup) return undefined;
      
      return toStartup(startup);
    } catch (error) {
      console.error('Error updating startup image:', error);
      return undefined;
    }
  }

  async updateUserUpiQr(id: number | string, qrPath: string, upiId?: string | null): Promise<UserType | undefined> {
    try {
      // Update user UPI QR code and optionally the UPI ID
      const updateData: any = { upiQrCode: qrPath };
      if (upiId) {
        updateData.upiId = upiId;
      }
      
      const user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
      
      if (!user) return undefined;
      
      return toUser(user);
    } catch (error) {
      console.error('Error updating user UPI QR code:', error);
      return undefined;
    }
  }

  async updateUserUpi(id: number | string, upiId: string): Promise<UserType | undefined> {
    try {
      // Update user UPI
      const user = await User.findByIdAndUpdate(
        id,
        { upiId },
        { new: true }
      );
      
      if (!user) return undefined;
      
      // If user is a startup founder, also update the startup UPI
      if (user.role === 'startup') {
        // Find the startup associated with this user
        const startup = await Startup.findOne({ userId: user._id });
        if (startup) {
          // Update the startup UPI ID
          await Startup.findByIdAndUpdate(
            startup._id,
            { upiId },
            { new: true }
          );
        }
      }
      
      return toUser(user);
    } catch (error) {
      console.error('Error updating user UPI:', error);
      return undefined;
    }
  }

  // Startup methods
  async getStartup(id: number | string): Promise<StartupType | undefined> {
    try {
      const startup = await Startup.findById(id);
      return toStartup(startup);
    } catch (error) {
      console.error('Error getting startup:', error);
      return undefined;
    }
  }

  async getStartupByUserId(userId: number | string): Promise<StartupType | undefined> {
    try {
      const startup = await Startup.findOne({ userId });
      return toStartup(startup);
    } catch (error) {
      console.error('Error getting startup by user ID:', error);
      return undefined;
    }
  }

  async getAllStartups(): Promise<StartupType[]> {
    try {
      const startups = await Startup.find();
      const result: StartupType[] = [];
      
      startups.forEach(startup => {
        const startupData = toStartup(startup);
        if (startupData) {
          result.push(startupData);
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error getting all startups:', error);
      return [];
    }
  }

  async getStartupsByStage(stage: string): Promise<StartupType[]> {
    try {
      const startups = await Startup.find({ stage });
      const result: StartupType[] = [];
      
      startups.forEach(startup => {
        const startupData = toStartup(startup);
        if (startupData) {
          result.push(startupData);
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error getting startups by stage:', error);
      return [];
    }
  }

  async createStartup(insertStartup: InsertStartup): Promise<StartupType> {
    try {
      const newStartup = new Startup(insertStartup);
      const savedStartup = await newStartup.save();
      const startup = toStartup(savedStartup);
      if (!startup) {
        throw new Error('Failed to create startup');
      }
      return startup;
    } catch (error) {
      console.error('Error creating startup:', error);
      throw error;
    }
  }

  async updateStartup(id: number | string, updateData: Partial<InsertStartup>): Promise<StartupType | undefined> {
    try {
      // Update startup data
      const startup = await Startup.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
      
      if (!startup) return undefined;
      
      return toStartup(startup);
    } catch (error) {
      console.error('Error updating startup:', error);
      return undefined;
    }
  }

  async updateStartupFunds(id: number | string, amount: number): Promise<StartupType | undefined> {
    try {
      const startup = await Startup.findById(id);
      if (!startup) return undefined;
      
      startup.fundsRaised += amount;
      const updatedStartup = await startup.save();
      
      return toStartup(updatedStartup);
    } catch (error) {
      console.error('Error updating startup funds:', error);
      return undefined;
    }
  }

  // Document methods
  async getDocumentsByStartupId(startupId: number | string): Promise<DocumentType[]> {
    try {
      const documents = await Document.find({ startupId });
      const result: DocumentType[] = [];
      
      documents.forEach(doc => {
        const docData = toDocument(doc);
        if (docData) {
          result.push(docData);
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error getting documents by startup ID:', error);
      return [];
    }
  }

  async createDocument(insertDocument: InsertDocument): Promise<DocumentType> {
    try {
      const newDocument = new Document(insertDocument);
      const savedDocument = await newDocument.save();
      const document = toDocument(savedDocument);
      if (!document) {
        throw new Error('Failed to create document');
      }
      return document;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  // Update methods
  async getUpdateById(id: number | string): Promise<UpdateType | undefined> {
    try {
      const update = await Update.findById(id);
      return toUpdate(update);
    } catch (error) {
      console.error('Error getting update by ID:', error);
      return undefined;
    }
  }

  async getUpdatesByStartupId(startupId: number | string): Promise<UpdateType[]> {
    try {
      const updates = await Update.find({ startupId }).sort({ createdAt: -1 });
      const result: UpdateType[] = [];
      
      updates.forEach(update => {
        const updateData = toUpdate(update);
        if (updateData) {
          result.push(updateData);
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error getting updates by startup ID:', error);
      return [];
    }
  }

  async getUpdatesForInvestor(investorId: number | string): Promise<UpdateType[]> {
    try {
      // Get startups that the investor has invested in
      const transactions = await Transaction.find({ investorId });
      const startupIdsArray: string[] = [];
      
      transactions.forEach(t => {
        const id = t.startupId.toString();
        if (!startupIdsArray.includes(id)) {
          startupIdsArray.push(id);
        }
      });
      
      // Get updates from those startups
      const updates = await Update.find({
        startupId: { $in: startupIdsArray }
      }).sort({ createdAt: -1 });
      
      const result: UpdateType[] = [];
      
      updates.forEach(update => {
        const updateData = toUpdate(update);
        if (updateData) {
          result.push(updateData);
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error getting updates for investor:', error);
      return [];
    }
  }

  async createUpdate(insertUpdate: InsertUpdate): Promise<UpdateType> {
    try {
      const newUpdate = new Update(insertUpdate);
      const savedUpdate = await newUpdate.save();
      const update = toUpdate(savedUpdate);
      if (!update) {
        throw new Error('Failed to create update');
      }
      return update;
    } catch (error) {
      console.error('Error creating update:', error);
      throw error;
    }
  }

  // Transaction methods
  async getTransactionById(id: number | string): Promise<TransactionType | undefined> {
    try {
      const transaction = await Transaction.findById(id);
      return toTransaction(transaction);
    } catch (error) {
      console.error('Error getting transaction by ID:', error);
      return undefined;
    }
  }

  async getTransactionsByInvestorId(investorId: number | string): Promise<TransactionType[]> {
    try {
      const transactions = await Transaction.find({ investorId }).sort({ createdAt: -1 });
      const result: TransactionType[] = [];
      
      transactions.forEach(transaction => {
        const transactionData = toTransaction(transaction);
        if (transactionData) {
          result.push(transactionData);
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error getting transactions by investor ID:', error);
      return [];
    }
  }

  async getTransactionsByStartupId(startupId: number | string): Promise<TransactionType[]> {
    try {
      const transactions = await Transaction.find({ startupId }).sort({ createdAt: -1 });
      const result: TransactionType[] = [];
      
      transactions.forEach(transaction => {
        const transactionData = toTransaction(transaction);
        if (transactionData) {
          result.push(transactionData);
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error getting transactions by startup ID:', error);
      return [];
    }
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<TransactionType> {
    try {
      // Start a session to use transactions
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        // Create the transaction
        const newTransaction = new Transaction(insertTransaction);
        const savedTransaction = await newTransaction.save({ session });
        
        // Update startup funds
        await this.updateStartupFunds(insertTransaction.startupId, insertTransaction.amount);
        
        // Commit the transaction
        await session.commitTransaction();
        
        const transaction = toTransaction(savedTransaction);
        if (!transaction) {
          throw new Error('Failed to create transaction');
        }
        return transaction;
      } catch (error) {
        // Abort the transaction
        await session.abortTransaction();
        throw error;
      } finally {
        // End the session
        session.endSession();
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }
}

// Export the MongoDB storage instance
export const mongoDBStorage = new MongoDBStorage();