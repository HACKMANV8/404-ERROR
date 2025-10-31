import axios from 'axios';
import type { SatelliteData } from '../types/index.js';

/**
 * Planet Insights API for satellite imagery analysis
 * Provides access to PlanetScope, RapidEye, and other satellite data
 * Documentation: https://developers.planet.com/
 */
export class PlanetService {
  private readonly PLANET_BASE_URL = 'https://api.planet.com';
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.PLANET_CLIENT_ID || '';
    this.clientSecret = process.env.PLANET_CLIENT_SECRET || '';
  }

  /**
   * Authenticate with Planet API using OAuth2 Client Credentials
   */
  private async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Planet credentials not configured');
    }

    try {
      // Planet uses Basic Auth for token exchange
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        `${this.PLANET_BASE_URL}/auth/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );

      this.accessToken = response.data.access_token;
      // Token expires in ~1 hour, refresh 5 minutes early
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      if (!this.accessToken) {
        throw new Error('Failed to get access token');
      }

      return this.accessToken;
    } catch (error: any) {
      console.error('Error authenticating with Planet API:', error.message || error);
      throw error;
    }
  }

  /**
   * Search for satellite imagery in a location
   */
  async searchImagery(lat: number, lon: number, startDate: Date, endDate: Date): Promise<{
    hasImagery: boolean;
    imageCount: number;
    cloudCoverage: number;
    damageIndicators: {
      waterLevel: number;
      vegetationLoss: number;
      infrastructureDamage: number;
    };
  }> {
    try {
      if (!this.clientId || !this.clientSecret) {
        return this.getSimulatedImagery();
      }

      const token = await this.authenticate();

      // Create geometry for search (point with small buffer)
      const geometry = {
        type: 'Point',
        coordinates: [lon, lat],
      };

      // Search for PlanetScope imagery (3-5m resolution)
      const searchRequest = {
        item_types: ['PSScene'],
        filter: {
          type: 'AndFilter',
          config: [
            {
              type: 'GeometryFilter',
              field_name: 'geometry',
              config: {
                type: 'Point',
                coordinates: [lon, lat],
              },
            },
            {
              type: 'DateRangeFilter',
              field_name: 'acquired',
              config: {
                gte: startDate.toISOString(),
                lte: endDate.toISOString(),
              },
            },
            {
              type: 'RangeFilter',
              field_name: 'cloud_cover',
              config: {
                lte: 0.3, // Max 30% cloud coverage
              },
            },
          ],
        },
      };

      const response = await axios.post(
        `${this.PLANET_BASE_URL}/data/v1/searches/quick`,
        searchRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const features = response.data.features || [];
      const imageCount = features.length;

      if (imageCount === 0) {
        return this.getSimulatedImagery();
      }

      // Calculate average cloud coverage
      const avgCloudCover = features.length > 0
        ? features.reduce((sum: number, f: any) => sum + (f.properties?.cloud_cover || 0), 0) / features.length
        : 0;

      // For damage analysis, we'd need to:
      // 1. Download actual imagery
      // 2. Process with ML models (NDWI, NDVI, etc.)
      // For now, estimate based on available imagery and cloud cover
      const damageIndicators = this.estimateDamageFromMetadata(features);

      return {
        hasImagery: true,
        imageCount,
        cloudCoverage: Math.round(avgCloudCover * 100),
        damageIndicators,
      };
    } catch (error: any) {
      console.error('Error searching Planet imagery:', error.message || error);
      return this.getSimulatedImagery();
    }
  }

  /**
   * Estimate damage from imagery metadata
   * In production, would analyze actual images
   */
  private estimateDamageFromMetadata(features: any[]): {
    waterLevel: number;
    vegetationLoss: number;
    infrastructureDamage: number;
  } {
    // This is a simplified estimation
    // In production, would download and analyze actual images
    const recentCount = features.filter((f: any) => {
      const date = new Date(f.properties?.acquired || 0);
      return Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000; // Last 7 days
    }).length;

    // More recent images = potential ongoing issues
    const activityScore = Math.min(100, recentCount * 10);

    return {
      waterLevel: activityScore * 0.4, // Estimate flood extent
      vegetationLoss: activityScore * 0.3, // Estimate vegetation damage
      infrastructureDamage: activityScore * 0.3, // Estimate infrastructure damage
    };
  }

  /**
   * Calculate damage score from imagery indicators
   */
  calculateDamageFromImagery(indicators: {
    waterLevel: number;
    vegetationLoss: number;
    infrastructureDamage: number;
  }): number {
    // Weighted combination
    const waterWeight = 0.4;
    const vegetationWeight = 0.3;
    const infrastructureWeight = 0.3;

    return Math.min(
      100,
      indicators.waterLevel * waterWeight +
      indicators.vegetationLoss * vegetationWeight +
      indicators.infrastructureDamage * infrastructureWeight
    );
  }

  /**
   * Fallback to simulated imagery
   */
  private getSimulatedImagery() {
    return {
      hasImagery: false,
      imageCount: 0,
      cloudCoverage: 0,
      damageIndicators: {
        waterLevel: 0,
        vegetationLoss: 0,
        infrastructureDamage: 0,
      },
    };
  }
}
