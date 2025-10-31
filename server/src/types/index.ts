export interface AIMetric {
  name: string;
  value: number;
  status: "critical" | "high" | "medium" | "low";
  trend?: number;
  lastUpdated: string;
}

export interface EarthquakeRisk {
  riskScore: number;
  recentCount: number;
  maxMagnitude: number;
  lastEvent: string | null;
}

export interface FloodRisk {
  riskScore: number;
  floodExtent: number;
  waterLevel: number;
  isActive: boolean;
}

export interface CycloneRisk {
  riskScore: number;
  windSpeed: number;
  pressure: number;
  cycloneCategory: 'Depression' | 'Deep Depression' | 'Cyclonic Storm' | 'Severe Cyclonic Storm' | 'Very Severe Cyclonic Storm' | 'Extremely Severe Cyclonic Storm' | 'Super Cyclonic Storm' | 'None';
  isActive: boolean;
  lastUpdate: string;
}

export interface DroughtHeatwaveRisk {
  droughtRisk: number;
  heatwaveRisk: number;
  combinedRisk: number;
  temperature: number;
  humidity: number;
  rainfallDeficit: number;
  heatwaveCategory: 'Normal' | 'Heat Wave' | 'Severe Heat Wave' | 'Extreme Heat Wave' | 'None';
  droughtSeverity: 'Normal' | 'Mild' | 'Moderate' | 'Severe' | 'Extreme';
  isHeatwaveActive: boolean;
  isDroughtActive: boolean;
  lastUpdate: string;
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
  earthquakeRisk?: EarthquakeRisk;
  floodRisk?: FloodRisk;
  cycloneRisk?: CycloneRisk;
  droughtHeatwaveRisk?: DroughtHeatwaveRisk;
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
  walletAddress?: string | null;
  walletBalance?: string;
  isRealBlockchain?: boolean;
}
