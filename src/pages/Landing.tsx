import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ParticleField from "@/components/ParticleField";
import { Activity, Globe, Shield, Sparkles } from "lucide-react";
import heroGlobe from "@/assets/hero-globe.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Particle Field */}
      <ParticleField />
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-primary/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse-glow" />
        <div className="absolute w-96 h-96 bg-accent/10 rounded-full blur-3xl top-1/2 -right-48 animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute w-96 h-96 bg-secondary/10 rounded-full blur-3xl -bottom-48 left-1/3 animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold">ResQ Ledger</span>
        </div>
        <Link to="/dashboard">
          <Button variant="outline" size="lg">
            Live Dashboard
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                <Sparkles className="w-4 h-4 text-primary animate-pulse-glow" />
                <span className="text-sm font-medium">AI + Blockchain Powered</span>
              </div>

              <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                ResQ Ledger
                <span className="block text-primary mt-2">Disaster Relief</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-xl">
                Predict. Prioritize. Provide — faster, fairer, and transparent aid distribution powered by multi-model AI and blockchain technology.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/dashboard">
                  <Button variant="hero" size="lg" className="group">
                    Get Started
                    <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                  </Button>
                </Link>
                <Link to="/blockchain">
                  <Button variant="outline" size="lg">
                    View Blockchain
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50">
                <div>
                  <div className="text-3xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">AI Accuracy</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-secondary">100K+</div>
                  <div className="text-sm text-muted-foreground">Lives Impacted</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-accent">$50M+</div>
                  <div className="text-sm text-muted-foreground">Aid Distributed</div>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative animate-float">
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-2xl opacity-30" />
              <img 
                src={heroGlobe} 
                alt="AI-powered disaster relief visualization" 
                className="relative rounded-3xl border border-primary/30 shadow-2xl shadow-primary/20"
              />
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-32">
            <div className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:shadow-glow-primary">
              <Globe className="w-12 h-12 text-primary mb-4 group-hover:animate-pulse-glow" />
              <h3 className="text-xl font-semibold mb-2">Multi-Model AI</h3>
              <p className="text-muted-foreground">
                Weather prediction, satellite imagery analysis, and social media sentiment tracking for comprehensive disaster assessment.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-accent/50 transition-all hover:shadow-glow-accent">
              <Shield className="w-12 h-12 text-accent mb-4 group-hover:animate-pulse-glow" />
              <h3 className="text-xl font-semibold mb-2">Blockchain Transparency</h3>
              <p className="text-muted-foreground">
                Smart contracts ensure every aid transaction is transparent, traceable, and tamper-proof on the blockchain.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-secondary/50 transition-all hover:shadow-glow-secondary">
              <Activity className="w-12 h-12 text-secondary mb-4 group-hover:animate-pulse-glow" />
              <h3 className="text-xl font-semibold mb-2">Real-Time Distribution</h3>
              <p className="text-muted-foreground">
                Instant priority assessment and automated aid release to the most affected regions within minutes.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-6 py-12 mt-32 border-t border-border/50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold">ResQ Ledger</span>
          </div>
          <p className="text-muted-foreground">
            Where Intelligence Meets Integrity
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
