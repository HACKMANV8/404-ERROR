import type { Db, Collection } from 'mongodb';
import type { BlockchainTransaction } from '../types/index.js';

/**
 * Transaction model for MongoDB
 * Stores both blockchain and UPI transactions
 */
export interface TransactionDocument extends BlockchainTransaction {
  _id?: string;
  upiReference?: string; // For UPI payments
  paymentMethod?: 'upi' | 'blockchain' | 'card' | 'netbanking';
  amountInINR?: number; // Original amount in INR for UPI payments
  donorPhone?: string;
  donorEmail?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TransactionModel {
  private collection: Collection<TransactionDocument>;

  constructor(database: Db) {
    this.collection = database.collection<TransactionDocument>('transactions');
  }

  /**
   * Insert a new transaction
   */
  async insert(transaction: Omit<TransactionDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<TransactionDocument> {
    try {
      const now = new Date();
      const doc: TransactionDocument = {
        ...transaction,
        createdAt: now,
        updatedAt: now,
      };

      console.log(`[MongoDB] 💾 Attempting to save transaction: ${transaction.id}`);
      console.log(`[MongoDB] Transaction data:`, JSON.stringify(doc, null, 2));

      const result = await this.collection.insertOne(doc);
      
      if (result.insertedId) {
        doc._id = result.insertedId.toString();
        console.log(`[MongoDB] ✅ Transaction saved successfully: ${transaction.id} (ID: ${doc._id})`);
      } else {
        console.warn(`[MongoDB] ⚠️ Transaction inserted but no ID returned: ${transaction.id}`);
      }

      return doc;
    } catch (error: any) {
      console.error(`[MongoDB] ❌ Failed to save transaction ${transaction.id}:`, error.message);
      console.error(`[MongoDB] Error code:`, error.code);
      console.error(`[MongoDB] Error stack:`, error.stack);
      throw error;
    }
  }

  /**
   * Find transaction by hash
   */
  async findByHash(hash: string): Promise<TransactionDocument | null> {
    return await this.collection.findOne({ hash });
  }

  /**
   * Find transaction by UPI reference
   */
  async findByUPIReference(upiReference: string): Promise<TransactionDocument | null> {
    return await this.collection.findOne({ upiReference });
  }

  /**
   * Get all transactions with pagination
   */
  async findAll(limit: number = 50, skip: number = 0): Promise<TransactionDocument[]> {
    return await this.collection
      .find({})
      .sort({ timestamp: -1 }) // Latest first
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  /**
   * Get transactions by region
   */
  async findByRegion(region: string, limit: number = 50): Promise<TransactionDocument[]> {
    return await this.collection
      .find({ region })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get total count of transactions
   */
  async getTotalCount(): Promise<number> {
    return await this.collection.countDocuments();
  }

  /**
   * Get total aid amount (sum of all amounts)
   */
  async getTotalAid(): Promise<number> {
    // Aggregate all transactions and sum amounts
    // Note: This is simplified - in production, you'd parse amount strings properly
    const transactions = await this.collection.find({}).toArray();
    let total = 0;
    
    for (const tx of transactions) {
      if (tx.amountInINR) {
        total += tx.amountInINR;
      } else {
        // Try to parse amount string (e.g., "₹1K", "$500K")
        const amountStr = tx.amount.replace(/[^0-9.]/g, '');
        const amount = parseFloat(amountStr);
        if (!isNaN(amount)) {
          if (tx.amount.includes('M')) {
            total += amount * 1000000;
          } else if (tx.amount.includes('K')) {
            total += amount * 1000;
          } else {
            total += amount;
          }
        }
      }
    }
    
    return total;
  }

  /**
   * Update transaction (e.g., update status)
   */
  async update(id: string, updates: Partial<TransactionDocument>): Promise<boolean> {
    const result = await this.collection.updateOne(
      { id },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    );
    
    return result.modifiedCount > 0;
  }

  /**
   * Delete transaction (use with caution)
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount > 0;
  }
}

