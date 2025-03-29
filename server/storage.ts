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
  getUser(id: number | string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWallet(id: number | string, walletAddress: string): Promise<User | undefined>;
  updateUserUpi(id: number | string, upiId: string): Promise<User | undefined>;
  updateUserProfile(id: number | string, profilePath: string): Promise<User | undefined>;
  updateUserUpiQr(id: number | string, qrPath: string, upiId?: string | null): Promise<User | undefined>;

  // Startup operations
  updateStartupImage(id: number | string, imagePath: string): Promise<Startup | undefined>;
  getStartup(id: number | string): Promise<Startup | undefined>;
  getStartupByUserId(userId: number | string): Promise<Startup | undefined>;
  getAllStartups(): Promise<Startup[]>;
  getStartupsByStage(stage: string): Promise<Startup[]>;
  createStartup(startup: InsertStartup): Promise<Startup>;
  updateStartup(id: number | string, updateData: Partial<InsertStartup>): Promise<Startup | undefined>;
  updateStartupFunds(id: number | string, amount: number): Promise<Startup | undefined>;
  syncStartupsWalletAddresses(): Promise<void>;
  deleteAllStartups(): Promise<void>;

  // Document operations
  getDocumentsByStartupId(startupId: number | string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;

  // Update operations
  getUpdateById(id: number | string): Promise<Update | undefined>;
  getUpdatesByStartupId(startupId: number | string): Promise<Update[]>;
  getUpdatesForInvestor(investorId: number | string): Promise<Update[]>;
  createUpdate(update: InsertUpdate): Promise<Update>;

  // Transaction operations
  getTransactionById(id: number | string): Promise<Transaction | undefined>;
  getTransactionsByInvestorId(investorId: number | string): Promise<Transaction[]>;
  getTransactionsByStartupId(startupId: number | string): Promise<Transaction[]>;
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
  async getUser(id: number | string): Promise<User | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.users.get(numericId);
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

  async updateUserWallet(id: number | string, walletAddress: string): Promise<User | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    const user = this.users.get(numericId);
    if (!user) return undefined;

    const updatedUser = { ...user, walletAddress };
    this.users.set(numericId, updatedUser);
    
    // If this is a startup user, also update their startup's wallet address
    if (user.role === 'startup') {
      // Find the startup associated with this user
      const startupEntries = Array.from(this.startups.entries());
      for (const [startupId, startup] of startupEntries) {
        if (startup.userId === numericId) {
          const updatedStartup = { ...startup, walletAddress };
          this.startups.set(startupId, updatedStartup);
          break;
        }
      }
    }
    
    return updatedUser;
  }

  async updateUserUpi(id: number | string, upiId: string): Promise<User | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    const user = this.users.get(numericId);
    if (!user) return undefined;

    const updatedUser = { ...user, upiId };
    this.users.set(numericId, updatedUser);
    return updatedUser;
  }
  
  async updateUserProfile(id: number | string, profilePath: string): Promise<User | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    const user = this.users.get(numericId);
    if (!user) return undefined;

    const updatedUser = { ...user, profilePicture: profilePath };
    this.users.set(numericId, updatedUser);
    return updatedUser;
  }
  
  async updateUserUpiQr(id: number | string, qrPath: string, upiId?: string | null): Promise<User | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    const user = this.users.get(numericId);
    if (!user) return undefined;

    const updatedUser = { 
      ...user, 
      upiQrCode: qrPath,
      ...(upiId ? { upiId } : {})
    };
    
    this.users.set(numericId, updatedUser);
    return updatedUser;
  }
  
  async updateStartupImage(id: number | string, imagePath: string): Promise<Startup | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    const startup = this.startups.get(numericId);
    if (!startup) return undefined;

    const updatedStartup = { ...startup, image: imagePath };
    this.startups.set(numericId, updatedStartup);
    return updatedStartup;
  }

  // Startup methods
  async getStartup(id: number | string): Promise<Startup | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.startups.get(numericId);
  }

  async getStartupByUserId(userId: number | string): Promise<Startup | undefined> {
    const numericUserId = typeof userId === 'string' ? parseInt(userId) : userId;
    return Array.from(this.startups.values()).find(startup => {
      const startupUserId = typeof startup.userId === 'string' ? parseInt(startup.userId) : startup.userId;
      return startupUserId === numericUserId;
    });
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
    // Initialize with defaults, ensuring all properties are defined
    const startup: Startup = { 
      id, 
      userId: insertStartup.userId,
      name: insertStartup.name,
      description: insertStartup.description,
      pitch: insertStartup.pitch,
      stage: insertStartup.stage,
      fundingGoal: insertStartup.fundingGoal,
      fundsRaised: 0,
      imageUrl: insertStartup.imageUrl || null,
      documentUrl: insertStartup.documentUrl || null,
      upiId: null,
      walletAddress: null,
      endDate: insertStartup.endDate || null,
      createdAt: now
    };
    
    this.startups.set(id, startup);
    return startup;
  }

  async updateStartup(id: number | string, updateData: Partial<InsertStartup>): Promise<Startup | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    const startup = this.startups.get(numericId);
    if (!startup) return undefined;

    // Process endDate if it's a string
    let endDate = updateData.endDate;
    if (typeof endDate === 'string' && endDate) {
      endDate = new Date(endDate);
    }

    const updatedStartup = { 
      ...startup, 
      ...updateData,
      endDate: endDate || startup.endDate
    };
    
    this.startups.set(numericId, updatedStartup);
    return updatedStartup;
  }

  async updateStartupFunds(id: number | string, amount: number): Promise<Startup | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    const startup = this.startups.get(numericId);
    if (!startup) return undefined;

    const updatedStartup = { 
      ...startup, 
      fundsRaised: startup.fundsRaised + amount 
    };
    
    this.startups.set(numericId, updatedStartup);
    return updatedStartup;
  }

  // Document methods
  async getDocumentsByStartupId(startupId: number | string): Promise<Document[]> {
    const numericStartupId = typeof startupId === 'string' ? parseInt(startupId) : startupId;
    return Array.from(this.documents.values())
      .filter(document => {
        const docStartupId = typeof document.startupId === 'string' ? parseInt(document.startupId) : document.startupId;
        return docStartupId === numericStartupId;
      });
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentIdCounter++;
    const now = new Date();
    const document: Document = { 
      id,
      startupId: insertDocument.startupId,
      name: insertDocument.name,
      type: insertDocument.type,
      path: insertDocument.path,
      sizeInMb: insertDocument.sizeInMb,
      uploadedAt: now 
    };
    
    this.documents.set(id, document);
    return document;
  }

  // Update methods
  async getUpdateById(id: number | string): Promise<Update | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.updates.get(numericId);
  }

  async getUpdatesByStartupId(startupId: number | string): Promise<Update[]> {
    const numericStartupId = typeof startupId === 'string' ? parseInt(startupId) : startupId;
    return Array.from(this.updates.values())
      .filter(update => {
        const updateStartupId = typeof update.startupId === 'string' ? parseInt(update.startupId) : update.startupId;
        return updateStartupId === numericStartupId;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUpdatesForInvestor(investorId: number | string): Promise<Update[]> {
    const numericInvestorId = typeof investorId === 'string' ? parseInt(investorId) : investorId;
    // Get startups that the investor has invested in
    const investorTransactions = Array.from(this.transactions.values())
      .filter(transaction => {
        const txInvestorId = typeof transaction.investorId === 'string' ? 
          parseInt(transaction.investorId) : transaction.investorId;
        return txInvestorId === numericInvestorId;
      });
    
    // Convert all startupIds to numeric for consistent comparison
    const startupIds = investorTransactions.map(t => {
      const txStartupId = typeof t.startupId === 'string' ? parseInt(t.startupId) : t.startupId;
      return txStartupId;
    });
    
    // Get updates from those startups
    return Array.from(this.updates.values())
      .filter(update => {
        const updateStartupId = typeof update.startupId === 'string' ? 
          parseInt(update.startupId) : update.startupId;
        return startupIds.includes(updateStartupId);
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createUpdate(insertUpdate: InsertUpdate): Promise<Update> {
    const id = this.updateIdCounter++;
    const now = new Date();
    const update: Update = { 
      id,
      startupId: insertUpdate.startupId,
      title: insertUpdate.title,
      content: insertUpdate.content,
      visibility: insertUpdate.visibility,
      createdAt: now 
    };
    
    this.updates.set(id, update);
    return update;
  }

  // Transaction methods
  async getTransactionById(id: number | string): Promise<Transaction | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.transactions.get(numericId);
  }

  async getTransactionsByInvestorId(investorId: number | string): Promise<Transaction[]> {
    const numericInvestorId = typeof investorId === 'string' ? parseInt(investorId) : investorId;
    return Array.from(this.transactions.values())
      .filter(transaction => {
        const txInvestorId = typeof transaction.investorId === 'string' ? 
          parseInt(transaction.investorId) : transaction.investorId;
        return txInvestorId === numericInvestorId;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTransactionsByStartupId(startupId: number | string): Promise<Transaction[]> {
    const numericStartupId = typeof startupId === 'string' ? parseInt(startupId) : startupId;
    return Array.from(this.transactions.values())
      .filter(transaction => {
        const txStartupId = typeof transaction.startupId === 'string' ? 
          parseInt(transaction.startupId) : transaction.startupId;
        return txStartupId === numericStartupId;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const now = new Date();
    const transaction: Transaction = { 
      id,
      investorId: insertTransaction.investorId,
      startupId: insertTransaction.startupId,
      amount: insertTransaction.amount,
      method: insertTransaction.method,
      status: insertTransaction.status,
      transactionReference: insertTransaction.transactionReference || null,
      createdAt: now 
    };
    
    this.transactions.set(id, transaction);
    
    // Update startup funds
    await this.updateStartupFunds(insertTransaction.startupId, insertTransaction.amount);
    
    return transaction;
  }
  
  // Sync startup wallet addresses with user wallet addresses
  async syncStartupsWalletAddresses(): Promise<void> {
    // Find all startup users with wallet addresses
    const startupUsers = Array.from(this.users.values())
      .filter(user => user.role === 'startup' && user.walletAddress);
    
    for (const user of startupUsers) {
      // Find the startup associated with this user
      const startup = Array.from(this.startups.values())
        .find(startup => {
          const startupUserId = typeof startup.userId === 'string' ? 
            parseInt(startup.userId) : startup.userId;
          const userId = typeof user.id === 'string' ? 
            parseInt(user.id) : user.id;
          return startupUserId === userId;
        });
      
      if (startup && startup.walletAddress !== user.walletAddress) {
        // Update startup wallet address to match user's
        const startupId = typeof startup.id === 'string' ? 
          parseInt(startup.id) : startup.id;
        const updatedStartup = { ...startup, walletAddress: user.walletAddress };
        this.startups.set(startupId, updatedStartup);
        console.log(`Synced wallet address for startup ${startup.name}`);
      }
    }
    
    console.log('Completed wallet address synchronization in memory storage');
  }
  
  // Delete all startups (for testing/reset purposes only)
  async deleteAllStartups(): Promise<void> {
    this.startups.clear();
    this.startupIdCounter = 1;
    console.log('Deleted all startups from memory storage');
  }
}

// Create the storage instance
export const storage = new MemStorage();
