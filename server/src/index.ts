import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { AIPredictionService } from './services/aiPredictionService.js';
import { BlockchainService } from './services/blockchainService.js';
import { OCRService } from './services/ocrService.js';
import { DISASTER_REGIONS } from './config/regions.js';
import type { Region } from './types/index.js';
import { connectToDatabase } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for development
    }
  },
  credentials: true,
}));
app.use(express.json());

// Multer configuration for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Services
const aiPredictionService = new AIPredictionService();
// BlockchainService will be initialized after MongoDB connects
let blockchainService: BlockchainService | null = null;
const ocrService = new OCRService();

// Lazy getter for blockchainService to ensure it's initialized
function getBlockchainService(): BlockchainService {
  if (!blockchainService) {
    throw new Error('BlockchainService not initialized yet. MongoDB must connect first.');
  }
  return blockchainService;
}

// Cache for predictions (update every 30 seconds)
let cachedPredictions: {
  regions: Region[];
  aiMetrics: any[];
  lastUpdated: string;
} | null = null;

/**
 * Get AI predictions and region data
 */
app.get('/api/predictions', async (req: Request, res: Response) => {
  try {
    // Check if cache is fresh (less than 30 seconds old)
    if (cachedPredictions) {
      const cacheAge = Date.now() - new Date(cachedPredictions.lastUpdated).getTime();
      if (cacheAge < 30000) {
        return res.json(cachedPredictions);
      }
    }

    // Generate fresh predictions
    const baseRegions = DISASTER_REGIONS.map((r) => ({
      ...r,
      severity: 0,
      aid: '$0',
      status: 'low' as const,
    }));

    const { regions, aiMetrics } = await aiPredictionService.generatePredictions(baseRegions);

    cachedPredictions = {
      regions,
      aiMetrics,
      lastUpdated: new Date().toISOString(),
    };

    res.json(cachedPredictions);
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

/**
 * Get blockchain transactions
 */
app.get('/api/transactions', async (req: Request, res: Response) => {
  try {
    const response = await getBlockchainService().getTransactions();
    res.json(response);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ResQ Ledger API',
  });
});

/**
 * Get wallet address and QR code for donations
 */
app.get('/api/blockchain/wallet', async (req: Request, res: Response) => {
  try {
    const service = getBlockchainService();
    const polygonService = service.getPolygonService();
    const walletAddress = polygonService.getWalletAddress();
    const balance = await polygonService.getBalance();
    
    res.json({
      address: walletAddress,
      balance: balance,
      network: 'Polygon Amoy (Testnet)',
      isConnected: service.isConnected(),
    });
  } catch (error) {
    console.error('Error getting wallet info:', error);
    res.status(500).json({ error: 'Failed to get wallet info' });
  }
});

/**
 * Create payment order (Payment Gateway)
 */
app.post('/api/payments/create', async (req: Request, res: Response) => {
  try {
    const { amount, currency, region, donorName, donorEmail, description } = req.body;
    
    const paymentGateway = getBlockchainService().getPaymentGatewayService();
    const payment = await paymentGateway.createPayment({
      amount,
      currency: currency || 'INR',
      region,
      donorName,
      donorEmail,
      description,
    });
    
    res.json(payment);
  } catch (error: any) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment' });
  }
});

/**
 * Verify payment status
 */
app.post('/api/payments/verify', async (req: Request, res: Response) => {
  try {
    const { paymentId, gateway } = req.body;
    
    const paymentGateway = getBlockchainService().getPaymentGatewayService();
    const payment = await paymentGateway.verifyPayment(paymentId, gateway);
    
    res.json(payment);
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: error.message || 'Failed to verify payment' });
  }
});

/**
 * Get payment options (UPI, Bank details, Razorpay QR, etc.)
 */
