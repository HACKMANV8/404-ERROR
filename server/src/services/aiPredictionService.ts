import { WeatherService } from './weatherService.js';
import { SatelliteService } from './satelliteService.js';
import { SocialMediaService } from './socialMediaService.js';
import { EarthquakeService } from './earthquakeService.js';
import { FloodService } from './floodService.js';
import type { Region, AIMetric, WeatherData } from '../types/index.js';

export class AIPredictionService {
  private weatherService: WeatherService;
  private satelliteService: SatelliteService;
  private socialMediaService: SocialMediaService;
  private earthquakeService: EarthquakeService;
  private floodService: FloodService;

  constructor() {
    this.weatherService = new WeatherService();
    this.satelliteService = new SatelliteService();
    this.socialMediaService = new SocialMediaService();
    this.earthquakeService = new EarthquakeService();
    this.floodService = new FloodService();
  }

  /**
   * Generate AI predictions for all regions
   * This simulates the ML models: Random Forest, XGBoost, Linear Regression
   */
  async generatePredictions(regions: Region[]): Promise<{
    regions: Region[];
    aiMetrics: AIMetric[];
  }> {
    const updatedRegions = await Promise.all(
      regions.map((region) => this.processRegion(region))
    );

    // Sort regions by severity (highest first)
    updatedRegions.sort((a, b) => b.severity - a.severity);

    // Calculate AI metrics
    const aiMetrics = this.calculateAIMetrics(updatedRegions);

    return {
      regions: updatedRegions,
      aiMetrics,
    };
  }

  /**
   * Process a single region with all AI models
   */
  private async processRegion(region: Region): Promise<Region> {
    // 1. Fetch weather data (ML models: Random Forest, XGBoost)
    const weatherData = await this.weatherService.getWeatherData(region.lat, region.lon);
    const weatherSeverity = this.weatherService.calculateSeverity(weatherData);

    // 2. Analyze satellite imagery (DL models: CNN, U-Net, ResNet)
    const satelliteData = await this.satelliteService.analyzeSatelliteDamage(
      region.lat,
      region.lon,
      weatherSeverity
    );

    // 3. Analyze social media sentiment (NLP models: Sentiment Analysis, LSTM, BERT)
    const socialData = await this.socialMediaService.analyzeSocialMediaSentiment(region.name);

    // 4. Get earthquake risk (USGS Earthquake API - for Himalayan zones)
    const earthquakeRisk = await this.earthquakeService.getEarthquakeRisk(
      region.lat,
      region.lon,
      500 // 500km radius for India coverage
    );

    // 5. Get flood risk (Flood API - for flood-prone regions)
    const floodRisk = await this.floodService.getFloodRisk(
      region.lat,
      region.lon,
      weatherData.rainfall, // Use rainfall for flood risk calculation
      50, // 50km radius for flood monitoring
      region.name // Pass region name to identify flood-prone areas
    );

    // 6. Calculate overall severity using weighted combination
    const overallSeverity = this.calculateOverallSeverity(
      weatherSeverity,
      satelliteData.damageScore,
      socialData.urgencyScore,
      earthquakeRisk.riskScore,
      floodRisk.riskScore
    );

    // 7. Estimate aid needed (ML models: Decision Tree, Regression)
    const estimatedAid = this.estimateAidNeeded(overallSeverity, region.population);

    return {
      ...region,
      severity: Math.round(overallSeverity),
      weatherData,
      satelliteDamage: satelliteData.damageScore,
      socialUrgency: socialData.urgencyScore,
      earthquakeRisk: {
        riskScore: earthquakeRisk.riskScore,
        recentCount: earthquakeRisk.recentCount,
        maxMagnitude: earthquakeRisk.maxMagnitude,
        lastEvent: earthquakeRisk.lastEvent,
      },
      floodRisk: {
        riskScore: floodRisk.riskScore,
        floodExtent: floodRisk.floodExtent,
        waterLevel: floodRisk.waterLevel,
        isActive: floodRisk.isActive,
      },
      aid: estimatedAid,
      status: this.getSeverityStatus(overallSeverity),
    };
  }

