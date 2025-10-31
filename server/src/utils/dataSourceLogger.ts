/**
 * Utility to log which data sources are being used (real vs simulated)
 */

export function logDataSourceStatus(
  service: string,
  regionName: string,
  isReal: boolean,
  details?: string
) {
  const status = isReal ? '✅ REAL' : '⚠️ SIMULATED';
  const detailStr = details ? ` (${details})` : '';
  console.log(`[${service}] ${regionName}: ${status}${detailStr}`);
}

export function logDataSourcesSummary(sources: {
  weather: boolean;
  satellite: boolean;
  social: boolean;
  region: string;
}) {
  const realCount = [sources.weather, sources.satellite, sources.social].filter(Boolean).length;
  const total = 3;
  
  console.log(`\n[Data Sources] ${sources.region}:`);
  console.log(`  Weather: ${sources.weather ? '✅ REAL' : '⚠️ SIMULATED'}`);
  console.log(`  Satellite: ${sources.satellite ? '✅ REAL' : '⚠️ SIMULATED'}`);
  console.log(`  Social Media: ${sources.social ? '✅ REAL' : '⚠️ SIMULATED'}`);
  console.log(`  Summary: ${realCount}/${total} data sources using REAL data\n`);
}
