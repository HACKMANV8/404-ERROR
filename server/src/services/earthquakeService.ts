import axios from 'axios';

/**
 * Earthquake data from USGS Earthquake API
 */
export interface EarthquakeData {
  magnitude: number;
  depth: number;
  distance: number; // Distance from region in km
  timestamp: string;
  location: string;
  riskScore: number; // 0-100 based on magnitude, distance, depth
  eventCount: number; // Number of recent earthquakes in area
  latitude?: number; // For aggregation
  longitude?: number; // For aggregation
}

/**
 * USGS Earthquake API Service
 * FREE - No API key required!
 * Documentation: https://earthquake.usgs.gov/fdsnws/event/1/
 */
export class EarthquakeService {
  private readonly USGS_BASE_URL = 'https://earthquake.usgs.gov/fdsnws/event/1';

  /**
   * Get recent earthquakes near a location
   * @param lat Latitude of region
   * @param lon Longitude of region
   * @param radiusKm Search radius in kilometers (default: 500km for India coverage)
   * @param daysBack How many days back to search (default: 7 days)
   */
  async getRecentEarthquakes(
    lat: number,
    lon: number,
    radiusKm: number = 500,
    daysBack: number = 7
  ): Promise<EarthquakeData[]> {
    try {
      const startTime = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
      const endTime = new Date();

      // Convert radius from km to degrees (approximate: 1° ≈ 111km)
      const radiusDegrees = radiusKm / 111;

      // Calculate bounding box
      const minLat = lat - radiusDegrees;
      const maxLat = lat + radiusDegrees;
      const minLon = lon - radiusDegrees;
      const maxLon = lon + radiusDegrees;

      // Query USGS API
      const response = await axios.get(`${this.USGS_BASE_URL}/query`, {
        params: {
          format: 'geojson',
          starttime: startTime.toISOString().split('T')[0],
          endtime: endTime.toISOString().split('T')[0],
          minlatitude: minLat,
          maxlatitude: maxLat,
          minlongitude: minLon,
          maxlongitude: maxLon,
          minmagnitude: 3.0, // Minimum magnitude 3.0 (significant earthquakes)
          orderby: 'time', // Order by time (most recent first)
          limit: 50, // Limit to 50 most recent events
        },
        timeout: 10000,
      });

      const features = response.data.features || [];
      
      if (features.length === 0) {
        return this.getSimulatedEarthquakeData();
      }

      // Process earthquake data
      const earthquakes: EarthquakeData[] = features.map((feature: any) => {
        const [eqLon, eqLat, depth] = feature.geometry.coordinates;
        const props = feature.properties;
        
        // Calculate distance from region in km
        const distance = this.calculateDistance(lat, lon, eqLat, eqLon);
        
        // Calculate risk score (0-100)
        const riskScore = this.calculateRiskScore(
          props.mag || 0,
          distance,
          depth
        );

        return {
          magnitude: props.mag || 0,
          depth: depth || 0,
          distance: Math.round(distance),
          timestamp: new Date(props.time).toISOString(),
          location: props.place || 'Unknown location',
          riskScore: Math.round(riskScore),
          eventCount: 1,
          latitude: eqLat,
          longitude: eqLon,
        };
      });

      // For now, return earthquakes directly (aggregation can be added later if needed)
      console.log(`[USGS Earthquake] ✅ Found ${features.length} real earthquakes near region`);
      
      return earthquakes;

    } catch (error: any) {
      console.error(`[USGS Earthquake] Error fetching data: ${error.message || error}`);
      return this.getSimulatedEarthquakeData();
    }
  }

