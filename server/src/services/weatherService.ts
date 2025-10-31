import axios from 'axios';
import type { WeatherData } from '../types/index.js';

const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export class WeatherService {
  /**
   * Fetch real-time weather data for a location
   */
  async getWeatherData(lat: number, lon: number): Promise<WeatherData> {
    try {
      // Read API key from environment at runtime (after dotenv has loaded)
      const apiKey = (process.env.OPENWEATHER_API_KEY || '').trim();
      
      if (!apiKey || apiKey === '' || apiKey === 'your_openweather_api_key_here') {
        console.log('[Weather] API key not configured, using simulated data');
        // Fallback to simulated data if API key not provided
        return this.getSimulatedWeatherData(lat, lon);
      }

      const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: apiKey,
          units: 'metric',
        },
        timeout: 5000,
      });

      const data = response.data;
      const weatherData = {
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind?.speed || 0 * 3.6), // Convert m/s to km/h
        rainfall: data.rain?.['1h'] || 0,
        pressure: Math.round(data.main.pressure),
        conditions: data.weather[0].main,
        timestamp: new Date().toISOString(),
      };
      
      console.log(`[Weather] ✅ Using REAL data - ${data.weather[0].main}, Temp: ${weatherData.temperature}°C, Rain: ${weatherData.rainfall}mm`);
      return weatherData;
    } catch (error: any) {
      // Handle API errors gracefully
      if (error.response?.status === 401) {
        console.error(`[Weather] API key invalid (401) - Check your OpenWeatherMap API key`);
      } else {
        console.error(`[Weather] Error: ${error.message || error} - Using simulated data`);
      }
      // Return simulated data on error
      return this.getSimulatedWeatherData(lat, lon);
    }
  }

  /**
   * Calculate weather severity score (0-100)
   * Higher score = more dangerous conditions
   */
  calculateSeverity(weather: WeatherData): number {
    let severity = 0;

    // Rainfall contribution (0-40 points)
    if (weather.rainfall > 100) severity += 40;
    else if (weather.rainfall > 50) severity += 30;
    else if (weather.rainfall > 20) severity += 20;
    else if (weather.rainfall > 10) severity += 10;

    // Wind speed contribution (0-30 points)
    if (weather.windSpeed > 120) severity += 30; // Hurricane force
    else if (weather.windSpeed > 80) severity += 25; // Storm force
    else if (weather.windSpeed > 60) severity += 15;
    else if (weather.windSpeed > 40) severity += 8;

    // Humidity + Pressure contribution (0-20 points)
    if (weather.humidity > 90 && weather.pressure < 1000) severity += 20;
    else if (weather.humidity > 80) severity += 10;

    // Extreme conditions (0-10 points)
    if (weather.conditions === 'Thunderstorm') severity += 10;
    else if (weather.conditions === 'Heavy Rain') severity += 5;

    return Math.min(100, Math.max(0, severity));
  }

  /**
   * Simulated weather data for demo/fallback
   */
  private getSimulatedWeatherData(lat: number, lon: number): WeatherData {
    // Simulate disaster-prone conditions
    const baseRainfall = 15 + Math.random() * 85;
    const baseWindSpeed = 30 + Math.random() * 70;
    
    return {
      temperature: 25 + Math.random() * 10,
      humidity: 70 + Math.random() * 25,
      windSpeed: Math.round(baseWindSpeed),
      rainfall: Math.round(baseRainfall * 10) / 10,
      pressure: 980 + Math.random() * 40,
      conditions: baseRainfall > 50 ? 'Heavy Rain' : baseWindSpeed > 60 ? 'Storm' : 'Rain',
      timestamp: new Date().toISOString(),
    };
  }
}
