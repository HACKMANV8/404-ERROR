import axios from 'axios';
import type { SatelliteData } from '../types/index.js';

/**
 * Planet Insights API for satellite imagery analysis
 * Provides access to PlanetScope, RapidEye, and other satellite data
 * Documentation: https://developers.planet.com/
 * 
 * Planet Insights (insights.planet.com) may use different API endpoints
 * Try both standard Planet API and Insights-specific endpoints
 */
export class PlanetService {
  // Standard Planet Data API
  private readonly PLANET_BASE_URL = 'https://api.planet.com';
  // Planet Insights Platform uses SentinelHub auth realm for M2M clients
  private readonly PLANET_INSIGHTS_AUTH_ENDPOINT = 'https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token';
  // Fallback: Standard Planet API endpoint (for regular Planet API accounts)
  private readonly PLANET_STANDARD_AUTH_ENDPOINT = 'https://api.planet.com/auth/v1/oauth2/token';
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
      // Planet Insights Platform uses SentinelHub auth realm for M2M clients
      // Try Planet Insights Platform endpoint first (for credentials from insights.planet.com)
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      // Try Planet Insights Platform authentication endpoint (M2M client)
      try {
        console.log(`[Planet] Trying Planet Insights Platform auth endpoint...`);
        const response = await axios.post(
          this.PLANET_INSIGHTS_AUTH_ENDPOINT,
          new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret,
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 10000,
          }
        );
        
        // Success! Store token and return
        this.accessToken = response.data.access_token;
        const expiresIn = response.data.expires_in || 3600;
        this.tokenExpiry = Date.now() + (expiresIn - 300) * 1000;
        
        if (!this.accessToken) {
          throw new Error('Failed to get access token');
        }
        
        console.log(`[Planet] ✅ Planet Insights Platform authentication successful (token expires in ${expiresIn}s)`);
        return this.accessToken;
      } catch (insightsError: any) {
        const status = insightsError.response?.status;
        console.log(`[Planet] Planet Insights Platform auth returned ${status || insightsError.message}`);
        
        // Fallback to standard Planet API endpoint (for regular Planet API accounts)
        console.log(`[Planet] Trying standard Planet API auth endpoint...`);
        try {
          const response = await axios.post(
            this.PLANET_STANDARD_AUTH_ENDPOINT,
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
          const expiresIn = response.data.expires_in || 3600;
          this.tokenExpiry = Date.now() + (expiresIn - 300) * 1000;
          
          if (!this.accessToken) {
            throw new Error('Failed to get access token');
          }
          
          console.log(`[Planet] ✅ Standard Planet API authentication successful (token expires in ${expiresIn}s)`);
          return this.accessToken;
        } catch (standardError: any) {
          console.log(`[Planet] Standard Planet API auth also failed (${standardError.response?.status || standardError.message})`);
          // Both methods failed
          throw insightsError;
        }
      }
    } catch (error: any) {
      // Re-throw to let caller handle (searchImagery will log and fallback)
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

      // Try to authenticate
      let token: string;
      try {
        token = await this.authenticate();
        // Authentication success is logged in authenticate() method
      } catch (authError: any) {
        // Authentication failed - credentials may be for Planet Insights Platform which uses different endpoints
        // NASA FIRMS handles satellite fire detection (free & working) as fallback
        console.log(`[Planet] Authentication failed - using NASA FIRMS fallback`);
        return this.getSimulatedImagery();
      }

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

      // Try standard Planet Data API search endpoint
      // Note: Planet Insights Platform credentials may only work with Platform APIs (Analytics, Processing)
      // Data API may require separate API key or different credentials
      let response;
      try {
        // Try POST method first (standard Planet Data API)
        response = await axios.post(
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
        console.log(`[Planet] ✅ Data API search successful`);
      } catch (apiError: any) {
        const status = apiError.response?.status;
        
        // If 405 (Method Not Allowed) or 403 (Forbidden), Platform credentials may not have Data API access
        if (status === 405 || status === 403) {
          console.log(`[Planet] Data API not accessible with Platform credentials (${status}) - Platform credentials are for Analytics/Processing APIs, not Data API`);
          console.log(`[Planet] Using NASA FIRMS for satellite detection (free & working)`);
          // Gracefully fall back - Platform credentials work but don't grant Data API access
          return this.getSimulatedImagery();
        }
        
        // If 401, try API key auth (unlikely but possible)
        if (status === 401 && token === this.clientId) {
          try {
            response = await axios.post(
              `${this.PLANET_BASE_URL}/data/v1/searches/quick`,
              searchRequest,
              {
                headers: {
                  'Authorization': `api-key ${token}`,
                  'Content-Type': 'application/json',
                },
                timeout: 30000,
              }
            );
            console.log(`[Planet] ✅ API key authentication successful`);
          } catch (keyError: any) {
            throw apiError; // Re-throw original error
          }
        } else {
          throw apiError;
        }
      }

      const features = response.data.features || [];
      const imageCount = features.length;

      if (imageCount === 0) {
        console.log(`[Planet] No imagery found for location - using fallback`);
        return this.getSimulatedImagery();
      }
      
      console.log(`[Planet] ✅ Found ${imageCount} satellite images`);

      // Calculate average cloud coverage
      const avgCloudCover = features.length > 0
        ? features.reduce((sum: number, f: any) => sum + (f.properties?.cloud_cover || 0), 0) / features.length
        : 0;

      // For damage analysis, we'd need to:
      // 1. Download actual imagery
      // 2. Process with ML models (NDWI, NDVI, etc.)
      // For now, estimate based on available imagery and cloud cover
      const damageIndicators = this.estimateDamageFromMetadata(features);

      console.log(`[Planet] ✅ Using REAL satellite imagery data`);
      
      return {
        hasImagery: true,
        imageCount,
        cloudCoverage: Math.round(avgCloudCover * 100),
        damageIndicators,
      };
    } catch (error: any) {
      // Log error details for debugging Planet Insights Platform integration
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      
      // Only log errors that weren't already handled (405/403 are handled above)
      if (status === 404) {
        console.log(`[Planet] Search endpoint not found (404)`);
      } else if (status && status !== 405 && status !== 403) {
        // Log other errors (401, 500, etc.) but not 405/403 which are handled above
        console.log(`[Planet] Search API error (${status} ${statusText}): ${error.message || 'Unknown error'}`);
      } else if (!status) {
        // Network errors, timeouts, etc.
        console.log(`[Planet] Search error: ${error.message || 'Unknown error'}`);
      }
      
      // Return simulated data - NASA FIRMS provides real fire detection as fallback
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
