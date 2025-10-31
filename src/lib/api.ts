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
