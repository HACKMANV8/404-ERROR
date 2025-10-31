import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ParticleField from "@/components/ParticleField";
import { fetchTransactions, type BlockchainTransaction } from "@/lib/api";
import { Activity, CheckCircle, Clock, ExternalLink, Shield, RefreshCw } from "lucide-react";

const Blockchain = () => {
  const { data: transactionData, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 9000,
  });

  const [showAll, setShowAll] = useState(false);

  const transactions: BlockchainTransaction[] = transactionData?.transactions || [];
  const displayedTransactions = showAll ? transactions : transactions.slice(0, 10);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const stats = transactionData ? [
    { label: "Total Transactions", value: transactionData.totalTransactions.toLocaleString(), icon: Activity },
    { label: "Total Aid Distributed", value: transactionData.totalAid, icon: CheckCircle },
    { label: "Smart Contracts", value: transactionData.smartContracts.toString(), icon: Shield },
    { label: "Avg. Processing Time", value: transactionData.avgProcessingTime, icon: Clock },
  ] : [
    { label: "Total Transactions", value: "0", icon: Activity },
    { label: "Total Aid Distributed", value: "$0", icon: CheckCircle },
    { label: "Smart Contracts", value: "0", icon: Shield },
    { label: "Avg. Processing Time", value: "0s", icon: Clock },
  ];

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
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
              <Link to="/blockchain" className="text-primary font-medium">Blockchain</Link>
            </div>
          </div>
          <Link to="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 relative z-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-accent" />
            <h1 className="text-4xl font-bold">Blockchain Transparency</h1>
          </div>
          <p className="text-muted-foreground">
            Every transaction verified and secured on the blockchain ledger
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6 border-border/50 bg-card hover:border-accent/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-8 h-8 text-accent" />
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Blockchain Visualization */}
        <Card className="p-8 border-border/50 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
              <Shield className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Smart Contract Network</h2>
              <p className="text-sm text-muted-foreground">Decentralized and immutable transaction records</p>
            </div>
          </div>

          {/* Visual representation of blockchain */}
          <div className="flex items-center gap-4 overflow-x-auto pb-4">
            {transactionData ? (
              Array.from({ length: 5 }).map((_, block) => {
                const blockNumber = transactionData.smartContracts + block - 5;
                return (
                  <div key={block} className="relative flex-shrink-0">
                    <div className="w-32 h-32 rounded-lg bg-gradient-accent p-4 border border-accent shadow-glow-accent">
                      <p className="text-xs text-accent-foreground/70 mb-2">Block #{block + 1}</p>
                      <p className="text-2xl font-bold text-accent-foreground">{blockNumber}</p>
                      <p className="text-xs text-accent-foreground/70 mt-2">
                        {transactions[block]?.hash || `0x${Math.random().toString(16).slice(2, 6)}...`}
                      </p>
                    </div>
                    {block < 4 && (
                      <div className="absolute top-1/2 -right-4 w-4 h-0.5 bg-accent" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-muted-foreground">Loading blockchain data...</div>
            )}
          </div>
        </Card>

        {/* Transaction Ledger */}
        <Card className="p-6 border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Transaction Ledger</h2>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
                  <span className="text-sm text-muted-foreground">Live Updates</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-5 rounded-lg bg-muted/30 border border-border/50 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              ))
            ) : displayedTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No transactions available</p>
            ) : (
              displayedTransactions.map((tx, index) => (
              <div 
                key={tx.id} 
                className="p-5 rounded-lg bg-muted/30 border border-border/50 hover:border-accent/30 transition-all animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-mono text-sm text-muted-foreground">{tx.id}</p>
                      {tx.status === "verified" ? (
                        <Badge className="bg-accent/20 text-accent border-accent/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Donor</p>
                        <p className="font-medium">{tx.donor}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Region</p>
                        <p className="font-medium">{tx.region}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Amount</p>
                        <p className="text-xl font-bold text-primary">{tx.amount}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:text-right space-y-2">
                    <p className="text-xs text-muted-foreground">{formatTimestamp(tx.timestamp)}</p>
                    <div className="flex items-center gap-2 md:justify-end">
                      <span className="font-mono text-xs text-muted-foreground">{tx.hash}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>

          {!isLoading && transactions.length > 10 && (
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Show Less' : `Load More (${transactions.length - 10} more)`}
              </Button>
            </div>
          )}
        </Card>

        {/* Security Notice */}
        <Card className="mt-6 p-6 border-accent/30 bg-gradient-to-r from-card to-accent/5">
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-accent flex-shrink-0 animate-pulse-glow" />
            <div>
              <h3 className="font-semibold text-lg mb-1">Blockchain Security</h3>
              <p className="text-sm text-muted-foreground">
                All transactions are cryptographically signed and immutable. Smart contracts automatically trigger aid release based on AI severity assessment. Every transaction is publicly verifiable and traceable on the distributed ledger.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Blockchain;
