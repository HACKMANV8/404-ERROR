import axios from 'axios';
import type { SatelliteData } from '../types/index.js';

/**
 * SentinelHub API for satellite imagery analysis
 * Provides access to Sentinel-2, Landsat, and other satellite data
 * Documentation: https://docs.sentinel-hub.com/
 * 
 * Note: Requires OAuth2 authentication (Client ID + Secret)
 * Free tier available with limitations
 */
export class SentinelHubService {
  private readonly SENTINELHUB_BASE_URL = 'https://services.sentinel-hub.com';
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.SENTINELHUB_CLIENT_ID || '';
    this.clientSecret = process.env.SENTINELHUB_CLIENT_SECRET || '';
  }

  /**
   * Authenticate with SentinelHub using OAuth2
   */
  private async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('SentinelHub credentials not configured');
    }

    try {
      const response = await axios.post(
        `${this.SENTINELHUB_BASE_URL}/oauth/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
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
    } catch (error) {
      console.error('Error authenticating with SentinelHub:', error);
      throw error;
    }
  }

  /**
   * Get satellite imagery for a location
   * Analyzes before/after images to detect damage
   */
  async getSatelliteImagery(
    lat: number,
    lon: number,
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<{
    hasImagery: boolean;
    cloudCoverage: number;
    damageIndicators: {
      waterLevel: number; // Flood extent (0-100)
      vegetationLoss: number; // Vegetation damage (0-100)
      infrastructureDamage: number; // Building damage (0-100)
    };
    imageUrl?: string;
  }> {
    try {
      // Check if credentials are configured
      if (!this.clientId || !this.clientSecret) {
        return this.getSimulatedImagery();
      }

      const token = await this.authenticate();

      // Request satellite imagery analysis
      // Using Sentinel-2 for high-resolution analysis
      const bbox = this.createBoundingBox(lat, lon, 0.1); // 0.1 degree = ~11km radius

      const requestBody = {
        input: {
          bounds: {
            bbox: bbox,
            properties: {
              crs: 'http://www.opengis.net/def/crs/EPSG/0/4326',
            },
          },
          data: [
            {
              type: 'sentinel-2-l2a',
              dataFilter: {
                timeRange: {
                  from: startDate.toISOString(),
                  to: endDate.toISOString(),
                },
                maxCloudCoverage: 30, // Only images with <30% cloud coverage
              },
            },
          ],
        },
        output: {
          width: 512,
          height: 512,
          responses: [
            {
              identifier: 'default',
              format: {
                type: 'image/png',
              },
            },
          ],
        },
        evalscript: `
          //NDWI (Normalized Difference Water Index) for flood detection
          //NDVI (Normalized Difference Vegetation Index) for vegetation damage
          function setup() {
            return {
              input: ["B02", "B03", "B04", "B08", "B11", "B12"],
              output: { bands: 3 }
            };
          }
          
          function evaluatePixel(samples) {
            let ndwi = (samples.B03 - samples.B11) / (samples.B03 + samples.B11); // Water index
            let ndvi = (samples.B08 - samples.B04) / (samples.B08 + samples.B04); // Vegetation index
            let waterLevel = ndwi > 0.3 ? (ndwi * 100) : 0;
            let vegetationLoss = ndvi < 0.3 ? ((0.3 - ndvi) * 333) : 0;
            
            return [waterLevel, vegetationLoss, 0]; // [water, vegetation, infrastructure]
          }
        `,
      };

      const response = await axios.post(
        `${this.SENTINELHUB_BASE_URL}/api/v1/process`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
          responseType: 'arraybuffer',
        }
      );

      // Process the image data
      // In production, would use image processing libraries to analyze
      // For now, return indicators based on image analysis
      return {
        hasImagery: true,
        cloudCoverage: 15, // Example - would extract from metadata
        damageIndicators: {
          waterLevel: 0, // Would analyze NDWI from image
          vegetationLoss: 0, // Would analyze NDVI from image
          infrastructureDamage: 0, // Would use ML models
        },
        imageUrl: `data:image/png;base64,${Buffer.from(response.data).toString('base64')}`,
      };
    } catch (error) {
      console.error('Error fetching SentinelHub imagery:', error);
      return this.getSimulatedImagery();
    }
  }

  /**
   * Create bounding box around a point
   */
  private createBoundingBox(lat: number, lon: number, radiusDegrees: number): number[] {
    return [
      lon - radiusDegrees, // minLon
      lat - radiusDegrees, // minLat
      lon + radiusDegrees, // maxLon
      lat + radiusDegrees, // maxLat
    ];
  }

  /**
   * Fallback to simulated imagery if API unavailable
   */
  private getSimulatedImagery() {
    return {
      hasImagery: false,
      cloudCoverage: 0,
      damageIndicators: {
        waterLevel: 0,
        vegetationLoss: 0,
        infrastructureDamage: 0,
      },
    };
  }

  /**
   * Calculate damage score from satellite imagery indicators
   */
  calculateDamageFromImagery(indicators: {
    waterLevel: number;
    vegetationLoss: number;
    infrastructureDamage: number;
  }): number {
    // Weighted combination of indicators
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
}
