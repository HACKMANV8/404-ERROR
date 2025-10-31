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
    
    // For mongodb+srv:// (MongoDB Atlas), mongodb+srv already uses TLS by default
    // For mongodb:// (local), use IPv4 option to avoid IPv6 issues
    const clientOptions: any = {
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      connectTimeoutMS: 30000, // 30 seconds connection timeout
    };
    
    if (mongoUri.startsWith('mongodb+srv://')) {
      // MongoDB Atlas - Try connecting with workaround for Windows SSL issues
      console.log('[MongoDB] 🔒 Attempting MongoDB Atlas connection...');
      
      // Parse and clean URI - preserve appName if present, ensure retryWrites (correct plural)
      const uriParts = mongoUri.split('?');
      const baseUri = uriParts[0];
      const queryParams = uriParts.length > 1 ? uriParts[1] : '';
      
      // Build clean query string - manually parse to avoid URLSearchParams issues
      const params: Record<string, string> = {};
      
      // Parse existing query params
      if (queryParams) {
        queryParams.split('&').forEach(param => {
          const [key, value] = param.split('=');
          if (key && value) {
            // Remove any incorrect retryWrite (singular) - only keep retryWrites (plural)
            if (key.toLowerCase() !== 'retrywrite' && key !== 'retryWrite') {
              params[decodeURIComponent(key)] = decodeURIComponent(value);
            }
          }
        });
      }
      
      // Always set correct parameters (override any existing)
      params['retryWrites'] = 'true'; // CORRECT: plural 'retryWrites'
      params['w'] = 'majority';
      
      // Preserve appName if it exists in original
      if (queryParams.includes('appName=')) {
        const appNameMatch = queryParams.match(/appName=([^&]+)/);
        if (appNameMatch) {
          params['appName'] = decodeURIComponent(appNameMatch[1]);
        }
      }
      
      // Build final query string
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      
      mongoUri = baseUri + '?' + queryString;
      
      // Debug: Log the final URI (without credentials)
      console.log(`[MongoDB] 🔗 Final URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      
      // First try: Normal connection
      try {
        clientOptions.tls = true;
        clientOptions.tlsAllowInvalidCertificates = false;
        clientOptions.tlsAllowInvalidHostnames = false;
        
        client = new MongoClient(mongoUri, clientOptions);
        await client.connect();
        console.log('[MongoDB] ✅ Connected to MongoDB Atlas (strict SSL)');
      } catch (sslError: any) {
        // If strict SSL fails, try with relaxed SSL (Windows workaround)
        console.log('[MongoDB] ⚠️ Strict SSL failed, trying relaxed SSL for Windows compatibility...');
        
        // Close the failed client
        if (client) {
          try {
            await client.close();
          } catch (e) {
            // Ignore close errors
          }
        }
        
        // Retry with relaxed SSL (development only)
        clientOptions.tls = true;
        clientOptions.tlsAllowInvalidCertificates = true; // Allow invalid certs (Windows workaround)
        clientOptions.tlsAllowInvalidHostnames = true; // Allow invalid hostnames
        
        console.log('[MongoDB] 🔄 Attempting connection with relaxed SSL settings...');
        client = new MongoClient(mongoUri, clientOptions);
        try {
          await client.connect();
          console.log('[MongoDB] ✅ Connected to MongoDB Atlas (relaxed SSL - Windows workaround)');
          console.log('[MongoDB] ⚠️ Using relaxed SSL for development. For production, fix SSL certificates.');
        } catch (relaxedError: any) {
          console.error('[MongoDB] ❌ Relaxed SSL connection also failed:', relaxedError.message);
          if (relaxedError.message.includes('ENOTFOUND') || relaxedError.message.includes('ETIMEDOUT')) {
            console.error('[MongoDB] 💡 Possible issues:');
            console.error('   1. Check your internet connection');
            console.error('   2. Verify MongoDB Atlas cluster is running (not paused)');
            console.error('   3. Check Network Access in MongoDB Atlas - add your IP (0.0.0.0/0 for testing)');
          }
          throw relaxedError; // Re-throw to trigger retry in index.ts
        }
      }
    } else if (mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
      // Local MongoDB - Force IPv4 connection
      clientOptions.family = 4; // Use IPv4 only
      console.log('[MongoDB] 🔧 Using IPv4 for local MongoDB connection');
      
      client = new MongoClient(mongoUri, clientOptions);
      await client.connect();
    }
    
    // Ensure client is initialized before using it
    if (!client) {
      throw new Error('MongoDB client not initialized');
    }
    
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

