import type { BlockchainTransaction, TransactionResponse } from '../types/index.js';
import { PolygonService } from './polygonService.js';
import { PaymentGatewayService } from './paymentGatewayService.js';
import { UPIPaymentService } from './upiPaymentService.js';
import { getDatabase } from '../config/database.js';
import { TransactionModel, type TransactionDocument } from '../models/Transaction.js';

export class BlockchainService {
  private transactions: BlockchainTransaction[] = [];
  private blockCounter = 156;
  private polygonService: PolygonService;
  private paymentGatewayService: PaymentGatewayService;
  private upiPaymentService: UPIPaymentService;
  private transactionModel: TransactionModel | null = null;
  private isRealBlockchainConnected: boolean = false;
  private walletBalance: string = '0';
  private processedTransactionHashes: Set<string> = new Set(); // Track hashes we've processed via UPI payments

  constructor() {
    this.polygonService = new PolygonService();
    this.paymentGatewayService = new PaymentGatewayService();
    this.upiPaymentService = new UPIPaymentService(this.polygonService);
    
    // Initialize MongoDB model if database is connected
    this.initializeMongoDB();
    
    
    // Try to connect to real blockchain (async - won't block)
    this.connectToBlockchain().catch((error) => {
      console.error('[Blockchain] Error during initialization:', error);
    });
    
    // Initialize with sample transactions for immediate display
    // DISABLED: Uncomment below to enable sample transactions for demo purposes
    // this.initializeTransactions();
  }

  /**
   * Initialize MongoDB connection (called after database connection is ready)
   */
  private initializeMongoDB(): void {
    const db = getDatabase();
    if (db) {
      this.transactionModel = new TransactionModel(db);
      console.log('[Blockchain] ✅ MongoDB integration enabled');
      // Migrate existing transactions to MongoDB
      this.migrateTransactionsToMongoDB().catch((error) => {
        console.error('[Blockchain] ⚠️ Error during migration:', error.message);
      });
    } else {
      console.log('[Blockchain] ⚠️ MongoDB not connected yet, will retry...');
      let retryCount = 0;
      const maxRetries = 15; // 30 seconds total (15 * 2 seconds)
      
      // Retry every 2 seconds until connected
      const retryInterval = setInterval(() => {
        retryCount++;
        const db = getDatabase();
        if (db) {
          this.transactionModel = new TransactionModel(db);
          console.log('[Blockchain] ✅ MongoDB integration enabled (delayed - after retry)');
          // Migrate existing transactions once connected
          this.migrateTransactionsToMongoDB().catch((error) => {
            console.error('[Blockchain] ⚠️ Error during migration:', error.message);
          });
          clearInterval(retryInterval);
        } else if (retryCount >= maxRetries) {
          clearInterval(retryInterval);
          console.log('[Blockchain] ⚠️ MongoDB connection timeout after 30 seconds');
          console.log('[Blockchain] 💡 To fix: Ensure MongoDB is running or provide MongoDB Atlas connection string');
          console.log('[Blockchain] 💡 Transactions will be saved in memory but lost on server restart');
        }
      }, 2000);
    }
  }

  /**
   * Public method to force re-initialize MongoDB connection
   * Useful when MongoDB connects after BlockchainService is instantiated
   */
  public reinitializeMongoDB(): void {
    console.log('[Blockchain] 🔄 Re-initializing MongoDB connection...');
    this.transactionModel = null; // Reset
    this.initializeMongoDB();
  }

  /**
   * Ensure MongoDB model is available (call before saving)
   */
  private ensureMongoDBModel(): void {
    if (!this.transactionModel) {
      const db = getDatabase();
      if (db) {
        this.transactionModel = new TransactionModel(db);
        console.log('[Blockchain] ✅ MongoDB model initialized on-demand');
      } else {
        console.warn('[Blockchain] ⚠️ Cannot initialize MongoDB model - database not connected');
      }
    } else {
      // Double-check that the database is still connected
      const db = getDatabase();
      if (!db) {
        console.warn('[Blockchain] ⚠️ Database connection lost - resetting transaction model');
        this.transactionModel = null;
      }
    }
  }

