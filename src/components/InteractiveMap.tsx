import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Satellite, AlertTriangle, Info, RefreshCw } from 'lucide-react';

interface Region {
  id: string;
  name: string;
  lat: number;
  lon: number;
  severity: number;
  population: string;
  aid: string;
  status: 'critical' | 'high' | 'medium' | 'low';
  weatherData?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    rainfall: number;
    conditions: string;
  };
}

interface InteractiveMapProps {
  regions: Region[];
  isLoading?: boolean;
}

const InteractiveMap = ({ regions = [], isLoading = false }: InteractiveMapProps) => {
  const [hoveredRegion, setHoveredRegion] = useState<Region | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  /**
   * Convert lat/lon to x/y percentage for map display
   * Maps Indian coordinates (roughly 6°-37°N, 68°-97°E) to 0-100%
   */
  const latLonToXY = (lat: number, lon: number) => {
    // Indian subcontinent bounds
    const minLat = 6;
    const maxLat = 37;
    const minLon = 68;
    const maxLon = 97;
    
    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100; // Invert Y axis
    
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 80) return 'from-destructive/60 to-destructive/80';
    if (severity >= 60) return 'from-secondary/60 to-secondary/80';
    if (severity >= 40) return 'from-accent/60 to-accent/80';
    return 'from-primary/60 to-primary/80';
  };

  const getSeveritySize = (severity: number) => {
    return Math.max(80, severity * 1.5);
  };

  return (
    <Card className="p-6 border-border/50 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Affected Regions Map</h2>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse-glow" />
              <span className="text-sm text-muted-foreground">Live Data</span>
            </>
          )}
        </div>
      </div>

      <div className="relative h-96 rounded-xl bg-gradient-to-br from-muted/50 to-muted border border-border/50 overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Regions */}
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground">Loading map data...</div>
          </div>
        ) : regions.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground">No regions data available</div>
          </div>
        ) : (
          regions.map((region) => {
            const { x, y } = latLonToXY(region.lat, region.lon);
            const size = getSeveritySize(region.severity);
            const isHovered = hoveredRegion?.id === region.id;
            const isSelected = selectedRegion?.id === region.id;

            return (
              <div
                key={region.id}
                className="absolute cursor-pointer transition-all duration-300"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  transform: `translate(-50%, -50%) ${isHovered || isSelected ? 'scale(1.2)' : 'scale(1)'}`,
                }}
                onMouseEnter={() => setHoveredRegion(region)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => setSelectedRegion(isSelected ? null : region)}
              >
                {/* Pulsing effect */}
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${getSeverityColor(region.severity)} blur-xl animate-pulse-glow`} />
                
                {/* Main marker */}
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${getSeverityColor(region.severity)} border-2 border-white/30 shadow-2xl`} />
                
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>

                {/* Label */}
                <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 text-center transition-opacity ${isHovered || isSelected ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                    <p className="font-semibold text-sm">{region.name}</p>
                    <p className="text-xs text-muted-foreground">Severity: {region.severity}%</p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Selected region info panel */}
        {selectedRegion && (
          <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm border border-primary/30 rounded-lg p-4 shadow-glow-primary animate-fade-in max-w-xs">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">{selectedRegion.name}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Population:</span>
                    <span className="font-medium">{selectedRegion.population}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Severity:</span>
                    <span className="font-medium text-destructive">{selectedRegion.severity}%</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Aid Released:</span>
                    <span className="font-medium text-accent">{selectedRegion.aid}</span>
                  </div>
                  {selectedRegion.weatherData && (
                    <>
                      <div className="border-t border-border/50 my-2 pt-2">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Weather Data:</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Conditions:</span>
                            <span>{selectedRegion.weatherData.conditions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rainfall:</span>
                            <span>{selectedRegion.weatherData.rainfall.toFixed(1)}mm</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Wind Speed:</span>
                            <span>{selectedRegion.weatherData.windSpeed} km/h</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Satellite icon */}
        <div className="absolute top-4 left-4">
          <Satellite className="w-8 h-8 text-primary/50 animate-float" />
        </div>
      </div>
    </Card>
  );
};

export default InteractiveMap;
