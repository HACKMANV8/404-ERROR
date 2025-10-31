import type { WeatherData } from '../types/index.js';

/**
 * Drought and heatwave risk assessment
 * Based on IMD (India Meteorological Department) standards
 */
export interface DroughtHeatwaveRisk {
  droughtRisk: number; // 0-100
  heatwaveRisk: number; // 0-100
  combinedRisk: number; // 0-100 (overall risk)
  temperature: number; // Current temperature in °C
  humidity: number; // Current humidity %
  rainfallDeficit: number; // Rainfall deficit in mm (negative = deficit)
  heatwaveCategory: 'Normal' | 'Heat Wave' | 'Severe Heat Wave' | 'Extreme Heat Wave' | 'None';
  droughtSeverity: 'Normal' | 'Mild' | 'Moderate' | 'Severe' | 'Extreme';
  isHeatwaveActive: boolean;
  isDroughtActive: boolean;
  lastUpdate: string;
}

/**
 * Drought and Heatwave Monitoring Service
 * Detects drought conditions and heatwaves using real-time weather data
 * Based on IMD (India Meteorological Department) classification standards
 * 
 * IMD Heatwave Classification:
 * - Heat Wave: Max temp ≥40°C (plains) or ≥37°C (coastal) or ≥30°C (hills)
 *   AND departure from normal ≥4.5°C
 * - Severe Heat Wave: Max temp ≥47°C (any region)
 *   OR (Heat Wave condition + departure ≥6.5°C)
 * - Extreme Heat Wave: Severe Heat Wave + departure ≥6.5°C
 * 
 * Drought Classification (based on rainfall deficit):
 * - Normal: Rainfall within normal range
 * - Mild: 26-50% deficit
 * - Moderate: 51-75% deficit
 * - Severe: 76-99% deficit
 * - Extreme: 100% deficit (no rain)
 */
export class DroughtHeatwaveService {
  /**
   * Get drought and heatwave risk from weather data
   * Uses real-time weather data from OpenWeatherMap
   */
  async getDroughtHeatwaveRisk(
    weatherData: WeatherData,
    lat: number,
    lon: number,
    regionName?: string,
    historicalAvgRainfall?: number // Optional: historical average rainfall for region
  ): Promise<DroughtHeatwaveRisk> {
    const temperature = weatherData.temperature;
    const humidity = weatherData.humidity;
    const rainfall = weatherData.rainfall;
    
    // Calculate heatwave risk
    const { heatwaveRisk, category } = this.calculateHeatwaveRisk(
      temperature,
      humidity,
      lat,
      lon
    );
    
    // Calculate drought risk
    // For now, use current rainfall vs. expected baseline (simplified)
    // In production, you'd compare with historical averages over weeks/months
    const expectedRainfall = this.getExpectedRainfall(lat, lon, regionName);
    const rainfallDeficit = expectedRainfall - rainfall; // Positive = deficit
    const { droughtRisk, severity } = this.calculateDroughtRisk(
      rainfall,
      rainfallDeficit,
      regionName || ''
    );
    
    // Combined risk (weighted: 60% heatwave, 40% drought)
    const combinedRisk = (heatwaveRisk * 0.6) + (droughtRisk * 0.4);
    
    const isHeatwaveActive = heatwaveRisk >= 30 || category !== 'Normal';
    const isDroughtActive = droughtRisk >= 30 || severity !== 'Normal';
    
    console.log(`[Drought/Heatwave] Using REAL weather data - Temp: ${temperature}°C, Rain: ${rainfall}mm, Heatwave Risk: ${Math.round(heatwaveRisk)}%, Drought Risk: ${Math.round(droughtRisk)}%`);
    
    return {
      droughtRisk: Math.round(droughtRisk),
      heatwaveRisk: Math.round(heatwaveRisk),
      combinedRisk: Math.round(combinedRisk),
      temperature: Math.round(temperature),
      humidity: Math.round(humidity),
      rainfallDeficit: Math.round(rainfallDeficit * 10) / 10,
      heatwaveCategory: category,
      droughtSeverity: severity,
      isHeatwaveActive,
      isDroughtActive,
      lastUpdate: weatherData.timestamp,
    };
  }

