import type { SatelliteData } from '../types/index.js';
import { NASAFirmsService } from './nasaFirmsService.js';
import { SentinelHubService } from './sentinelHubService.js';
import { PlanetService } from './planetService.js';

export class SatelliteService {
  private nasaFirmsService: NASAFirmsService;
  private sentinelHubService: SentinelHubService;
  private planetService: PlanetService;

  constructor() {
    this.nasaFirmsService = new NASAFirmsService();
    this.sentinelHubService = new SentinelHubService();
    this.planetService = new PlanetService();
  }

  /**
   * Analyze satellite imagery to detect damage using real APIs
   * Combines NASA FIRMS (fire/flood detection) + SentinelHub (imagery analysis)
   */
  async analyzeSatelliteDamage(
    lat: number,
    lon: number,
    weatherSeverity: number
  ): Promise<SatelliteData> {
    try {
      // Get data from multiple sources
      const [firmsData, planetImageryData, sentinelImageryData] = await Promise.allSettled([
        // 1. NASA FIRMS - Fire and flood detection (FREE, no API key needed)
        this.nasaFirmsService.getActiveEvents(lat, lon, 50), // 50km radius
        
        // 2. Planet Insights - Satellite imagery analysis (requires credentials)
        this.planetService.searchImagery(
          lat,
          lon,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          new Date() // Today
        ),
        
        // 3. SentinelHub - Alternative satellite imagery (optional)
        this.sentinelHubService.getSatelliteImagery(
          lat,
          lon,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          new Date() // Today
        ),
      ]);

      let damageScore = 0;
      let affectedArea = 0;
      let confidence = 50;
      const sources = [];

      // Process NASA FIRMS data (fire/flood events)
      if (firmsData.status === 'fulfilled') {
        const events = firmsData.value.events;
        const eventDamage = this.nasaFirmsService.calculateDamageFromEvents(events, 50);
        
        if (eventDamage > 0) {
          damageScore = Math.max(damageScore, eventDamage);
          affectedArea = events.length * 5; // Estimate 5km² per event
          confidence = Math.min(95, confidence + 20);
          sources.push('NASA FIRMS');
        }
      }

      // Process Planet Insights imagery data (preferred if available)
      if (planetImageryData.status === 'fulfilled' && planetImageryData.value.hasImagery) {
        const imageryDamage = this.planetService.calculateDamageFromImagery(
          planetImageryData.value.damageIndicators
        );
        
        if (imageryDamage > 0) {
          damageScore = Math.max(damageScore, imageryDamage);
          affectedArea = Math.max(affectedArea, imageryDamage * 2);
          confidence = Math.min(95, confidence + 25);
          sources.push('Planet Insights');
        }
      }

      // Process SentinelHub imagery data (fallback)
      if (sentinelImageryData.status === 'fulfilled' && sentinelImageryData.value.hasImagery) {
        const imageryDamage = this.sentinelHubService.calculateDamageFromImagery(
          sentinelImageryData.value.damageIndicators
        );
        
        if (imageryDamage > 0 && !sources.includes('Planet Insights')) {
          damageScore = Math.max(damageScore, imageryDamage);
          affectedArea = Math.max(affectedArea, imageryDamage * 2);
          confidence = Math.min(95, confidence + 25);
          sources.push('SentinelHub');
        }
      }

      // If no real data available, use weather-based estimation with lower confidence
      if (damageScore === 0) {
        damageScore = Math.min(100, weatherSeverity * 1.2 + Math.random() * 20 - 10);
        affectedArea = damageScore * 50;
        confidence = 60; // Lower confidence for weather-based estimation
        sources.push('Weather-based estimation');
      } else {
        // Combine multiple sources if available
        damageScore = Math.min(100, damageScore + (weatherSeverity * 0.1));
      }

      return {
        damageScore: Math.round(Math.max(0, Math.min(100, damageScore))),
        affectedArea: Math.round(affectedArea),
        confidence: Math.round(confidence),
        timestamp: new Date().toISOString(),
        sources: sources.length > 0 ? sources : ['Simulated'],
      };
    } catch (error) {
      console.error('Error in satellite damage analysis:', error);
      // Fallback to weather-based estimation
      const baseDamage = Math.min(100, weatherSeverity * 1.2 + Math.random() * 20 - 10);
      return {
        damageScore: Math.round(Math.max(0, Math.min(100, baseDamage))),
        affectedArea: Math.round(baseDamage * 50),
        confidence: 50,
        timestamp: new Date().toISOString(),
        sources: ['Fallback'],
      };
    }
  }

  /**
   * Fetch satellite imagery for a region
   */
  async fetchSatelliteImagery(lat: number, lon: number): Promise<any> {
    try {
      const imagery = await this.sentinelHubService.getSatelliteImagery(
        lat,
        lon,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        new Date()
      );

      return {
        lat,
        lon,
        hasImagery: imagery.hasImagery,
        damageIndicators: imagery.damageIndicators,
        imageUrl: imagery.imageUrl,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching satellite imagery:', error);
      return {
        lat,
        lon,
        hasImagery: false,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
