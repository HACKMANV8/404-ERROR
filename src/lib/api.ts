const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface AIMetric {
  name: string;
  value: number;
  status: 'critical' | 'high' | 'medium' | 'low';
  trend?: number;
  lastUpdated: string;
}

export interface Region {
  id: string;
  name: string;
  lat: number;
  lon: number;
  severity: number;
  population: string;
  aid: string;
  status: 'critical' | 'high' | 'medium' | 'low';
  weatherData?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    rainfall: number;
    pressure: number;
    conditions: string;
    timestamp: string;
  };
  satelliteDamage?: number;
  socialUrgency?: number;
  demographicData?: {
    populationDensity: number;
    hospitals: number;
    roads: number;
    elevation: number;
  };
}

export interface PredictionResponse {
  regions: Region[];
  aiMetrics: AIMetric[];
  lastUpdated: string;
}

export interface BlockchainTransaction {
  id: string;
  donor: string;
  region: string;
  amount: string;
  timestamp: string;
  hash: string;
  status: 'verified' | 'pending';
  blockNumber?: number;
}

export interface TransactionResponse {
  transactions: BlockchainTransaction[];
  totalTransactions: number;
  totalAid: string;
  smartContracts: number;
  avgProcessingTime: string;
  walletAddress?: string | null;
  walletBalance?: string;
  isRealBlockchain?: boolean;
}

export interface WalletInfo {
  address: string | null;
  balance: string;
  network: string;
  isConnected: boolean;
}

/**
 * Fetch AI predictions and region data
 */
export async function fetchPredictions(): Promise<PredictionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/predictions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch predictions');
  }

  return response.json();
}

/**
 * Fetch blockchain transactions
 */
export async function fetchTransactions(): Promise<TransactionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/transactions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }

  return response.json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error('API server is not responding');
  }
  return response.json();
}

/**
 * Get wallet information and address
 */
export async function fetchWalletInfo(): Promise<WalletInfo> {
  const response = await fetch(`${API_BASE_URL}/api/blockchain/wallet`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch wallet info');
  }

  return response.json();
}

/**
 * Payment options interface
 */
export interface PaymentOptions {
  upi: {
    id: string | null;
    qrCode: string | null;
    available: boolean;
  };
  razorpayQR: {
    qrCodeUrl: string | null;
    qrCodeId: string | null;
    qrCodeImage: string | null;
    available: boolean;
    note: string;
  };
  bankAccount: {
    available: boolean;
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
    accountHolderName?: string;
    accountType?: string;
  };
  razorpay: {
    available: boolean;
  };
  stripe: {
    available: boolean;
  };
}

/**
 * Get payment options (UPI, Bank details, etc.)
 */
export async function fetchPaymentOptions(): Promise<PaymentOptions> {
  const response = await fetch(`${API_BASE_URL}/api/payments/options`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch payment options');
  }

  return response.json();
}

/**
 * Record UPI payment as blockchain transaction
 */
export interface RecordUPIPaymentRequest {
  amount: number;
  upiReference: string;
  donorName?: string;
  donorPhone?: string;
  region?: string;
  description?: string;
  sendToBlockchain?: boolean;
  screenshot?: File;
}

export interface RecordUPIPaymentResponse {
  success: boolean;
  message: string;
  transaction: BlockchainTransaction;
}

export async function recordUPIPayment(
  payment: RecordUPIPaymentRequest
): Promise<RecordUPIPaymentResponse> {
  // If screenshot is provided, use FormData; otherwise use JSON
  const formData = new FormData();
  
  formData.append('amount', payment.amount.toString());
  formData.append('upiReference', payment.upiReference);
  
  if (payment.donorName) formData.append('donorName', payment.donorName);
  if (payment.donorPhone) formData.append('donorPhone', payment.donorPhone);
  if (payment.region) formData.append('region', payment.region);
  if (payment.description) formData.append('description', payment.description);
  if (payment.sendToBlockchain !== undefined) {
    formData.append('sendToBlockchain', payment.sendToBlockchain.toString());
  }
  
  // Add screenshot if provided
  if (payment.screenshot) {
    formData.append('screenshot', payment.screenshot);
  }

  const response = await fetch(`${API_BASE_URL}/api/payments/record-upi`, {
    method: 'POST',
    // Don't set Content-Type header - browser will set it automatically with boundary for FormData
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to record UPI payment');
  }

  return response.json();
}