  /**
   * Calculate heatwave risk based on IMD standards
   */
  private calculateHeatwaveRisk(
    temperature: number,
    humidity: number,
    lat: number,
    lon: number
  ): { heatwaveRisk: number; category: DroughtHeatwaveRisk['heatwaveCategory'] } {
    // Determine region type for IMD thresholds
    const isHillStation = lat >= 28.0 && lat <= 35.0; // Rough approximation for hilly regions
    const isCoastal = this.isCoastalArea(lat, lon);
    
    // IMD Heatwave thresholds:
    // Plains: ≥40°C
    // Coastal: ≥37°C
    // Hills: ≥30°C
    
    const threshold = isHillStation ? 30 : (isCoastal ? 37 : 40);
    
    // Heat Index calculation (feels-like temperature considering humidity)
    // Formula: HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (RH * 0.094))
    // Simplified for Celsius: approximate heat index
    const heatIndex = temperature + (humidity > 40 ? (humidity - 40) * 0.1 : 0);
    
    let risk = 0;
    let category: DroughtHeatwaveRisk['heatwaveCategory'] = 'Normal';
    
    // Extreme heatwave (≥47°C or heat index equivalent)
    if (temperature >= 47 || heatIndex >= 50) {
      risk = 100;
      category = 'Extreme Heat Wave';
    }
    // Severe heatwave (≥45°C or high heat index)
    else if (temperature >= 45 || heatIndex >= 45) {
      risk = 85;
      category = 'Severe Heat Wave';
    }
    // Heatwave (above threshold + high heat index)
    else if (temperature >= threshold + 4.5 || (temperature >= threshold && heatIndex >= threshold + 6)) {
      risk = 60;
      category = 'Heat Wave';
    }
    // Approaching heatwave (close to threshold)
    else if (temperature >= threshold - 2) {
      risk = 30;
      category = 'Heat Wave';
    }
    // Warm conditions
    else if (temperature >= 35) {
      risk = 15;
    }
    // Moderate temperature
    else if (temperature >= 30) {
      risk = 5;
    }
    
    // Humidity adjustment (low humidity + high temp = more dangerous)
    if (temperature >= threshold && humidity < 30) {
      risk = Math.min(100, risk + 10);
    }
    
    return { heatwaveRisk: Math.min(100, risk), category };
  }

  /**
   * Calculate drought risk based on rainfall deficit
   */
  private calculateDroughtRisk(
    currentRainfall: number,
    rainfallDeficit: number,
    regionName: string
  ): { droughtRisk: number; severity: DroughtHeatwaveRisk['droughtSeverity'] } {
    // Get baseline for drought-prone regions
    const baselineRisk = this.getDroughtBaselineRisk(regionName);
    
    // Calculate current deficit percentage (simplified - would need historical averages)
    // For now, use current rainfall vs expected seasonal rainfall
    const expectedRainfall = baselineRisk > 0 ? 50 : 30; // Simplified baseline
    const deficitPercent = expectedRainfall > 0 
      ? ((expectedRainfall - currentRainfall) / expectedRainfall) * 100 
      : 0;
    
    let risk = 0;
    let severity: DroughtHeatwaveRisk['droughtSeverity'] = 'Normal';
    
    // Extreme drought (100% deficit - no rain)
    if (currentRainfall === 0 && rainfallDeficit >= 50) {
      risk = 90;
      severity = 'Extreme';
    }
    // Severe drought (76-99% deficit)
    else if (deficitPercent >= 76) {
      risk = 75;
      severity = 'Severe';
    }
    // Moderate drought (51-75% deficit)
    else if (deficitPercent >= 51) {
      risk = 55;
      severity = 'Moderate';
    }
    // Mild drought (26-50% deficit)
    else if (deficitPercent >= 26) {
      risk = 35;
      severity = 'Mild';
    }
    // Normal rainfall
    else {
      risk = 0;
      severity = 'Normal';
    }
    
    // Add baseline risk for drought-prone regions (even with some rain)
    if (baselineRisk > 0 && risk < baselineRisk) {
      risk = Math.max(risk, baselineRisk);
    }
    
    return { droughtRisk: Math.min(100, risk), severity };
  }

  /**
   * Get baseline drought risk for known drought-prone states
   */
  private getDroughtBaselineRisk(regionName: string): number {
    const droughtProneStates: { [key: string]: number } = {
      'rajasthan': 25, // Very high - desert state
      'gujarat': 20, // High - arid regions
      'maharashtra': 15, // Moderate-high - Marathwada region
      'telangana': 18, // High - frequent droughts
      'andhra pradesh': 15, // Moderate-high - Rayalaseema region
    };
    
    const regionLower = regionName.toLowerCase();
    for (const [key, risk] of Object.entries(droughtProneStates)) {
      if (regionLower.includes(key)) {
        return risk;
      }
    }
    
    return 0;
  }

  /**
   * Get expected rainfall for region (simplified baseline)
   * In production, this would query historical weather data
   */
  private getExpectedRainfall(lat: number, lon: number, regionName?: string): number {
    // Simplified: return baseline expected rainfall
    // Drought-prone regions have lower expected rainfall
    const baselineRisk = regionName ? this.getDroughtBaselineRisk(regionName) : 0;
    
    if (baselineRisk > 0) {
      return 20; // Lower expected for drought-prone regions
    }
    
    // Coastal regions expect more rainfall
    if (this.isCoastalArea(lat, lon)) {
      return 60;
    }
    
    // Default expected rainfall
    return 40;
  }

  /**
   * Check if location is coastal
   */
  private isCoastalArea(lat: number, lon: number): boolean {
    const isWestCoast = lat >= 8 && lat <= 24 && lon >= 68 && lon <= 75;
    const isEastCoast = lat >= 8 && lat <= 22 && lon >= 77 && lon <= 88;
    return isWestCoast || isEastCoast;
  }
}

