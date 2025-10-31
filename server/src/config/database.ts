import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Connect to MongoDB
 */
export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    // Get MongoDB connection string from environment
    let mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
    const dbName = process.env.MONGODB_DB_NAME || 'resqledger';

    // Fix IPv6 issue: Replace localhost with 127.0.0.1 to force IPv4
    if (mongoUri.includes('localhost') && !mongoUri.includes('127.0.0.1')) {
      mongoUri = mongoUri.replace('localhost', '127.0.0.1');
      console.log('[MongoDB] 🔧 Fixed connection string to use IPv4 (127.0.0.1)');
    }

    console.log('[MongoDB] Connecting to MongoDB...');
    console.log(`[MongoDB] URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Hide credentials
    
    // For mongodb+srv:// (MongoDB Atlas), don't use family option
    // For mongodb:// (local), use IPv4 option to avoid IPv6 issues
    const clientOptions: any = {};
    if (mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
      // Force IPv4 connection for local MongoDB (not Atlas)
      clientOptions.family = 4; // Use IPv4 only
    }
    
    client = new MongoClient(mongoUri, clientOptions);
    await client.connect();
    
    db = client.db(dbName);
    
    console.log(`[MongoDB] ✅ Connected to database: ${dbName}`);
    
    // Create indexes for better query performance
    await createIndexes(db);
    
    return db;
  } catch (error: any) {
    console.error('[MongoDB] ❌ Connection error:', error.message);
    throw error;
  }
}

/**
 * Create database indexes for better performance
 */
async function createIndexes(database: Db): Promise<void> {
  try {
    const transactionsCollection = database.collection('transactions');
    
    // Index on transaction hash for fast lookups
    await transactionsCollection.createIndex({ hash: 1 }, { unique: true });
    
    // Index on timestamp for sorting
    await transactionsCollection.createIndex({ timestamp: -1 });
    
    // Index on donor for filtering
    await transactionsCollection.createIndex({ donor: 1 });
    
    // Index on region for filtering
    await transactionsCollection.createIndex({ region: 1 });
    
    // Index on upiReference for UPI payments
    await transactionsCollection.createIndex({ upiReference: 1 }, { sparse: true });
    
    console.log('[MongoDB] ✅ Indexes created');
  } catch (error: any) {
    console.error('[MongoDB] ⚠️ Error creating indexes:', error.message);
    // Continue even if indexes fail
  }
}

/**
 * Get database instance
 */
export function getDatabase(): Db | null {
  return db;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[MongoDB] ✅ Connection closed');
  }
}