  /**
   * Migrate existing in-memory transactions to MongoDB
   * This ensures all transactions are persisted
   * Public method to allow external triggering after MongoDB connection
   */
  async migrateTransactionsToMongoDB(): Promise<void> {
    this.ensureMongoDBModel();
    
    if (!this.transactionModel) {
      console.log('[Blockchain] ⚠️ MongoDB model not ready yet, skipping migration');
      return;
    }
    
    if (this.transactions.length === 0) {
      console.log('[Blockchain] ℹ️ No transactions to migrate');
      return;
    }

    try {
      console.log(`[Blockchain] 🔄 Migrating ${this.transactions.length} transactions to MongoDB...`);
      
      let migratedCount = 0;
      let skippedCount = 0;

      for (const tx of this.transactions) {
        try {
          // Check if transaction already exists (by hash)
          const existing = await this.transactionModel.findByHash(tx.hash);
          
          if (!existing) {
            // Insert transaction
            await this.transactionModel.insert({
              ...tx,
              upiReference: undefined,
              paymentMethod: undefined,
              amountInINR: undefined,
              donorPhone: undefined,
              description: undefined,
            });
            migratedCount++;
          } else {
            skippedCount++;
          }
        } catch (error: any) {
          // Skip duplicates or errors for individual transactions
          if (error.message?.includes('duplicate') || error.message?.includes('E11000')) {
            skippedCount++;
          } else {
            console.error(`[Blockchain] ⚠️ Error migrating transaction ${tx.id}:`, error.message);
          }
        }
      }

      console.log(`[Blockchain] ✅ Migration complete: ${migratedCount} migrated, ${skippedCount} already exist`);
      
      // Reload from MongoDB to ensure consistency
      const dbTransactions = await this.transactionModel.findAll(100);
      this.transactions = dbTransactions.map(tx => ({
        id: tx.id,
        donor: tx.donor,
        region: tx.region,
        amount: tx.amount,
        timestamp: tx.timestamp,
        hash: tx.hash,
        status: tx.status,
        blockNumber: tx.blockNumber,
      }));
      
      console.log(`[Blockchain] ✅ Loaded ${this.transactions.length} transactions from MongoDB after migration`);
    } catch (error: any) {
      console.error('[Blockchain] ❌ Error migrating transactions to MongoDB:', error.message);
    }
  }

  /**
   * Connect to Polygon Amoy blockchain
   */
  private async connectToBlockchain(): Promise<void> {
    try {
      const connected = await this.polygonService.connectWallet();
      if (connected) {
        this.isRealBlockchainConnected = true;
        this.walletBalance = await this.polygonService.getBalance();
        console.log('[Blockchain] ✅ Connected to Polygon Amoy - Balance:', this.walletBalance, 'MATIC');
        
        // Start monitoring for new transactions
        this.polygonService.startMonitoring((newTransactions) => {
          // Filter out transactions we've already processed via UPI payment flow
          const unprocessedTransactions = newTransactions.filter(tx => {
            if (this.processedTransactionHashes.has(tx.hash.toLowerCase())) {
              console.log(`[Blockchain] ℹ️ Skipping transaction ${tx.hash} - already processed via UPI payment`);
              return false; // Skip this transaction - we already have it with UPI details
            }
            return true; // Keep this transaction
          });
          
          if (unprocessedTransactions.length > 0) {
            // Add new transactions to our list (only unprocessed ones)
            this.transactions = [...unprocessedTransactions, ...this.transactions];
            console.log(`[Blockchain] ✅ New transactions detected: ${unprocessedTransactions.length} (${newTransactions.length - unprocessedTransactions.length} skipped as duplicates)`);
          }
        });
        
        // Fetch existing transactions
        this.loadRealTransactions();
      } else {
        console.log('[Blockchain] ⚠️ Using simulated transactions - Add POLYGON_PRIVATE_KEY to .env for real blockchain');
      }
    } catch (error: any) {
      console.error('[Blockchain] ❌ Error connecting to blockchain:', error.message);
      this.isRealBlockchainConnected = false;
    }
  }

