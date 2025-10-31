import { WeatherService } from './weatherService.js';
import { SatelliteService } from './satelliteService.js';
import { SocialMediaService } from './socialMediaService.js';
import type { Region, AIMetric, WeatherData } from '../types/index.js';

export class AIPredictionService {
  private weatherService: WeatherService;
  private satelliteService: SatelliteService;
  private socialMediaService: SocialMediaService;

  constructor() {
    this.weatherService = new WeatherService();
    this.satelliteService = new SatelliteService();
    this.socialMediaService = new SocialMediaService();
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

    // 4. Calculate overall severity using weighted combination
    const overallSeverity = this.calculateOverallSeverity(
      weatherSeverity,
      satelliteData.damageScore,
      socialData.urgencyScore
    );

    // 5. Estimate aid needed (ML models: Decision Tree, Regression)
    const estimatedAid = this.estimateAidNeeded(overallSeverity, region.population);

    return {
      ...region,
      severity: Math.round(overallSeverity),
      weatherData,
      satelliteDamage: satelliteData.damageScore,
      socialUrgency: socialData.urgencyScore,
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
    socialUrgency: number
  ): number {
    // Weighted combination (tuned like Random Forest/XGBoost)
    const weights = {
      weather: 0.4, // Weather is most important for prediction
      satellite: 0.4, // Satellite imagery shows actual damage
      social: 0.2, // Social media provides urgency indicator
    };

    return (
      weatherSeverity * weights.weather +
      satelliteDamage * weights.satellite +
      socialUrgency * weights.social
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
    ];
  }

  private getStatusFromValue(value: number): 'critical' | 'high' | 'medium' | 'low' {
    if (value >= 80) return 'critical';
    if (value >= 60) return 'high';
    if (value >= 40) return 'medium';
    return 'low';
  }
}