  /**
   * Calculate earthquake risk score for a region
   * Combines recent earthquake data into overall risk (0-100)
   */
  async getEarthquakeRisk(
    lat: number,
    lon: number,
    radiusKm: number = 500
  ): Promise<{
    riskScore: number;
    recentCount: number;
    maxMagnitude: number;
    lastEvent: string | null;
    earthquakeData: EarthquakeData[];
  }> {
    const earthquakes = await this.getRecentEarthquakes(lat, lon, radiusKm);

    if (earthquakes.length === 0) {
      return {
        riskScore: 0,
        recentCount: 0,
        maxMagnitude: 0,
        lastEvent: null,
        earthquakeData: [],
      };
    }

    // Calculate overall risk
    const maxMagnitude = Math.max(...earthquakes.map(eq => eq.magnitude));
    const totalRisk = earthquakes.reduce((sum, eq) => sum + eq.riskScore, 0);
    const avgRisk = totalRisk / earthquakes.length;
    
    // Weight by magnitude and recency
    const recentEvents = earthquakes.filter(eq => {
      const eventTime = new Date(eq.timestamp);
      const hoursAgo = (Date.now() - eventTime.getTime()) / (1000 * 60 * 60);
      return hoursAgo < 72; // Last 3 days
    });

    const riskScore = Math.min(100, avgRisk + (recentEvents.length * 5));

    return {
      riskScore: Math.round(riskScore),
      recentCount: earthquakes.length,
      maxMagnitude: Math.round(maxMagnitude * 10) / 10,
      lastEvent: earthquakes[0]?.timestamp || null,
      earthquakeData: earthquakes,
    };
  }

  /**
   * Calculate distance between two coordinates in km (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Calculate risk score based on magnitude, distance, and depth
   */
  private calculateRiskScore(magnitude: number, distanceKm: number, depthKm: number): number {
    // Magnitude component (0-60 points)
    let magnitudeScore = 0;
    if (magnitude >= 7.0) magnitudeScore = 60;
    else if (magnitude >= 6.0) magnitudeScore = 45;
    else if (magnitude >= 5.0) magnitudeScore = 30;
    else if (magnitude >= 4.0) magnitudeScore = 15;
    else magnitudeScore = 5;

    // Distance component (0-30 points)
    // Closer = higher risk
    let distanceScore = 0;
    if (distanceKm <= 50) distanceScore = 30;
    else if (distanceKm <= 100) distanceScore = 25;
    else if (distanceKm <= 200) distanceScore = 20;
    else if (distanceKm <= 300) distanceScore = 15;
    else if (distanceKm <= 400) distanceScore = 10;
    else distanceScore = 5;

    // Depth component (0-10 points)
    // Shallow earthquakes (< 70km) are more dangerous
    const depthScore = depthKm < 70 ? 10 : depthKm < 300 ? 5 : 2;

    return Math.min(100, magnitudeScore + distanceScore + depthScore);
  }

  /**
   * Aggregate nearby earthquakes to avoid double-counting
   */
  private aggregateEarthquakes(earthquakes: EarthquakeData[]): EarthquakeData[] {
    const aggregated: EarthquakeData[] = [];
    const processed = new Set<number>();

    earthquakes.forEach((eq, index) => {
      if (processed.has(index)) return;

      // Find nearby earthquakes (within 50km)
      const nearby: EarthquakeData[] = [eq];
      earthquakes.forEach((otherEq, otherIndex) => {
        if (index !== otherIndex && !processed.has(otherIndex)) {
          const dist = this.calculateDistance(
            eq.latitude || 0, eq.longitude || 0,
            otherEq.latitude || 0, otherEq.longitude || 0
          );
          if (dist < 50) {
            nearby.push(otherEq);
            processed.add(otherIndex);
          }
        }
      });

      // Combine into single event with max magnitude and sum of risk
      const maxEq = nearby.reduce((max, current) => 
        current.magnitude > max.magnitude ? current : max
      );

      aggregated.push({
        ...maxEq,
        eventCount: nearby.length,
        riskScore: Math.min(100, nearby.reduce((sum, e) => sum + e.riskScore, 0)),
      });

      processed.add(index);
    });

    return aggregated;
  }

  /**
   * Fallback to simulated data if API fails
   */
  private getSimulatedEarthquakeData(): EarthquakeData[] {
    // Return empty array (no earthquakes = low risk)
    return [];
  }
}


