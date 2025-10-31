import axios from 'axios';
import type { SatelliteData } from '../types/index.js';

/**
 * NASA FIRMS (Fire Information for Resource Management System)
 * Free API for fire and flood detection - No API key required!
 * Documentation: https://firms.modaps.eosdis.nasa.gov/api/
 */
export class NASAFirmsService {
  private readonly FIRMS_BASE_URL = 'https://firms.modaps.eosdis.nasa.gov/api';

  /**
   * Get active fires/floods near a location
   * Returns detected events within a radius
   * NASA FIRMS API: https://firms.modaps.eosdis.nasa.gov/api/
   */
  async getActiveEvents(lat: number, lon: number, radiusKm: number = 50): Promise<{
    fireCount: number;
    floodCount: number;
    events: Array<{
      lat: number;
      lon: number;
      type: 'fire' | 'flood';
      confidence: number;
      timestamp: string;
    }>;
  }> {
    try {
      // Calculate bounding box for the search area
      const bbox = this.calculateBoundingBox(lat, lon, radiusKm);
      
      // NASA FIRMS MODIS NRT (Near Real-Time) data - JSON format
      // Format: bbox = [minLon, minLat, maxLon, maxLat]
      const url = `${this.FIRMS_BASE_URL}/area/csv/${bbox.join(',')}/MODIS_NRT/${1}`;
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'Accept': 'text/csv',
        },
      });

      // Parse CSV data
      const csvData = response.data as string;
      const lines = csvData.split('\n').filter((line: string) => line.trim() && !line.startsWith('latitude'));
      
      const events: Array<{
        lat: number;
        lon: number;
        type: 'fire' | 'flood';
        confidence: number;
        timestamp: string;
      }> = [];

      for (const line of lines) {
        if (!line.trim()) continue;
        
        // CSV format: latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight
        const columns = line.split(',');
        if (columns.length < 5) continue;

        try {
          const eventLat = parseFloat(columns[0]);
          const eventLon = parseFloat(columns[1]);
          const brightness = parseFloat(columns[2] || '0');
          const confidence = parseFloat(columns[9] || '0'); // 0-100 confidence
          const frp = parseFloat(columns[12] || '0'); // Fire Radiative Power
          const dateStr = columns[5] || '';
          const timeStr = columns[6] || '';

          // Calculate distance from our target location
          const distance = this.calculateDistance(lat, lon, eventLat, eventLon);
          
          if (distance <= radiusKm && eventLat && eventLon && !isNaN(eventLat) && !isNaN(eventLon)) {
            // Create timestamp from date and time
            let timestamp = new Date().toISOString();
            if (dateStr && timeStr) {
              try {
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const day = dateStr.substring(6, 8);
                const hour = timeStr.substring(0, 2);
                const minute = timeStr.substring(2, 4);
                timestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`).toISOString();
              } catch (e) {
                // Use current timestamp if parsing fails
              }
            }

            events.push({
              lat: eventLat,
              lon: eventLon,
              type: 'fire',
              confidence: Math.min(100, Math.max(0, confidence + (frp > 0 ? 10 : 0))),
              timestamp,
            });
          }
        } catch (error) {
          // Skip invalid rows
          continue;
        }
      }

      // For floods, would need separate flood detection API
      // Can estimate floods from weather data + absence of fires in flood-prone areas
      const floodCount = 0;

      return {
        fireCount: events.length,
        floodCount,
        events: events.slice(0, 50), // Limit to 50 most recent
      };
    } catch (error: any) {
      console.error('Error fetching NASA FIRMS data:', error.message || error);
      // Return empty data on error - system will use fallback
      return {
        fireCount: 0,
        floodCount: 0,
        events: [],
      };
    }
  }

  /**
   * Calculate bounding box for API request
   */
  private calculateBoundingBox(lat: number, lon: number, radiusKm: number): number[] {
    // Convert km to approximate degrees (1 degree ≈ 111 km)
    const radiusDegrees = radiusKm / 111;
    
    return [
      lon - radiusDegrees, // minLon
      lat - radiusDegrees, // minLat
      lon + radiusDegrees, // maxLon
      lat + radiusDegrees, // maxLat
    ];
  }

  /**
   * Calculate damage score from FIRMS events
   */
  calculateDamageFromEvents(events: Array<{ confidence: number; type: string }>, radiusKm: number): number {
    if (events.length === 0) return 0;

    // Higher event count = higher damage
    const eventScore = Math.min(50, events.length * 5);
    
    // Average confidence of events
    const avgConfidence = events.reduce((sum, e) => sum + e.confidence, 0) / events.length;
    const confidenceScore = Math.min(30, (avgConfidence / 100) * 30);
    
    // Density factor (more events in smaller area = worse)
    const densityScore = Math.min(20, (events.length / radiusKm) * 10);

    return Math.min(100, eventScore + confidenceScore + densityScore);
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
