import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import ParticleField from "@/components/ParticleField";
import InteractiveMap from "@/components/InteractiveMap";
import AnimatedTransactionLog from "@/components/AnimatedTransactionLog";
import { fetchPredictions, type AIMetric, type Region } from "@/lib/api";
import { 
  Activity, 
  Cloud, 
  Satellite, 
  MessageSquare, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from "lucide-react";

const Dashboard = () => {
  // Fetch real-time predictions
  const { data: predictions, isLoading, error } = useQuery({
    queryKey: ['predictions'],
    queryFn: fetchPredictions,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });

  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  // Map AI metrics to icons
  const getMetricIcon = (name: string) => {
    if (name.includes("Weather")) return Cloud;
    if (name.includes("Satellite")) return Satellite;
    if (name.includes("Social")) return MessageSquare;
    return Activity;
  };

  const getMetricColor = (status: string) => {
    if (status === "critical") return "text-destructive";
    if (status === "high") return "text-secondary";
    if (status === "medium") return "text-accent";
    return "text-primary";
  };

  // Update last updated when data changes
  useEffect(() => {
    if (predictions?.lastUpdated) {
      setLastUpdated(new Date(predictions.lastUpdated).toLocaleTimeString());
    }
  }, [predictions?.lastUpdated]);

  const aiMetrics: Array<AIMetric & { icon: any; color: string }> = predictions?.aiMetrics.map(metric => ({
    ...metric,
    icon: getMetricIcon(metric.name),
    color: getMetricColor(metric.status),
  })) || [];

  const regions: Region[] = predictions?.regions || [];

  const getSeverityColor = (severity: number) => {
    if (severity >= 80) return "bg-destructive";
    if (severity >= 60) return "bg-secondary";
    if (severity >= 40) return "bg-accent";
    return "bg-primary";
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Particle Background */}
      <ParticleField />

      {/* Top Navigation Bar - Transparent */}
      <nav className="border-b border-primary/20 bg-transparent backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">ResQ Ledger</span>
            </Link>
            <div className="hidden md:flex gap-6 text-sm">
              <Link to="/dashboard" className="text-primary font-medium">Dashboard</Link>
              <Link to="/blockchain" className="text-muted-foreground hover:text-foreground">Blockchain</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Updated {lastUpdated}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
              <span className="text-sm font-medium text-accent">AI Active</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 relative">
            Real-Time Dashboard
            <div className="absolute -inset-2 bg-primary/5 blur-2xl -z-10 animate-pulse-glow" />
          </h1>
          <p className="text-muted-foreground">AI-powered disaster monitoring and aid distribution</p>
        </div>

        {/* AI Metrics Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {isLoading ? (
            // Loading state
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-6 border-border/50 bg-card/80 backdrop-blur-sm">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
                  <div className="h-2 bg-muted rounded"></div>
                </div>
              </Card>
            ))
          ) : error ? (
            // Error state
            <Card className="p-6 border-destructive/50 bg-destructive/10 col-span-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <p>Failed to load AI predictions. Please check if the API server is running.</p>
              </div>
            </Card>
          ) : (
            aiMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.name} className="p-6 border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all group relative overflow-hidden">
                  {/* AI Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{metric.name} Index</p>
                      <p className="text-3xl font-bold">{metric.value}%</p>
                    </div>
                    <div className="relative">
                      <Icon className={`w-10 h-10 ${metric.color} group-hover:animate-pulse-glow`} />
                      <div className={`absolute inset-0 ${metric.color} blur-lg opacity-0 group-hover:opacity-50 transition-opacity`} />
                    </div>
                  </div>
                  <Progress value={metric.value} className="h-2 mb-2" />
                  <div className="flex items-center gap-2">
                    {metric.trend !== undefined && (
                      <>
                        <TrendingUp className={`w-4 h-4 ${metric.trend >= 0 ? 'text-destructive' : 'text-accent'}`} />
                        <span className="text-xs text-muted-foreground">
                          {metric.trend >= 0 ? '+' : ''}{metric.trend}% from 6h ago
                        </span>
                      </>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Map and Regions */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Interactive Map */}
          <div className="lg:col-span-2">
            <InteractiveMap regions={regions} isLoading={isLoading} />
          </div>

          {/* Aid Distribution Summary */}
          <Card className="p-6 border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Aid Distribution</h2>
              {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />}
            </div>
            
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/30 border border-border/30 animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-2 bg-muted rounded mb-2"></div>
                  </div>
                ))
              ) : regions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No regions data available</p>
              ) : (
                regions.map((region, index) => (
                <div 
                  key={region.name} 
                  className="p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/30 hover:border-primary/30 transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{region.name}</span>
                    <span className="text-sm text-muted-foreground">{region.population}</span>
                  </div>
                  <div className="mb-2">
                    <Progress 
                      value={region.severity} 
                      className="h-1.5 mb-1"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Severity: {region.severity}%</span>
                      <span>{region.aid} released</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {region.severity >= 80 ? (
                      <>
                        <AlertTriangle className="w-3 h-3 text-destructive animate-pulse" />
                        <span className="text-xs text-destructive font-medium">Critical</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 text-accent" />
                        <span className="text-xs text-accent font-medium">Active</span>
                      </>
                    )}
                  </div>
                </div>
                ))
              )}
            </div>

            <Link to="/blockchain" className="block mt-6">
              <Button variant="outline" className="w-full">
                View Full Ledger
              </Button>
            </Link>
          </Card>
        </div>

        {/* Live Transaction Log */}
        <div className="mb-8">
          <AnimatedTransactionLog />
        </div>

        {/* AI Activity Indicator */}
        <Card className="p-6 border-primary/30 bg-gradient-to-r from-card/80 to-primary/5 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 animate-pulse-glow" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
              <Activity className="w-8 h-8 text-primary animate-pulse-glow" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-glow" />
            </div>
            <div>
              <p className="font-semibold">AI Models Analyzing Data...</p>
              <p className="text-sm text-muted-foreground">
                Processing weather patterns, satellite imagery, and social media sentiment
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
