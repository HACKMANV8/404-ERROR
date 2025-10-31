import type { Region } from '../types/index.js';

/**
 * Define disaster-prone regions in India
 * These would be dynamically loaded from a database in production
 */
export const DISASTER_REGIONS: Omit<Region, 'severity' | 'aid' | 'status' | 'weatherData' | 'satelliteDamage' | 'socialUrgency'>[] = [
  {
    id: 'A',
    name: 'Kerala Flood Zones',
    lat: 10.8505,
    lon: 76.2711,
    population: '2.5M',
    demographicData: {
      populationDensity: 859,
      hospitals: 45,
      roads: 1250,
      elevation: 10,
    },
  },
  {
    id: 'B',
    name: 'Mumbai Coastal Area',
    lat: 19.0760,
    lon: 72.8777,
    population: '1.8M',
    demographicData: {
      populationDensity: 20900,
      hospitals: 38,
      roads: 890,
      elevation: 14,
    },
  },
  {
    id: 'C',
    name: 'Assam Flood Plains',
    lat: 26.1445,
    lon: 91.7362,
    population: '950K',
    demographicData: {
      populationDensity: 397,
      hospitals: 22,
      roads: 650,
      elevation: 55,
    },
  },
  {
    id: 'D',
    name: 'Odisha Cyclone Zone',
    lat: 20.2961,
    lon: 85.8245,
    population: '680K',
    demographicData: {
      populationDensity: 269,
      hospitals: 18,
      roads: 420,
      elevation: 32,
    },
  },
  {
    id: 'E',
    name: 'Uttarakhand Himalayas',
    lat: 30.0668,
    lon: 79.0193,
    population: '1.2M',
    demographicData: {
      populationDensity: 189,
      hospitals: 28,
      roads: 520,
      elevation: 1350, // High elevation - earthquake/landslide prone
    },
  },
  {
    id: 'F',
    name: 'Himachal Pradesh',
    lat: 31.1048,
    lon: 77.1734,
    population: '850K',
    demographicData: {
      populationDensity: 123,
      hospitals: 22,
      roads: 380,
      elevation: 2200, // High elevation - seismic zone
    },
  },
];