  /**
   * Load real transactions from blockchain
   */
  private async loadRealTransactions(): Promise<void> {
    try {
      const realTransactions = await this.polygonService.fetchTransactions(50);
      if (realTransactions.length > 0) {
        this.transactions = realTransactions;
        this.blockCounter = realTransactions[0]?.blockNumber || 156;
        console.log(`[Blockchain] ✅ Loaded ${realTransactions.length} real transactions`);
      }
    } catch (error: any) {
      console.error('[Blockchain] Error loading transactions:', error.message);
    }
  }

  /**
   * Get all blockchain transactions
   */
  async getTransactions(): Promise<TransactionResponse> {
    // Ensure MongoDB model is available - try multiple times if needed
    this.ensureMongoDBModel();
    
    // If MongoDB is available, read from database
    if (this.transactionModel) {
      try {
        console.log('[Blockchain] 📖 Reading transactions from MongoDB...');
        const dbTransactions = await this.transactionModel.findAll(50);
        console.log(`[Blockchain] ✅ Found ${dbTransactions.length} transactions in MongoDB`);
        
        // Calculate totals from MongoDB (always use DB totals, not cache)
        const totalTransactions = await this.transactionModel.getTotalCount();
        const totalAidValue = await this.transactionModel.getTotalAid();
        const totalAid = this.formatAidAmount(totalAidValue);
        
        console.log(`[Blockchain] 📊 MongoDB totals: ${totalTransactions} transactions, ${totalAid} aid`);
        
        // Convert to BlockchainTransaction format
        const dbTxList: BlockchainTransaction[] = dbTransactions.map(tx => ({
          id: tx.id,
          donor: tx.donor,
          region: tx.region,
          amount: tx.amount,
          timestamp: tx.timestamp,
          hash: tx.hash,
          status: tx.status,
          blockNumber: tx.blockNumber,
        }));

        // Merge with in-memory cache (latest transactions might not be in DB yet)
        // Create a map to avoid duplicates
        const txMap = new Map<string, BlockchainTransaction>();
        
        // Add MongoDB transactions first (older ones)
        for (const tx of dbTxList) {
          txMap.set(tx.id, tx);
        }
        
        // Add in-memory transactions (newer ones, will overwrite if duplicate)
        const inMemoryCount = this.transactions.length;
        for (const tx of this.transactions) {
          txMap.set(tx.id, tx);
        }
        
        // Convert back to array and sort by timestamp (newest first)
        const transactions = Array.from(txMap.values()).sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ).slice(0, 50); // Limit to 50 most recent

        // Update in-memory cache with merged list
        this.transactions = transactions;
        
        // Update block counter from latest transaction
        if (dbTransactions.length > 0) {
          this.blockCounter = dbTransactions[0]?.blockNumber || this.blockCounter;
        }

        console.log(`[Blockchain] ✅ Returning ${transactions.length} transactions (${dbTxList.length} from DB + ${inMemoryCount} from cache)`);
        console.log(`[Blockchain] 💰 Total Aid: ${totalAid} (from MongoDB)`);

        return {
          transactions,
          totalTransactions, // Use MongoDB count, not cache length
          totalAid, // Use MongoDB total, not calculated from cache
          smartContracts: this.blockCounter,
          avgProcessingTime: '2.3s',
          walletAddress: this.polygonService.getWalletAddress(),
          walletBalance: this.walletBalance,
          isRealBlockchain: this.isRealBlockchainConnected,
        };
      } catch (error: any) {
        console.error('[Blockchain] ❌ Error reading from MongoDB:', error.message);
        console.error('[Blockchain] Error stack:', error.stack);
        console.error('[Blockchain] ⚠️ Falling back to in-memory cache...');
        // Continue to fallback below
      }
    } else {
      console.log('[Blockchain] ⚠️ MongoDB model not available - attempting to initialize...');
      // Try one more time to initialize
      this.ensureMongoDBModel();
      // Check if model is available after initialization
      if (this.transactionModel) {
        console.log('[Blockchain] ✅ MongoDB model initialized, attempting to load transactions...');
        try {
          // Use type assertion since we've checked it's not null
          const model = this.transactionModel as TransactionModel;
          // Try loading from MongoDB now
          const dbTransactions = await model.findAll(50);
          const totalTransactions = await model.getTotalCount();
          const totalAidValue = await model.getTotalAid();
          const totalAid = this.formatAidAmount(totalAidValue);
          
          const dbTxList: BlockchainTransaction[] = dbTransactions.map((tx) => ({
            id: tx.id,
            donor: tx.donor,
            region: tx.region,
            amount: tx.amount,
            timestamp: tx.timestamp,
            hash: tx.hash,
            status: tx.status,
            blockNumber: tx.blockNumber,
          }));
          
          // Merge with in-memory cache
          const txMap = new Map<string, BlockchainTransaction>();
          for (const tx of dbTxList) {
            txMap.set(tx.id, tx);
          }
          for (const tx of this.transactions) {
            txMap.set(tx.id, tx);
          }
          
          const transactions = Array.from(txMap.values()).sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ).slice(0, 50);
          
          this.transactions = transactions;
          if (dbTransactions.length > 0) {
            this.blockCounter = dbTransactions[0]?.blockNumber || this.blockCounter;
          }
          
          console.log(`[Blockchain] ✅ Loaded ${transactions.length} transactions from MongoDB`);
          
          return {
            transactions,
            totalTransactions,
            totalAid,
            smartContracts: this.blockCounter,
            avgProcessingTime: '2.3s',
            walletAddress: this.polygonService.getWalletAddress(),
            walletBalance: this.walletBalance,
            isRealBlockchain: this.isRealBlockchainConnected,
          };
        } catch (error: any) {
          console.error('[Blockchain] ❌ Error loading transactions after initialization:', error.message);
        }
      }
      console.log('[Blockchain] ⚠️ MongoDB not available, using in-memory transactions');
    }

    // Fallback: If using real blockchain, refresh transactions periodically
    if (this.isRealBlockchainConnected) {
      await this.loadRealTransactions();
      this.walletBalance = await this.polygonService.getBalance();
    }

    // Calculate total aid from transactions
    const totalAidValue = this.calculateTotalAid(this.transactions);
    const totalAid = this.formatAidAmount(totalAidValue);

    // Calculate average processing time (real blockchain: ~2-5 seconds)
    const avgProcessingTime = this.isRealBlockchainConnected ? '2.3s' : '2.3s';

    console.log(`[Blockchain] ⚠️ Using fallback: ${this.transactions.length} in-memory transactions`);

    return {
      transactions: this.transactions.slice(0, 50), // Return latest 50
      totalTransactions: this.transactions.length,
      totalAid: totalAid,
      smartContracts: this.blockCounter,
      avgProcessingTime: avgProcessingTime,
      walletAddress: this.polygonService.getWalletAddress(),
      walletBalance: this.walletBalance,
      isRealBlockchain: this.isRealBlockchainConnected,
    };
  }

  /**
   * Calculate total aid from transactions
   */
  private calculateTotalAid(transactions: BlockchainTransaction[]): number {
    let total = 0;
    
    for (const tx of transactions) {
      // Parse amount (handles formats like "$1.2M", "$500K", "1.5 MATIC")
      const amountStr = tx.amount.replace(/[^0-9.]/g, '');
      const amount = parseFloat(amountStr);
      
      if (tx.amount.includes('M')) {
        total += amount * 1000000;
      } else if (tx.amount.includes('K')) {
        total += amount * 1000;
      } else {
        // For MATIC or other currencies, approximate conversion
        total += amount * 0.0001; // Rough conversion for display
      }
    }
    
    return total;
  }

  /**
   * Format aid amount for display
   */
  private formatAidAmount(amount: number): string {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount.toFixed(2)}`;
    }
  }

  /**
   * Add a new transaction (simulated blockchain write)
   * In production, this would interact with smart contracts
   */
  async addTransaction(transaction: Omit<BlockchainTransaction, 'id' | 'hash' | 'timestamp'>): Promise<BlockchainTransaction> {
    const newTx: BlockchainTransaction = {
      ...transaction,
      id: `TX-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      hash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      blockNumber: this.blockCounter++,
    };

    // Save to MongoDB if available
    this.ensureMongoDBModel();
    if (this.transactionModel) {
      try {
        // Check for duplicate before inserting
        const existing = await this.transactionModel.findByHash(newTx.hash);
        if (existing) {
          console.log(`[Blockchain] ⚠️ Transaction ${newTx.id} already exists in MongoDB (skipping duplicate)`);
        } else {
          await this.transactionModel.insert({
            ...newTx,
            paymentMethod: 'blockchain',
          });
          console.log(`[Blockchain] ✅ Transaction saved to MongoDB: ${newTx.id}`);
        }
      } catch (error: any) {
        // Handle duplicate key errors gracefully
        if (error.code === 11000 || error.message?.includes('duplicate') || error.message?.includes('E11000')) {
          console.log(`[Blockchain] ℹ️ Transaction ${newTx.id} already exists in MongoDB (duplicate key)`);
        } else {
          console.error('[Blockchain] ❌ Error saving to MongoDB:', error.message);
          console.error('[Blockchain] Error code:', error.code);
          console.error('[Blockchain] Full error:', error);
        }
      }
    } else {
      console.warn('[Blockchain] ⚠️ MongoDB model not available - transaction not saved to database');
      console.warn('[Blockchain] 💡 To fix: Ensure MongoDB is running and MONGODB_URI is set in .env');
    }

    // Simulate verification delay
    if (transaction.status === 'pending') {
      setTimeout(() => {
        const tx = this.transactions.find((t) => t.id === newTx.id);
        if (tx) {
          tx.status = 'verified';
          // Update in MongoDB too
          if (this.transactionModel) {
            this.transactionModel.update(newTx.id, { status: 'verified' }).catch(console.error);
          }
        }
      }, 2000 + Math.random() * 3000);
    }

    this.transactions.unshift(newTx);
    return newTx;
  }

  /**
   * Initialize with sample transactions
   */
  private initializeTransactions(): void {
    const donors = [
      'Global Aid Foundation',
      'International Relief Corp',
      'Emergency Response Network',
      'Humanitarian Alliance',
      'Disaster Relief Coalition',
    ];
    const regions = ['Region A', 'Region B', 'Region C', 'Region D'];
    const amounts = ['$500K', '$750K', '$1.2M', '$1.8M', '$2.3M', '$2.5M', '$3M'];

    for (let i = 0; i < 10; i++) {
      this.transactions.push({
        id: `TX-${String(i + 1).padStart(4, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        donor: donors[Math.floor(Math.random() * donors.length)],
        region: regions[Math.floor(Math.random() * regions.length)],
        amount: amounts[Math.floor(Math.random() * amounts.length)],
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        hash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        status: Math.random() > 0.2 ? 'verified' : 'pending',
        blockNumber: this.blockCounter - 10 + i,
      });
    }
  }

  /**
   * Generate new transaction periodically (simulated - only if not using real blockchain)
   */
  generateSimulatedTransaction(): void {
    if (this.isRealBlockchainConnected) {
      // Don't generate simulated transactions if real blockchain is connected
      return;
    }

    const donors = [
      'Humanitarian Alliance',
      'Disaster Relief Coalition',
      'Global Emergency Fund',
      'Crisis Response Network',
      'Aid Distribution Center',
    ];
    const regions = ['Region A', 'Region B', 'Region C', 'Region D'];
    const amounts = ['$500K', '$750K', '$1.2M', '$1.8M', '$2.3M'];

    this.addTransaction({
      donor: donors[Math.floor(Math.random() * donors.length)],
      region: regions[Math.floor(Math.random() * regions.length)],
      amount: amounts[Math.floor(Math.random() * amounts.length)],
      status: Math.random() > 0.3 ? 'verified' : 'pending',
    }).catch(console.error);
  }

  /**
   * Get Polygon service instance (for QR code generation, etc.)
   */
  getPolygonService(): PolygonService {
    return this.polygonService;
  }

  /**
   * Get Payment Gateway service instance
   */
  getPaymentGatewayService(): PaymentGatewayService {
    return this.paymentGatewayService;
  }

  /**
   * Check if real blockchain is connected
   */
  isConnected(): boolean {
    return this.isRealBlockchainConnected;
  }

  /**
   * Record UPI payment as blockchain transaction
   */
  async recordUPIPayment(
    payment: {
      amount: number;
      upiReference: string;
      donorName?: string;
      donorPhone?: string;
      region?: string;
      description?: string;
      sendToBlockchain?: boolean;
    }
  ): Promise<BlockchainTransaction> {
    const paymentRecord = {
      amount: payment.amount,
      upiReference: payment.upiReference,
      donorName: payment.donorName,
      donorPhone: payment.donorPhone,
      region: payment.region,
      description: payment.description,
      timestamp: new Date().toISOString(),
      verified: true,
    };

    // Record the payment as blockchain transaction
    // This will wait for blockchain confirmation (2-5 seconds) to get REAL hash
    console.log(`[Blockchain] 📝 Recording UPI payment: ${payment.upiReference}, Amount: ₹${payment.amount}`);
    console.log(`[Blockchain] ⏳ Waiting for blockchain confirmation (this may take 2-5 seconds)...`);
    
    const blockchainTx = await this.upiPaymentService.recordUPIPayment(
      paymentRecord,
      payment.sendToBlockchain || false
    );
    
    if (blockchainTx.status === 'verified' && blockchainTx.hash.startsWith('0x')) {
      console.log(`[Blockchain] ✅ Transaction created with REAL blockchain hash: ${blockchainTx.id}`);
      console.log(`[Blockchain] 🔗 Real Hash: ${blockchainTx.hash}`);
      console.log(`[Blockchain] 📦 Block Number: ${blockchainTx.blockNumber}`);
      console.log(`[Blockchain] 🔗 View on PolygonScan: https://amoy.polygonscan.com/tx/${blockchainTx.hash}`);
    } else {
      console.log(`[Blockchain] ⚠️ Transaction created without blockchain confirmation: ${blockchainTx.id}`);
    }

    // Mark this hash as processed (so monitoring doesn't create a duplicate)
    this.processedTransactionHashes.add(blockchainTx.hash.toLowerCase());
    
    // Add to in-memory cache with REAL hash (blockchain confirmation complete)
    this.transactions.unshift(blockchainTx);
    console.log(`[Blockchain] ✅ Transaction added to in-memory cache. Total transactions: ${this.transactions.length}`);

    // Save to MongoDB if available
    this.ensureMongoDBModel();
    if (this.transactionModel) {
      try {
        // Check for duplicate before inserting
        const existing = await this.transactionModel.findByHash(blockchainTx.hash);
        if (existing) {
          console.log(`[Blockchain] ⚠️ Transaction ${blockchainTx.id} already exists in MongoDB (skipping duplicate)`);
        } else {
          await this.transactionModel.insert({
            ...blockchainTx,
            upiReference: payment.upiReference,
            paymentMethod: 'upi',
            amountInINR: payment.amount,
            donorPhone: payment.donorPhone,
            description: payment.description,
          });
          console.log(`[Blockchain] ✅ Transaction saved to MongoDB: ${blockchainTx.id}`);
        }
      } catch (error: any) {
        // Handle duplicate key errors gracefully
        if (error.code === 11000 || error.message?.includes('duplicate') || error.message?.includes('E11000')) {
          console.log(`[Blockchain] ℹ️ Transaction ${blockchainTx.id} already exists in MongoDB (duplicate key)`);
        } else {
          console.error('[Blockchain] ❌ Error saving to MongoDB:', error.message);
          console.error('[Blockchain] Error code:', error.code);
          console.error('[Blockchain] Error stack:', error.stack);
          // Transaction already in cache, so frontend will still show it
        }
      }
    } else {
      console.warn('[Blockchain] ⚠️ MongoDB model not available - transaction not saved to database');
      console.warn('[Blockchain] 💡 To fix: Ensure MongoDB is running and MONGODB_URI is set in .env');
      console.warn('[Blockchain] 💡 Transaction is saved in memory but will be lost on server restart');
    }
    
    // Update block counter if needed
    if (blockchainTx.blockNumber && blockchainTx.blockNumber > this.blockCounter) {
      this.blockCounter = blockchainTx.blockNumber;
    }

    console.log(`[Blockchain] ✅ UPI payment recorded as blockchain transaction: ${blockchainTx.id}`);

    return blockchainTx;
  }

  /**
   * Get UPI Payment Service instance
   */
  getUPIPaymentService(): UPIPaymentService {
    return this.upiPaymentService;
  }
}
