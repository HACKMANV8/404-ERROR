import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { fetchTransactions, type BlockchainTransaction } from '@/lib/api';

const AnimatedTransactionLog = () => {
  const { data: transactionData, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 0, // Always consider data stale to get fresh updates
  });

  const [newTransaction, setNewTransaction] = useState(false);
  const [prevTransactionCount, setPrevTransactionCount] = useState(0);

  const transactions: BlockchainTransaction[] = transactionData?.transactions.slice(0, 5) || [];

  // Detect new transactions
  useEffect(() => {
    if (transactions.length > prevTransactionCount && prevTransactionCount > 0) {
      setNewTransaction(true);
      setTimeout(() => setNewTransaction(false), 500);
    }
    setPrevTransactionCount(transactions.length);
  }, [transactions.length, prevTransactionCount]);

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  return (
    <Card className="p-6 border-border/50 relative overflow-hidden">
      {/* Glow effect on new transaction */}
      {newTransaction && (
        <div className="absolute inset-0 bg-primary/10 animate-pulse-glow pointer-events-none" />
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-semibold">Live Transactions</h2>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
              <span className="text-sm text-muted-foreground">Auto-updating</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg bg-muted/30 border border-border/30 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          ))
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No transactions available</p>
        ) : (
          transactions.map((tx, index) => (
          <div
            key={`${tx.id}-${index}`}
            className="p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/30 hover:border-primary/30 transition-all animate-fade-in backdrop-blur-sm"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm text-primary">{tx.id}</span>
                  {tx.status === "verified" ? (
                    <Badge className="bg-accent/20 text-accent border-accent/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified on Blockchain
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 animate-pulse">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Processing...
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-muted-foreground">{tx.donor}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium">{tx.region}</span>
                  <span className="text-xl font-bold text-primary">{tx.amount}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">{formatTimestamp(tx.timestamp)}</span>
              </div>
            </div>
          </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default AnimatedTransactionLog;