app.get('/api/payments/options', async (req: Request, res: Response) => {
  try {
    const paymentGateway = getBlockchainService().getPaymentGatewayService();
    const upiId = paymentGateway.getUPIId();
    const bankAccount = paymentGateway.getBankAccount();
    
    // Try to create Razorpay QR code (for automatic detection)
    let razorpayQR: { qrCodeUrl: string; qrCodeId: string; qrCodeImage: string } | null = null;
    const hasRazorpay = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    
    if (hasRazorpay) {
      try {
        razorpayQR = await paymentGateway.createRazorpayQRCode(undefined, 'Disaster Relief Donation');
      } catch (error: any) {
        console.error('[API] ⚠️ Failed to create Razorpay QR code, falling back to direct UPI:', error.message);
      }
    }
    
    // Generate direct UPI QR code (fallback - no automatic detection)
    const upiQRCode = upiId ? paymentGateway.generateUPIQR() : null;
    
    res.json({
      upi: {
        id: upiId,
        qrCode: upiQRCode, // Direct UPI (manual entry required)
        available: !!upiId,
      },
      razorpayQR: {
        qrCodeUrl: razorpayQR?.qrCodeUrl || null,
        qrCodeId: razorpayQR?.qrCodeId || null,
        qrCodeImage: razorpayQR?.qrCodeImage || null,
        available: !!razorpayQR,
        note: razorpayQR ? 'Automatic payment detection enabled' : 'Manual entry required',
      },
      bankAccount: {
        ...bankAccount,
        available: !!(bankAccount.accountNumber && bankAccount.ifsc),
      },
      razorpay: {
        available: hasRazorpay,
      },
      stripe: {
        available: !!process.env.STRIPE_SECRET_KEY,
      },
    });
  } catch (error: any) {
    console.error('Error getting payment options:', error);
    res.status(500).json({ error: error.message || 'Failed to get payment options' });
  }
});

/**
 * Record UPI payment as blockchain transaction
 * This endpoint now accepts FormData with screenshot for UTR verification
 */
