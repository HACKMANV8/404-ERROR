import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AIPredictionService } from './services/aiPredictionService.js';
import { BlockchainService } from './services/blockchainService.js';
import { DISASTER_REGIONS } from './config/regions.js';
import type { Region } from './types/index.js';

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

// Services
const aiPredictionService = new AIPredictionService();
const blockchainService = new BlockchainService();

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
    const response = await blockchainService.getTransactions();
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
    const polygonService = blockchainService.getPolygonService();
    const walletAddress = polygonService.getWalletAddress();
    const balance = await polygonService.getBalance();
    
    res.json({
      address: walletAddress,
      balance: balance,
      network: 'Polygon Amoy (Testnet)',
      isConnected: blockchainService.isConnected(),
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
    
    const paymentGateway = blockchainService.getPaymentGatewayService();
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
    
    const paymentGateway = blockchainService.getPaymentGatewayService();
    const payment = await paymentGateway.verifyPayment(paymentId, gateway);
    
    res.json(payment);
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: error.message || 'Failed to verify payment' });
  }
});

/**
 * Get payment options (UPI, Bank details, etc.)
 */
app.get('/api/payments/options', async (req: Request, res: Response) => {
  try {
    const paymentGateway = blockchainService.getPaymentGatewayService();
    const upiId = paymentGateway.getUPIId();
    const bankAccount = paymentGateway.getBankAccount();
    
    // Generate UPI QR code data
    const upiQRCode = upiId ? paymentGateway.generateUPIQR() : null;
    
    res.json({
      upi: {
        id: upiId,
        qrCode: upiQRCode,
        available: !!upiId,
      },
      bankAccount: {
        ...bankAccount,
        available: !!(bankAccount.accountNumber && bankAccount.ifsc),
      },
      razorpay: {
        available: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ResQ Ledger API server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET /api/predictions - AI predictions and region data`);
  console.log(`   GET /api/transactions - Blockchain transactions`);
  console.log(`   GET /api/health - Health check`);
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
setInterval(() => {
  if (!blockchainService.isConnected()) {
    blockchainService.generateSimulatedTransaction();
  }
}, 10000); // Every 10 seconds
