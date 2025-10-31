import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ParticleField from "@/components/ParticleField";
import { fetchTransactions, fetchWalletInfo, fetchPaymentOptions, type BlockchainTransaction } from "@/lib/api";
import { Activity, CheckCircle, Clock, ExternalLink, Shield, RefreshCw, QrCode, Wallet, Copy, Check, IndianRupee, Smartphone, Plus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import PaymentRecordForm from "@/components/PaymentRecordForm";

const Blockchain = () => {
  const { data: transactionData, isLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
    refetchInterval: 2000, // Refetch every 2 seconds to catch blockchain confirmations quickly
    staleTime: 0, // Always consider data stale to get fresh updates
    gcTime: 0, // Keep cache fresh
  });

  const { data: walletInfo } = useQuery({
    queryKey: ['wallet'],
    queryFn: fetchWalletInfo,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: paymentOptions } = useQuery({
    queryKey: ['paymentOptions'],
    queryFn: fetchPaymentOptions,
    refetchInterval: 60000, // Refetch every minute
  });

  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);

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

  const getPolygonScanUrl = (txHash: string) => {
    return `https://amoy.polygonscan.com/tx/${txHash}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyUPIId = async (upiId: string) => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopiedUPI(true);
      setTimeout(() => setCopiedUPI(false), 2000);
    } catch (err) {
      console.error('Failed to copy UPI ID:', err);
    }
  };

  const truncateHash = (hash: string) => {
    if (hash.length <= 16) return hash;
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 6)}`;
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

        {/* Wallet Info & QR Code Section */}
        {walletInfo && walletInfo.isConnected && walletInfo.address && (
          <Card className="p-6 border-accent/30 bg-gradient-to-r from-card to-accent/5 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Wallet className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-semibold">Donation Wallet</h3>
                  <Badge className="bg-accent/20 text-accent border-accent/30">
                    {walletInfo.network}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Send donations directly to this wallet address on Polygon Amoy
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 p-3 rounded-lg bg-muted/50 border border-border/50 font-mono text-sm break-all">
                    {walletInfo.address}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(walletInfo.address || '')}
                    className="flex-shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowQR(!showQR)}
                    className="flex-shrink-0"
                  >
                    <QrCode className="w-4 h-4" />
                  </Button>
                </div>
                {walletInfo.balance && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Current Balance: <span className="font-semibold text-foreground">{walletInfo.balance} MATIC</span>
                  </p>
                )}
              </div>
              {showQR && walletInfo.address && (
                <div className="p-4 bg-white rounded-lg border-2 border-accent">
                  <QRCodeSVG value={walletInfo.address} size={200} level="M" />
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Admin Form: Record UPI Payment Manually */}
        <Card className="p-6 border-primary/30 bg-gradient-to-r from-primary/5 to-card mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Plus className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Admin: Record Payment</h3>
            </div>
            <span className="text-xs text-muted-foreground">
              Quick manual entry
            </span>
          </div>
          <PaymentRecordForm 
            onSuccess={() => {
              // Immediate refetch - no delay needed
              refetchTransactions();
            }}
          />
        </Card>

        {/* Razorpay QR Code Section (Automatic Detection) */}
        {paymentOptions?.razorpayQR?.available && (
          <Card className="p-6 border-primary/30 bg-gradient-to-r from-primary/5 to-card mb-8">
            <div className="flex items-center gap-3 mb-4">
              <QrCode className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Donate via QR Code</h3>
              <Badge className="bg-primary/20 text-primary border-primary/30">Auto-Detection</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Scan this QR code with any UPI app. Payments are automatically detected and recorded!
            </p>
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* Razorpay QR Code Image */}
              <div className="flex-shrink-0">
                <div className="p-4 bg-white rounded-lg border-2 border-primary shadow-lg">
                  {paymentOptions.razorpayQR.qrCodeImage ? (
                    <img 
                      src={paymentOptions.razorpayQR.qrCodeImage} 
                      alt="Razorpay QR Code"
                      className="w-[200px] h-[200px] object-contain"
                    />
                  ) : paymentOptions.razorpayQR.qrCodeUrl ? (
                    <QRCodeSVG 
                      value={paymentOptions.razorpayQR.qrCodeUrl} 
                      size={200} 
                      level="M"
                      includeMargin={true}
                    />
                  ) : null}
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  ✅ Automatic payment detection enabled
                </p>
              </div>
              
              {/* QR Code Info */}
              <div className="flex-1">
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">QR Code ID</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 rounded-lg bg-muted/50 border border-border/50 font-mono text-sm break-all">
                      {paymentOptions.razorpayQR.qrCodeId || 'Generating...'}
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs font-medium text-primary mb-1">✨ Automatic Detection</p>
                  <p className="text-xs text-muted-foreground">
                    Payments made through this QR code are automatically recorded via Razorpay webhooks. No manual entry needed!
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                  <IndianRupee className="w-4 h-4" />
                  <span>Supported: PhonePe, Google Pay, Paytm, BHIM, and all UPI apps</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Direct UPI Payment Section (Manual Entry Required) */}
        {paymentOptions?.upi.available && !paymentOptions?.razorpayQR?.available && (
          <Card className="p-6 border-accent/30 bg-gradient-to-r from-accent/5 to-card mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="w-6 h-6 text-accent" />
              <h3 className="text-xl font-semibold">Donate via UPI</h3>
              <Badge className="bg-secondary/20 text-secondary border-secondary/30">Manual Entry</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Scan the QR code or enter the UPI ID to make a donation. Use the admin form above to record payments manually.
            </p>
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* QR Code */}
              <div className="flex-shrink-0">
                <div className="p-4 bg-white rounded-lg border-2 border-accent shadow-lg">
                  {paymentOptions.upi.qrCode ? (
                    <QRCodeSVG 
                      value={paymentOptions.upi.qrCode} 
                      size={200} 
                      level="M"
                      includeMargin={true}
                    />
                  ) : paymentOptions.upi.id ? (
                    <QRCodeSVG 
                      value={`upi://pay?pa=${paymentOptions.upi.id}&pn=ResQ%20Ledger&cu=INR`} 
                      size={200} 
                      level="M"
                      includeMargin={true}
                    />
                  ) : null}
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  ⚠️ Manual entry required
                </p>
              </div>
              
              {/* UPI ID */}
              <div className="flex-1">
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">UPI ID</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 rounded-lg bg-muted/50 border border-border/50 font-mono text-sm break-all">
                      {paymentOptions.upi.id || 'Not configured'}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => paymentOptions.upi.id && copyUPIId(paymentOptions.upi.id)}
                      className="flex-shrink-0"
                      disabled={!paymentOptions.upi.id}
                    >
                      {copiedUPI ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <IndianRupee className="w-4 h-4" />
                  <span>Supported: PhonePe, Google Pay, Paytm, BHIM, and all UPI apps</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Real Blockchain Status Badge */}
        {transactionData?.isRealBlockchain === false && (
          <Card className="p-4 border-secondary/30 bg-secondary/10 mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-secondary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Using Simulated Data</p>
                <p className="text-xs text-muted-foreground">
                  Add POLYGON_PRIVATE_KEY to server/.env to connect to real Polygon Amoy blockchain
                </p>
              </div>
            </div>
          </Card>
        )}

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
                          Verified on Blockchain
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 animate-pulse">
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Processing on Blockchain...
                        </Badge>
                      )}
                    </div>
                    {tx.status === "pending" && (
                      <div className="mb-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-xs text-yellow-600 flex items-center gap-2">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Waiting for blockchain confirmation (2-5 seconds)...
                        </p>
                      </div>
                    )}
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
                    {tx.blockNumber && (
                      <p className="text-xs text-muted-foreground">Block #{tx.blockNumber}</p>
                    )}
                    <div className="flex items-center gap-2 md:justify-end">
                      {tx.status === "verified" && tx.hash.startsWith('0x') ? (
                        <>
                          <span className="font-mono text-xs text-muted-foreground">{truncateHash(tx.hash)}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => window.open(getPolygonScanUrl(tx.hash), '_blank')}
                            title="View on PolygonScan"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <span className="font-mono text-xs text-yellow-600">
                          {tx.hash ? truncateHash(tx.hash) : 'Generating blockchain hash...'}
                          {tx.status === "pending" && (
                            <RefreshCw className="w-3 h-3 inline-block ml-1 animate-spin" />
                          )}
                        </span>
                      )}
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
