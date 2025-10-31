import { ethers } from 'ethers';
import type { BlockchainTransaction } from '../types/index.js';

/**
 * Polygon Amoy (Testnet) Configuration
 * RPC URL for Polygon Amoy testnet
 */
const POLYGON_AMOY_RPC = 'https://rpc-amoy.polygon.technology';
const POLYGONSCAN_AMOY_BASE = 'https://amoy.polygonscan.com';

/**
 * Polygon Blockchain Service
 * Connects to Polygon Amoy testnet and fetches real transactions
 */
export class PolygonService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private walletAddress: string | null = null;

  constructor() {
    // Initialize provider connection
    this.initializeProvider();
  }

  /**
   * Initialize Polygon Amoy provider
   */
  private initializeProvider(): void {
    try {
      // Connect to Polygon Amoy testnet
      this.provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
      console.log('[Polygon] ✅ Connected to Polygon Amoy testnet');
    } catch (error) {
      console.error('[Polygon] ❌ Error connecting to Polygon Amoy:', error);
      this.provider = null;
    }
  }

  /**
   * Connect wallet using private key from environment
   * Private key should be in server/.env file
   */
  async connectWallet(privateKey?: string): Promise<boolean> {
    try {
      // Get private key from environment or parameter
      const key = privateKey || (process.env.POLYGON_PRIVATE_KEY || '').trim();
      
      if (!key || key === '' || key === 'your_polygon_private_key_here') {
        console.log('[Polygon] ⚠️ Private key not configured - using read-only mode');
        return false;
      }

      if (!this.provider) {
        console.error('[Polygon] ❌ Provider not initialized');
        return false;
      }

      // Create wallet from private key
      this.wallet = new ethers.Wallet(key, this.provider);
      this.walletAddress = await this.wallet.getAddress();
      
      console.log(`[Polygon] ✅ Wallet connected - Address: ${this.walletAddress}`);
      return true;
    } catch (error: any) {
      console.error('[Polygon] ❌ Error connecting wallet:', error.message);
      return false;
    }
  }

  /**
   * Get wallet address
   */
  getWalletAddress(): string | null {
    return this.walletAddress;
  }

  /**
   * Get wallet balance (in MATIC)
   */
  async getBalance(): Promise<string> {
    if (!this.provider || !this.walletAddress) {
      return '0';
    }

    try {
      const balance = await this.provider.getBalance(this.walletAddress);
      const maticBalance = ethers.formatEther(balance);
      return parseFloat(maticBalance).toFixed(4);
    } catch (error: any) {
      console.error('[Polygon] Error getting balance:', error.message);
      return '0';
    }
  }

  /**
   * Fetch real transactions from Polygon Amoy blockchain
   * Fetches all transactions for the connected wallet
   */
  async fetchTransactions(limit: number = 50): Promise<BlockchainTransaction[]> {
    if (!this.provider || !this.walletAddress) {
      console.log('[Polygon] ⚠️ Provider or wallet not connected - returning empty transactions');
      return [];
    }

    try {
      // Get transaction count for the wallet
      const txCount = await this.provider.getTransactionCount(this.walletAddress, 'latest');
      
      // Fetch recent transactions
      // Note: Polygon Amoy explorer API or we can use ethers to get transaction history
      // For now, we'll fetch block data and filter transactions
      const transactions: BlockchainTransaction[] = [];

      // Get latest block number
      const latestBlock = await this.provider.getBlockNumber();
      
      // Check last 50 blocks for transactions (optimized for performance)
      const blocksToCheck = Math.min(50, latestBlock);
      
      for (let i = 0; i < blocksToCheck && transactions.length < limit; i++) {
        const blockNumber = latestBlock - i;
        
        try {
          const block = await this.provider.getBlock(blockNumber, true);
          
          if (block && block.transactions) {
            for (const txHash of block.transactions) {
              if (typeof txHash === 'string') {
                const tx = await this.provider.getTransaction(txHash);
                const receipt = await this.provider.getTransactionReceipt(txHash);
                
                // Check if transaction involves our wallet
                if (tx && (tx.from.toLowerCase() === this.walletAddress.toLowerCase() || 
                          (tx.to && tx.to.toLowerCase() === this.walletAddress.toLowerCase()))) {
                  
                  const txData = await this.parseTransaction(tx, receipt, blockNumber);
                  if (txData) {
                    transactions.push(txData);
                    
                    if (transactions.length >= limit) break;
                  }
                }
              }
            }
          }
        } catch (blockError) {
          // Skip blocks with errors, continue checking
          continue;
        }
      }

      console.log(`[Polygon] ✅ Fetched ${transactions.length} real transactions from blockchain`);
      return transactions;
    } catch (error: any) {
      console.error('[Polygon] ❌ Error fetching transactions:', error.message);
      return [];
    }
  }

  /**
   * Parse blockchain transaction to our format
   */
  private async parseTransaction(
    tx: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt | null,
    blockNumber: number
  ): Promise<BlockchainTransaction | null> {
    try {
      if (!tx) return null;

      // Determine transaction status
      let status: 'verified' | 'pending' = 'pending';
      if (receipt) {
        status = receipt.status === 1 ? 'verified' : 'pending';
      }

      // Get transaction value in MATIC
      const value = ethers.formatEther(tx.value || 0);
      const amountValue = parseFloat(value);
      
      // Format amount
      let amount: string;
      if (amountValue >= 1000000) {
        amount = `$${(amountValue * 0.0001).toFixed(1)}M`; // Approximate USD conversion (1 MATIC ≈ $0.0001 for testnet display)
      } else if (amountValue >= 1000) {
        amount = `$${(amountValue * 0.0001).toFixed(0)}K`;
      } else {
        amount = `${amountValue.toFixed(4)} MATIC`;
      }

      // Try to get region from transaction data (if encoded)
      // For now, we'll use a default or try to extract from input data
      const region = this.extractRegionFromTx(tx);

      // Generate transaction ID from hash
      const txId = `TX-${tx.hash.substring(2, 6).toUpperCase()}-${tx.hash.substring(tx.hash.length - 4).toUpperCase()}`;

      // Get donor address (from address)
      const donor = this.formatAddress(tx.from);

      // Get timestamp from block
      let timestamp = new Date().toISOString();
      if (receipt && receipt.blockNumber) {
        try {
          const block = await this.provider?.getBlock(receipt.blockNumber);
          if (block && block.timestamp) {
            timestamp = new Date(block.timestamp * 1000).toISOString();
          }
        } catch {
          // Use current timestamp if block fetch fails
        }
      }

      return {
        id: txId,
        donor: donor,
        region: region,
        amount: amount,
        timestamp: timestamp,
        hash: tx.hash,
        status: status,
        blockNumber: blockNumber,
      };
    } catch (error: any) {
      console.error('[Polygon] Error parsing transaction:', error.message);
      return null;
    }
  }

  /**
   * Extract region information from transaction data
   * If transaction has encoded region data, parse it
   * Otherwise, return a default region
   */
  private extractRegionFromTx(tx: ethers.TransactionResponse): string {
    // If transaction has input data, try to decode it
    // For now, return a default or try to determine from value/pattern
    // In production, smart contract would emit events with region data
    
    // Check if this is a donation transaction
    // For demo, assign regions based on transaction hash pattern
    const regions = [
      'Kerala Flood Zones',
      'Assam Flood Plains',
      'Mumbai Coastal Area',
      'Odisha Cyclone Zone',
      'Bihar Flood Plains',
    ];
    
    // Use transaction hash to deterministically assign region
    const hashNum = parseInt(tx.hash.substring(2, 10), 16);
    return regions[hashNum % regions.length];
  }

  /**
   * Format Ethereum address for display
   */
  private formatAddress(address: string): string {
    if (!address) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  /**
   * Get PolygonScan URL for a transaction
   */
  getPolygonScanUrl(txHash: string): string {
    return `${POLYGONSCAN_AMOY_BASE}/tx/${txHash}`;
  }

  /**
   * Get PolygonScan URL for an address
   */
  getPolygonScanAddressUrl(address: string): string {
    return `${POLYGONSCAN_AMOY_BASE}/address/${address}`;
  }

  /**
   * Monitor for new transactions (real-time)
   * Sets up event listener for new blocks
   */
  async startMonitoring(callback: (transactions: BlockchainTransaction[]) => void): Promise<void> {
    if (!this.provider || !this.walletAddress) {
      console.log('[Polygon] ⚠️ Cannot start monitoring - provider or wallet not connected');
      return;
    }

    try {
      // Monitor new blocks
      this.provider.on('block', async (blockNumber) => {
        try {
          const block = await this.provider!.getBlock(blockNumber, true);
          
          if (block && block.transactions) {
            const newTransactions: BlockchainTransaction[] = [];
            
            for (const txHash of block.transactions) {
              if (typeof txHash === 'string') {
                const tx = await this.provider!.getTransaction(txHash);
                
                if (tx && (tx.from.toLowerCase() === this.walletAddress!.toLowerCase() || 
                          (tx.to && tx.to.toLowerCase() === this.walletAddress!.toLowerCase()))) {
                  const receipt = await this.provider!.getTransactionReceipt(txHash);
                  const txData = await this.parseTransaction(tx, receipt, blockNumber);
                  
                  if (txData) {
                    newTransactions.push(txData);
                  }
                }
              }
            }
            
            if (newTransactions.length > 0) {
              callback(newTransactions);
            }
          }
        } catch (error) {
          // Continue monitoring on error
          console.error('[Polygon] Error monitoring block:', error);
        }
      });

      console.log('[Polygon] ✅ Started real-time transaction monitoring');
    } catch (error: any) {
      console.error('[Polygon] ❌ Error starting monitoring:', error.message);
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.provider) {
      this.provider.removeAllListeners('block');
      console.log('[Polygon] ⏹️ Stopped transaction monitoring');
    }
  }
}