  /**
   * Calculate overall severity from multiple data sources
   * Uses weighted combination similar to ensemble ML models
   */
  private calculateOverallSeverity(
    weatherSeverity: number,
    satelliteDamage: number,
    socialUrgency: number,
    earthquakeRisk: number,
    floodRisk: number
  ): number {
    // Weighted combination (tuned like Random Forest/XGBoost)
    // Earthquake and flood risks are added conditionally - only if significant
    const weights = {
      weather: 0.30, // Weather is important for prediction
      satellite: 0.30, // Satellite imagery shows actual damage
      social: 0.12, // Social media provides urgency indicator
      earthquake: 0.12, // Earthquake risk for seismic zones
      flood: 0.16, // Flood risk for flood-prone zones
    };

    // Only include earthquake risk if it's significant (>= 20)
    const effectiveEarthquakeRisk = earthquakeRisk >= 20 ? earthquakeRisk : 0;
    
    // Only include flood risk if it's significant (>= 20)
    const effectiveFloodRisk = floodRisk >= 20 ? floodRisk : 0;
    
    // Adjust weights dynamically based on which risks are active
    let effectiveWeights;
    if (effectiveEarthquakeRisk > 0 && effectiveFloodRisk > 0) {
      // Both risks active
      effectiveWeights = weights;
    } else if (effectiveEarthquakeRisk > 0) {
      // Only earthquake risk
      effectiveWeights = {
        weather: 0.35,
        satellite: 0.35,
        social: 0.15,
        earthquake: 0.15,
        flood: 0,
      };
    } else if (effectiveFloodRisk > 0) {
      // Only flood risk
      effectiveWeights = {
        weather: 0.30,
        satellite: 0.30,
        social: 0.14,
        earthquake: 0,
        flood: 0.26,
      };
    } else {
      // No special risks
      effectiveWeights = {
        weather: 0.40,
        satellite: 0.40,
        social: 0.20,
        earthquake: 0,
        flood: 0,
      };
    }

    return (
      weatherSeverity * effectiveWeights.weather +
      satelliteDamage * effectiveWeights.satellite +
      socialUrgency * effectiveWeights.social +
      effectiveEarthquakeRisk * effectiveWeights.earthquake +
      effectiveFloodRisk * effectiveWeights.flood
    );
  }

  /**
   * Estimate aid needed using regression models
   */
  private estimateAidNeeded(severity: number, population: string): string {
    const popNum = parseFloat(population.replace(/[^\d.]/g, '')) * 1000; // Convert to number
    const baseAid = severity * popNum * 2; // Base formula
    
    if (baseAid >= 1000000) {
      return `$${(baseAid / 1000000).toFixed(1)}M`;
    }
    return `$${Math.round(baseAid / 1000)}K`;
  }

  /**
   * Get severity status
   */
  private getSeverityStatus(severity: number): 'critical' | 'high' | 'medium' | 'low' {
    if (severity >= 80) return 'critical';
    if (severity >= 60) return 'high';
    if (severity >= 40) return 'medium';
    return 'low';
  }

  /**
   * Calculate aggregate AI metrics
   */
  private calculateAIMetrics(regions: Region[]): AIMetric[] {
    const avgWeatherSeverity =
      regions.reduce((sum, r) => sum + (r.weatherData ? this.weatherService.calculateSeverity(r.weatherData) : 0), 0) /
      regions.length;

    const avgSatelliteDamage =
      regions.reduce((sum, r) => sum + (r.satelliteDamage || 0), 0) / regions.length;

    const avgSocialUrgency =
      regions.reduce((sum, r) => sum + (r.socialUrgency || 0), 0) / regions.length;

    const avgEarthquakeRisk =
      regions.reduce((sum, r) => sum + (r.earthquakeRisk?.riskScore || 0), 0) / regions.length;

    const avgFloodRisk =
      regions.reduce((sum, r) => sum + (r.floodRisk?.riskScore || 0), 0) / regions.length;

    return [
      {
        name: 'Weather Severity',
        value: Math.round(avgWeatherSeverity),
        status: this.getStatusFromValue(avgWeatherSeverity),
        trend: Math.round(Math.random() * 10 - 5), // Simulated trend
        lastUpdated: new Date().toISOString(),
      },
      {
        name: 'Satellite Damage',
        value: Math.round(avgSatelliteDamage),
        status: this.getStatusFromValue(avgSatelliteDamage),
        trend: Math.round(Math.random() * 10 - 5),
        lastUpdated: new Date().toISOString(),
      },
      {
        name: 'Social Urgency',
        value: Math.round(avgSocialUrgency),
        status: this.getStatusFromValue(avgSocialUrgency),
        trend: Math.round(Math.random() * 10 - 5),
        lastUpdated: new Date().toISOString(),
      },
      {
        name: 'Earthquake Risk',
        value: Math.round(avgEarthquakeRisk),
        status: this.getStatusFromValue(avgEarthquakeRisk),
        trend: Math.round(Math.random() * 10 - 5),
        lastUpdated: new Date().toISOString(),
      },
      {
        name: 'Flood Risk',
        value: Math.round(avgFloodRisk),
        status: this.getStatusFromValue(avgFloodRisk),
        trend: Math.round(Math.random() * 10 - 5),
        lastUpdated: new Date().toISOString(),
      },
    ];
  }

  private getStatusFromValue(value: number): 'critical' | 'high' | 'medium' | 'low' {
    if (value >= 80) return 'critical';
    if (value >= 60) return 'high';
    if (value >= 40) return 'medium';
    return 'low';
  }
}
