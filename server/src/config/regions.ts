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
  // Flood-prone regions
  {
    id: 'G',
    name: 'Bihar Flood Plains',
    lat: 25.0961,
    lon: 85.3131,
    population: '1.8M',
    demographicData: {
      populationDensity: 1102,
      hospitals: 32,
      roads: 920,
      elevation: 53, // Ganga plains - flood prone
    },
  },
  {
    id: 'H',
    name: 'Uttar Pradesh Flood Zone',
    lat: 26.8467,
    lon: 80.9462,
    population: '2.3M',
    demographicData: {
      populationDensity: 828,
      hospitals: 41,
      roads: 1150,
      elevation: 126, // Ganga-Yamuna plains - flood prone
    },
  },
  {
    id: 'I',
    name: 'West Bengal Delta',
    lat: 22.9868,
    lon: 87.8550,
    population: '1.5M',
    demographicData: {
      populationDensity: 1029,
      hospitals: 35,
      roads: 780,
      elevation: 9, // Ganga delta - flood & cyclone prone
    },
  },
  // Cyclone-prone regions
  {
    id: 'J',
    name: 'Andhra Pradesh Coast',
    lat: 16.5062,
    lon: 80.6480,
    population: '1.2M',
    demographicData: {
      populationDensity: 308,
      hospitals: 28,
      roads: 680,
      elevation: 22, // Coastal - cyclone prone
    },
  },
  {
    id: 'K',
    name: 'Tamil Nadu Coast',
    lat: 11.0168,
    lon: 76.9558,
    population: '950K',
    demographicData: {
      populationDensity: 555,
      hospitals: 26,
      roads: 720,
      elevation: 6, // Coastal - cyclone prone
    },
  },
  {
    id: 'L',
    name: 'Gujarat Coast',
    lat: 23.0225,
    lon: 72.5714,
    population: '1.1M',
    demographicData: {
      populationDensity: 308,
      hospitals: 31,
      roads: 890,
      elevation: 17, // Coastal - cyclone & drought prone
    },
  },
  // Earthquake-prone regions
  {
    id: 'M',
    name: 'Sikkim',
    lat: 27.5330,
    lon: 88.5122,
    population: '620K',
    demographicData: {
      populationDensity: 86,
      hospitals: 15,
      roads: 290,
      elevation: 1650, // Himalayan - earthquake prone
    },
  },
  {
    id: 'N',
    name: 'Arunachal Pradesh',
    lat: 28.2180,
    lon: 94.7278,
    population: '550K',
    demographicData: {
      populationDensity: 17,
      hospitals: 12,
      roads: 180,
      elevation: 2800, // Himalayan - earthquake prone
    },
  },
  // Drought/Heatwave-prone regions
  {
    id: 'O',
    name: 'Rajasthan Desert',
    lat: 26.9124,
    lon: 75.7873,
    population: '1.4M',
    demographicData: {
      populationDensity: 200,
      hospitals: 24,
      roads: 560,
      elevation: 471, // Thar Desert - drought/heatwave prone
    },
  },
  {
    id: 'P',
    name: 'Maharashtra Drought Zone',
    lat: 19.7515,
    lon: 75.7139,
    population: '1.6M',
    demographicData: {
      populationDensity: 365,
      hospitals: 29,
      roads: 640,
      elevation: 589, // Marathwada - drought prone
    },
  },
  {
    id: 'Q',
    name: 'Telangana',
    lat: 17.3850,
    lon: 78.4867,
    population: '1.3M',
    demographicData: {
      populationDensity: 312,
      hospitals: 27,
      roads: 520,
      elevation: 505, // Drought prone
    },
  },
];
