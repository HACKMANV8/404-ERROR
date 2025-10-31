import type { WeatherData } from '../types/index.js';

/**
 * Cyclone risk assessment
 * Based on IMD (India Meteorological Department) cyclone classification
 */
export interface CycloneRisk {
  riskScore: number; // 0-100
  windSpeed: number; // Current wind speed in km/h
  pressure: number; // Atmospheric pressure in hPa
  cycloneCategory: 'Depression' | 'Deep Depression' | 'Cyclonic Storm' | 'Severe Cyclonic Storm' | 'Very Severe Cyclonic Storm' | 'Extremely Severe Cyclonic Storm' | 'Super Cyclonic Storm' | 'None';
  isActive: boolean;
  lastUpdate: string;
}

/**
 * Cyclone Monitoring Service
 * Detects tropical cyclones using real-time weather data
 * Based on IMD (India Meteorological Department) cyclone classification standards
 * 
 * IMD Cyclone Classification:
 * - Depression: 31-49 km/h (17-27 knots)
 * - Deep Depression: 50-61 km/h (28-33 knots)
 * - Cyclonic Storm: 62-88 km/h (34-47 knots)
 * - Severe Cyclonic Storm: 89-118 km/h (48-63 knots)
 * - Very Severe Cyclonic Storm: 119-166 km/h (64-89 knots)
 * - Extremely Severe Cyclonic Storm: 167-221 km/h (90-119 knots)
 * - Super Cyclonic Storm: >221 km/h (>119 knots)
 */
export class CycloneService {
  /**
   * Calculate cyclone risk from weather data
   * Uses real-time weather data from OpenWeatherMap
   */
  async getCycloneRisk(
    weatherData: WeatherData,
    lat: number,
    lon: number,
    regionName?: string
  ): Promise<CycloneRisk> {
    // Extract weather parameters
    const windSpeed = weatherData.windSpeed; // Already in km/h
    const pressure = weatherData.pressure; // hPa
    const conditions = weatherData.conditions.toLowerCase();
    
    // Determine cyclone category based on IMD standards
    const category = this.classifyCyclone(windSpeed);
    
    // Calculate risk score based on wind speed and pressure
    let riskScore = this.calculateCycloneRisk(windSpeed, pressure, category);
    
    // Increase risk for cyclone-prone coastal states
    const baselineRisk = this.getCoastalBaselineRisk(regionName || '', lat, lon);
    if (baselineRisk > 0 && riskScore < 30) {
      // Coastal areas have baseline risk even with low winds (monsoon season, historical patterns)
      riskScore = Math.max(riskScore, baselineRisk);
    }
    
    const isActive = riskScore >= 30 || category !== 'None';
    
    console.log(`[Cyclone] Using REAL weather data - Wind: ${windSpeed}km/h, Category: ${category}, Risk: ${Math.round(riskScore)}%`);
    
    return {
      riskScore: Math.round(riskScore),
      windSpeed: Math.round(windSpeed),
      pressure: Math.round(pressure),
      cycloneCategory: category,
      isActive,
      lastUpdate: weatherData.timestamp,
    };
  }

  /**
   * Classify cyclone based on IMD wind speed standards
   */
  private classifyCyclone(windSpeed: number): CycloneRisk['cycloneCategory'] {
    if (windSpeed >= 222) return 'Super Cyclonic Storm';
    if (windSpeed >= 167) return 'Extremely Severe Cyclonic Storm';
    if (windSpeed >= 119) return 'Very Severe Cyclonic Storm';
    if (windSpeed >= 89) return 'Severe Cyclonic Storm';
    if (windSpeed >= 62) return 'Cyclonic Storm';
    if (windSpeed >= 50) return 'Deep Depression';
    if (windSpeed >= 31) return 'Depression';
    return 'None';
  }

  /**
   * Calculate cyclone risk score (0-100)
   * Based on wind speed, pressure, and cyclone category
   */
  private calculateCycloneRisk(
    windSpeed: number,
    pressure: number,
    category: CycloneRisk['cycloneCategory']
  ): number {
    let risk = 0;
    
    // Wind speed contribution (primary factor)
    if (windSpeed >= 222) risk = 100; // Super Cyclonic Storm
    else if (windSpeed >= 167) risk = 95; // Extremely Severe
    else if (windSpeed >= 119) risk = 85; // Very Severe
    else if (windSpeed >= 89) risk = 70; // Severe
    else if (windSpeed >= 62) risk = 50; // Cyclonic Storm
    else if (windSpeed >= 50) risk = 35; // Deep Depression
    else if (windSpeed >= 31) risk = 20; // Depression
    else if (windSpeed >= 20) risk = 10; // Strong winds (not cyclone yet)
    else risk = 0;
    
    // Pressure adjustment (low pressure = higher cyclone risk)
    // Normal pressure: ~1013 hPa, Cyclone pressure: <1000 hPa
    if (pressure < 970) risk = Math.min(100, risk + 15); // Extremely low pressure
    else if (pressure < 990) risk = Math.min(100, risk + 10); // Very low pressure
    else if (pressure < 1000) risk = Math.min(100, risk + 5); // Low pressure
    else if (pressure < 1010) risk = Math.max(0, risk - 5); // Slightly low
    
    return Math.min(100, Math.max(0, risk));
  }

  /**
   * Get baseline cyclone risk for coastal cyclone-prone states
   * Even with normal weather, these states have some baseline risk during cyclone season
   */
  private getCoastalBaselineRisk(regionName: string, lat: number, lon: number): number {
    // Cyclone-prone coastal states (based on IMD data)
    const cycloneProneStates: { [key: string]: number } = {
      'odisha': 15, // High - most affected by cyclones
      'west bengal': 12, // High - Bay of Bengal cyclones
      'andhra pradesh': 12, // High - frequent cyclones
      'tamil nadu': 10, // Moderate-high - cyclones from Bay of Bengal
      'gujarat': 10, // Moderate-high - Arabian Sea cyclones
      'maharashtra': 8, // Moderate - coastal regions
      'kerala': 8, // Moderate - occasionally affected
      'kolkata': 12, // High - West Bengal coastal
      'chennai': 10, // Moderate-high - Tamil Nadu coastal
      'mumbai': 8, // Moderate - Maharashtra coastal
    };
    
    const regionLower = regionName.toLowerCase();
    for (const [key, risk] of Object.entries(cycloneProneStates)) {
      if (regionLower.includes(key)) {
        return risk;
      }
    }
    
    // Check if location is coastal (India's coastlines)
    const isCoastal = this.isCoastalArea(lat, lon);
    if (isCoastal) {
      return 5; // Low baseline for other coastal areas
    }
    
    return 0;
  }

  /**
   * Check if location is coastal
   */
  private isCoastalArea(lat: number, lon: number): boolean {
    // India's coastline roughly
    // West coast: lat 8-24, lon 68-75
    // East coast: lat 8-22, lon 77-88
    const isWestCoast = lat >= 8 && lat <= 24 && lon >= 68 && lon <= 75;
    const isEastCoast = lat >= 8 && lat <= 22 && lon >= 77 && lon <= 88;
    
    return isWestCoast || isEastCoast;
  }
}

