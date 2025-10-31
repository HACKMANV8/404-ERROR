/**
 * Quick MongoDB Atlas Connection Test
 * Run: node test-mongodb-connection.js
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://medinikopparapu_db_user:Pp8njudOfXk4KB85@cluster0.rfkeuiv.mongodb.net/resqledger?retryWrites=true&w=majority&appName=Cluster0';
const dbName = process.env.MONGODB_DB_NAME || 'resqledger';

async function testConnection() {
  console.log('🔍 Testing MongoDB Atlas Connection...');
  console.log(`📍 URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log('');
  
  let client = null;
  let connected = false;
  
  // Method 1: Minimal options (let MongoDB driver handle TLS)
  try {
    console.log('🔄 Attempting connection (Method 1: Minimal TLS)...');
    client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
    });
    await client.connect();
    console.log('✅ Method 1 SUCCESS!');
    connected = true;
  } catch (error1) {
    console.log(`   ❌ Method 1 failed: ${error1.message}`);
    if (client) {
      await client.close().catch(() => {});
      client = null;
    }
    
    // Method 2: Explicit relaxed TLS
    try {
      console.log('');
      console.log('🔄 Attempting connection (Method 2: Relaxed TLS)...');
      client = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 20000,
        connectTimeoutMS: 20000,
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
      });
      await client.connect();
      console.log('✅ Method 2 SUCCESS!');
      connected = true;
    } catch (error2) {
      console.log(`   ❌ Method 2 failed: ${error2.message}`);
      if (client) {
        await client.close().catch(() => {});
        client = null;
      }
      
      // Method 3: No TLS at all (shouldn't work but let's try)
      try {
        console.log('');
        console.log('🔄 Attempting connection (Method 3: No explicit TLS)...');
        client = new MongoClient(mongoUri, {
          serverSelectionTimeoutMS: 20000,
          connectTimeoutMS: 20000,
        });
        await client.connect();
        console.log('✅ Method 3 SUCCESS!');
        connected = true;
      } catch (error3) {
        console.error('');
        console.error('❌ FAILED: All MongoDB Atlas connection methods failed');
        console.error('');
        console.error('Method 1 error:', error1.message.substring(0, 100));
        console.error('Method 2 error:', error2.message.substring(0, 100));
        console.error('Method 3 error:', error3.message.substring(0, 100));
        console.error('');
        
        const error = error3;
        
        // Provide helpful error messages
        if (error.message.includes('ENOTFOUND')) {
          console.error('💡 Issue: Cannot resolve hostname');
          console.error('   - Check your internet connection');
          console.error('   - Verify cluster URL is correct');
        } else if (error.message.includes('ETIMEDOUT')) {
          console.error('💡 Issue: Connection timeout');
          console.error('   - Check MongoDB Atlas Network Access (allow your IP)');
          console.error('   - Verify cluster is not paused');
        } else if (error.message.includes('authentication failed')) {
          console.error('💡 Issue: Authentication failed');
          console.error('   - Check username and password in connection string');
          console.error('   - Verify database user exists in MongoDB Atlas');
        } else if (error.message.includes('SSL') || error.message.includes('TLS')) {
          console.error('💡 Issue: SSL/TLS error (Windows-specific)');
          console.error('   - This is a known Windows SSL issue with MongoDB Atlas');
          console.error('   - Check MongoDB Atlas Network Access');
          console.error('   - Try using MongoDB Compass to test connection');
        }
        
        console.error('');
        console.error('🔧 Troubleshooting steps:');
        console.error('   1. Go to MongoDB Atlas Dashboard');
        console.error('   2. Check if cluster is running (green status, not paused)');
        console.error('   3. Go to Network Access → Add your IP (or 0.0.0.0/0 for testing)');
        console.error('   4. Go to Database Access → Verify user "medinikopparapu_db_user" exists');
        console.error('   5. Try connecting with MongoDB Compass using the same URI');
        
        process.exit(1);
      }
    }
  }
  
  if (connected && client) {
    try {
      console.log('');
      console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
      console.log('');
      
      // Test database access
      const db = client.db(dbName);
      console.log(`✅ Database "${dbName}" is accessible`);
      
      // Test collection access
      const collections = await db.listCollections().toArray();
      console.log(`✅ Found ${collections.length} collection(s)`);
      
      // Check transactions collection
      const transactionsCollection = db.collection('transactions');
      const count = await transactionsCollection.countDocuments();
      console.log(`✅ Transactions collection has ${count} document(s)`);
      
      console.log('');
      console.log('🎉 MongoDB Atlas connection test PASSED!');
      
    } finally {
      await client.close();
      console.log('🔌 Connection closed');
    }
  }
}

testConnection().catch(console.error);