app.post('/api/payments/record-upi', upload.single('screenshot'), async (req: Request, res: Response) => {
  try {
    console.log('[API] 📥 Received UPI payment recording request');
    
    // Extract form data from multipart form
    const { amount, upiReference, donorName, donorPhone, region, description, sendToBlockchain } = req.body;
    const screenshot = req.file;

    // Validate required fields
    if (!amount || !upiReference) {
      console.error('[API] ❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: amount and upiReference are required' 
      });
    }

    // If screenshot is provided, verify UTR matches
    if (screenshot) {
      console.log('[API] 📸 Screenshot provided, extracting UTR for verification...');
      console.log('[API] Screenshot details:', {
        filename: screenshot.originalname,
        mimetype: screenshot.mimetype,
        size: screenshot.size,
      });

      try {
        // Extract UTR from screenshot using OCR
        const extractedUTR = await ocrService.extractUTRFromImage(screenshot.buffer);
        
        if (!extractedUTR) {
          console.error('[API] ❌ Could not extract UTR from screenshot');
          return res.status(400).json({
            error: 'Could not extract UTR number from the screenshot. Please ensure the screenshot is clear and contains the UPI payment confirmation.',
          });
        }

        console.log('[API] ✅ Extracted UTR from screenshot:', extractedUTR);
        console.log('[API] 📝 Manually entered UPI Reference:', upiReference);

        // Compare extracted UTR with manually entered UPI Reference
        const utrMatches = ocrService.compareUTR(extractedUTR, upiReference);

        if (!utrMatches) {
          console.error('[API] ❌ UTR mismatch detected!');
          console.error('[API] Extracted UTR:', extractedUTR);
          console.error('[API] Entered UPI Reference:', upiReference);
          return res.status(400).json({
            error: 'UTR numbers don\'t match. Please verify and try again.',
            details: {
              extractedUTR: extractedUTR,
              enteredUPIReference: upiReference,
            },
          });
        }

        console.log('[API] ✅ UTR verification passed! Proceeding with transaction...');
      } catch (ocrError: any) {
        console.error('[API] ❌ OCR processing error:', ocrError.message);
        return res.status(500).json({
          error: 'Failed to process screenshot. Please try again or ensure the image is clear.',
          details: process.env.NODE_ENV === 'development' ? ocrError.message : undefined,
        });
      }
    } else {
      console.log('[API] ⚠️ No screenshot provided - skipping UTR verification');
    }

    console.log('[API] ✅ Validating UPI payment:', { amount, upiReference, donorName, region });

    // Record UPI payment as blockchain transaction (already signs with private key)
    console.log('[API] 📝 Calling BlockchainService.recordUPIPayment...');
    const blockchainTx = await getBlockchainService().recordUPIPayment({
      amount: parseFloat(amount),
      upiReference: upiReference.toString(),
      donorName,
      donorPhone,
      region,
      description,
      sendToBlockchain: sendToBlockchain === true,
    });

    console.log('[API] ✅ UPI payment recorded successfully:', blockchainTx.id);
    console.log('[API] 📊 Transaction details:', {
      id: blockchainTx.id,
      hash: blockchainTx.hash,
      amount: blockchainTx.amount,
      donor: blockchainTx.donor,
      region: blockchainTx.region,
      status: blockchainTx.status,
    });

    res.json({
      success: true,
      message: 'UPI payment recorded as blockchain transaction',
      transaction: blockchainTx,
    });
  } catch (error: any) {
    console.error('[API] ❌ Error recording UPI payment:', error);
    console.error('[API] Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Failed to record UPI payment',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Verify and record UPI payment (with verification step)
 */
app.post('/api/payments/verify-and-record-upi', async (req: Request, res: Response) => {
  try {
    const { upiReference, amount, donorName, donorPhone, region, description } = req.body;

    if (!upiReference || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: upiReference and amount are required' 
      });
    }

    // Verify payment first
    const service = getBlockchainService();
    const upiService = service.getUPIPaymentService();
    const verified = await upiService.verifyUPIPayment(upiReference, parseFloat(amount));

    if (!verified) {
      return res.status(400).json({ 
        error: 'Payment verification failed. Please check UPI reference and amount.' 
      });
    }

    // Record as blockchain transaction
    const blockchainTx = await service.recordUPIPayment({
      amount: parseFloat(amount),
      upiReference: upiReference.toString(),
      donorName,
      donorPhone,
      region,
      description,
      sendToBlockchain: false, // Just record, don't send MATIC
    });

    res.json({
      success: true,
      message: 'UPI payment verified and recorded as blockchain transaction',
      transaction: blockchainTx,
    });
  } catch (error: any) {
    console.error('Error verifying/recording UPI payment:', error);
    res.status(500).json({ error: error.message || 'Failed to verify/record UPI payment' });
  }
});

/**
 * Razorpay Webhook - Automatic payment detection
 * This endpoint receives notifications from Razorpay when payments are received
 */
app.post('/api/payments/razorpay-webhook', async (req: Request, res: Response) => {
  try {
    // Razorpay webhook signature verification would go here in production
    const webhookData = req.body;
    
    console.log('[Razorpay Webhook] 📥 Received webhook:', webhookData.event);

    // Handle payment captured event
    if (webhookData.event === 'payment.captured') {
      const payment = webhookData.payload.payment.entity;
      
      console.log('[Razorpay Webhook] ✅ Payment captured:', {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
      });

      // Convert amount from paise to rupees
      const amountInINR = payment.amount / 100;

      // Extract donor info from payment notes
      const donorName = payment.notes?.donorName || payment.email || 'Anonymous Donor';
      const region = payment.notes?.region || 'Multiple Regions';
      const description = payment.notes?.description || `Payment via ${payment.method}`;

      // Record as blockchain transaction
      try {
        const blockchainTx = await getBlockchainService().recordUPIPayment({
          amount: amountInINR,
          upiReference: payment.id, // Use Razorpay payment ID as reference
          donorName,
          donorPhone: payment.contact || undefined,
          region,
          description: `Razorpay Payment: ${description}`,
          sendToBlockchain: false,
        });

        console.log('[Razorpay Webhook] ✅ Payment recorded as blockchain transaction:', blockchainTx.id);
      } catch (error: any) {
        console.error('[Razorpay Webhook] ❌ Error recording payment:', error.message);
        // Don't fail webhook - return 200 so Razorpay doesn't retry
      }
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Razorpay Webhook] ❌ Error processing webhook:', error);
    // Still return 200 to prevent Razorpay from retrying
    res.status(200).json({ received: true, error: 'Processing error' });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 ResQ Ledger API server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET /api/predictions - AI predictions and region data`);
  console.log(`   GET /api/transactions - Blockchain transactions`);
  console.log(`   GET /api/health - Health check`);
  console.log(`   POST /api/payments/record-upi - Record UPI payment manually`);
  console.log(`   POST /api/payments/razorpay-webhook - Razorpay webhook (automatic)`);
  
  // MongoDB connection is MANDATORY - retry until connected
  // This ensures previous transactions can be loaded from MongoDB Atlas
  let mongoConnected = false;
  const maxRetries = 5;
  let retryCount = 0;
  
  while (!mongoConnected && retryCount < maxRetries) {
    try {
      console.log(`[Startup] 🔄 Attempting MongoDB connection (attempt ${retryCount + 1}/${maxRetries})...`);
      const db = await connectToDatabase();
      console.log('✅ MongoDB connected successfully');
      mongoConnected = true;
      break; // Success - exit retry loop
    } catch (error: any) {
      retryCount++;
      console.error(`[Startup] ❌ MongoDB connection attempt ${retryCount} failed:`, error.message);
      
      if (retryCount < maxRetries) {
        const waitTime = retryCount * 2000; // Exponential backoff: 2s, 4s, 6s, 8s
        console.log(`[Startup] ⏳ Retrying in ${waitTime/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error('');
        console.error('❌ CRITICAL: MongoDB connection failed after all retry attempts!');
        console.error('   Without MongoDB, previous transactions cannot be loaded.');
        console.error('');
        console.error('💡 To fix MongoDB Atlas connection:');
        console.error('   1. Check your MONGODB_URI in server/.env file');
        console.error('   2. Verify MongoDB Atlas cluster is running');
        console.error('   3. Check Network Access in MongoDB Atlas - allow your IP');
        console.error('   4. Verify username/password in connection string');
        console.error('   5. Connection string format:');
        console.error('      MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/resqledger?retryWrites=true&w=majority');
        console.error('');
        console.error('⚠️ Server will continue but transactions will NOT be persisted.');
        console.error('⚠️ Previous transactions will NOT be loaded.');
        console.error('');
        console.error('🔄 Creating new MongoDB cluster recommended if connection persists.');
        
        // Still try to initialize BlockchainService for basic functionality
        // But warn that MongoDB is not available
        console.log('');
        console.log('🔄 Initializing BlockchainService without MongoDB (limited functionality)...');
        blockchainService = new BlockchainService();
        console.log('⚠️ BlockchainService initialized WITHOUT MongoDB - transactions will not be persisted or loaded');
        return; // Exit early - don't continue with full initialization
      }
    }
  }
  
  // Only reach here if MongoDB connected successfully
  if (mongoConnected) {
    // NOW initialize BlockchainService after MongoDB is connected
    console.log('');
    console.log('🔄 Initializing BlockchainService with MongoDB connection...');
    blockchainService = new BlockchainService();
    console.log('✅ BlockchainService initialized with MongoDB support');
    
    // Wait a moment for BlockchainService to initialize MongoDB model
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🔄 Loading previous transactions from MongoDB Atlas...');
    try {
      // Load existing transactions from MongoDB (not migration - just loading)
      const transactions = await blockchainService.getTransactions();
      console.log(`✅ Loaded ${transactions.transactions.length} previous transactions from MongoDB Atlas`);
      console.log(`💰 Total Aid Distributed: ${transactions.totalAid}`);
      console.log(`📊 Total Transactions: ${transactions.totalTransactions}`);
    } catch (error: any) {
      console.error('⚠️ Error loading previous transactions:', error.message);
      // Continue - at least MongoDB is connected for future transactions
    }
  }
});

// Periodically update predictions
setInterval(async () => {
  try {
    const baseRegions = DISASTER_REGIONS.map((r) => ({
      ...r,
      severity: 0,
      aid: '$0',
      status: 'low' as const,
    }));
    const { regions, aiMetrics } = await aiPredictionService.generatePredictions(baseRegions);
    cachedPredictions = {
      regions,
      aiMetrics,
      lastUpdated: new Date().toISOString(),
    };
    console.log('✅ Predictions updated at', new Date().toISOString());
  } catch (error) {
    console.error('❌ Error updating predictions:', error);
  }
}, 30000); // Update every 30 seconds

// Simulate new blockchain transactions (only if not using real blockchain)
// DISABLED: Uncomment below to enable simulated transactions for demo purposes
// setInterval(() => {
//   if (blockchainService && !blockchainService.isConnected()) {
//     blockchainService.generateSimulatedTransaction();
//   }
// }, 10000); // Every 10 seconds
