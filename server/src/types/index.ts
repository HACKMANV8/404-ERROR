export interface AIMetric {
  name: string;
  value: number;
  status: "critical" | "high" | "medium" | "low";
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
  status: "critical" | "high" | "medium" | "low";
  weatherData?: WeatherData;
  satelliteDamage?: number;
  socialUrgency?: number;
  demographicData?: {
    populationDensity: number;
    hospitals: number;
    roads: number;
    elevation: number;
  };
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  pressure: number;
  conditions: string;
  timestamp: string;
}

export interface SocialMediaData {
  sentiment: number;
  urgencyScore: number;
  mentions: number;
  hashtags: string[];
  timestamp: string;
}

export interface SatelliteData {
  damageScore: number;
  affectedArea: number;
  confidence: number;
  timestamp: string;
  sources?: string[];
}

export interface BlockchainTransaction {
  id: string;
  donor: string;
  region: string;
  amount: string;
  timestamp: string;
  hash: string;
  status: "verified" | "pending";
  blockNumber?: number;
}

export interface PredictionResponse {
  aiMetrics: AIMetric[];
  regions: Region[];
  lastUpdated: string;
}

export interface TransactionResponse {
  transactions: BlockchainTransaction[];
  totalTransactions: number;
  totalAid: string;
  smartContracts: number;
  avgProcessingTime: string;
}
