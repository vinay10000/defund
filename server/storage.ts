import { 
  User, InsertUser, 
  Startup, InsertStartup, 
  Document, InsertDocument, 
  Update, InsertUpdate, 
  Transaction, InsertTransaction 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWallet(id: number, walletAddress: string): Promise<User | undefined>;
  updateUserUpi(id: number, upiId: string): Promise<User | undefined>;

  // Startup operations
  getStartup(id: number): Promise<Startup | undefined>;
  getStartupByUserId(userId: number): Promise<Startup | undefined>;
  getAllStartups(): Promise<Startup[]>;
  getStartupsByStage(stage: string): Promise<Startup[]>;
  createStartup(startup: InsertStartup): Promise<Startup>;
  updateStartupFunds(id: number, amount: number): Promise<Startup | undefined>;

  // Document operations
  getDocumentsByStartupId(startupId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;

  // Update operations
  getUpdateById(id: number): Promise<Update | undefined>;
  getUpdatesByStartupId(startupId: number): Promise<Update[]>;
  getUpdatesForInvestor(investorId: number): Promise<Update[]>;
  createUpdate(update: InsertUpdate): Promise<Update>;

  // Transaction operations
  getTransactionById(id: number): Promise<Transaction | undefined>;
  getTransactionsByInvestorId(investorId: number): Promise<Transaction[]>;
  getTransactionsByStartupId(startupId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private startups: Map<number, Startup>;
  private documents: Map<number, Document>;
  private updates: Map<number, Update>;
  private transactions: Map<number, Transaction>;
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private startupIdCounter: number;
  private documentIdCounter: number;
  private updateIdCounter: number;
  private transactionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.startups = new Map();
    this.documents = new Map();
    this.updates = new Map();
    this.transactions = new Map();
    
    this.userIdCounter = 1;
    this.startupIdCounter = 1;
    this.documentIdCounter = 1;
    this.updateIdCounter = 1;
    this.transactionIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.walletAddress === walletAddress);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      walletAddress: null, 
      upiId: null, 
      createdAt: now 
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUserWallet(id: number, walletAddress: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, walletAddress };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserUpi(id: number, upiId: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, upiId };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Startup methods
  async getStartup(id: number): Promise<Startup | undefined> {
    return this.startups.get(id);
  }

  async getStartupByUserId(userId: number): Promise<Startup | undefined> {
    return Array.from(this.startups.values()).find(startup => startup.userId === userId);
  }

  async getAllStartups(): Promise<Startup[]> {
    return Array.from(this.startups.values());
  }

  async getStartupsByStage(stage: string): Promise<Startup[]> {
    return Array.from(this.startups.values()).filter(startup => startup.stage === stage);
  }

  async createStartup(insertStartup: InsertStartup): Promise<Startup> {
    const id = this.startupIdCounter++;
    const now = new Date();
    const startup: Startup = { 
      ...insertStartup, 
      id, 
      fundsRaised: 0, 
      createdAt: now
    };
    
    this.startups.set(id, startup);
    return startup;
  }

  async updateStartupFunds(id: number, amount: number): Promise<Startup | undefined> {
    const startup = this.startups.get(id);
    if (!startup) return undefined;

    const updatedStartup = { 
      ...startup, 
      fundsRaised: startup.fundsRaised + amount 
    };
    
    this.startups.set(id, updatedStartup);
    return updatedStartup;
  }

  // Document methods
  async getDocumentsByStartupId(startupId: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(document => document.startupId === startupId);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentIdCounter++;
    const now = new Date();
    const document: Document = { 
      ...insertDocument, 
      id, 
      uploadedAt: now 
    };
    
    this.documents.set(id, document);
    return document;
  }

  // Update methods
  async getUpdateById(id: number): Promise<Update | undefined> {
    return this.updates.get(id);
  }

  async getUpdatesByStartupId(startupId: number): Promise<Update[]> {
    return Array.from(this.updates.values())
      .filter(update => update.startupId === startupId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUpdatesForInvestor(investorId: number): Promise<Update[]> {
    // Get startups that the investor has invested in
    const investorTransactions = Array.from(this.transactions.values())
      .filter(transaction => transaction.investorId === investorId);
    
    const startupIds = [...new Set(investorTransactions.map(t => t.startupId))];
    
    // Get updates from those startups
    return Array.from(this.updates.values())
      .filter(update => startupIds.includes(update.startupId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createUpdate(insertUpdate: InsertUpdate): Promise<Update> {
    const id = this.updateIdCounter++;
    const now = new Date();
    const update: Update = { 
      ...insertUpdate, 
      id, 
      createdAt: now 
    };
    
    this.updates.set(id, update);
    return update;
  }

  // Transaction methods
  async getTransactionById(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByInvestorId(investorId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.investorId === investorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTransactionsByStartupId(startupId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.startupId === startupId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const now = new Date();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      createdAt: now 
    };
    
    this.transactions.set(id, transaction);
    
    // Update startup funds
    await this.updateStartupFunds(insertTransaction.startupId, insertTransaction.amount);
    
    return transaction;
  }
}

// Create the storage instance
export const storage = new MemStorage();
