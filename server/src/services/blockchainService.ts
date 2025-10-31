import type { BlockchainTransaction, TransactionResponse } from '../types/index.js';

export class BlockchainService {
  private transactions: BlockchainTransaction[] = [];
  private blockCounter = 156;

  constructor() {
    // Initialize with some sample transactions
    this.initializeTransactions();
  }

  /**
   * Get all blockchain transactions
   */
  getTransactions(): TransactionResponse {
    return {
      transactions: this.transactions.slice(0, 50), // Return latest 50
      totalTransactions: 1247 + this.transactions.length,
      totalAid: '$48.3M',
      smartContracts: this.blockCounter,
      avgProcessingTime: '2.3s',
    };
  }

  /**
   * Add a new transaction (simulated blockchain write)
   * In production, this would interact with smart contracts
   */
  addTransaction(transaction: Omit<BlockchainTransaction, 'id' | 'hash' | 'timestamp'>): BlockchainTransaction {
    const newTx: BlockchainTransaction = {
      ...transaction,
      id: `TX-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      hash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      blockNumber: this.blockCounter++,
    };

    // Simulate verification delay
    if (transaction.status === 'pending') {
      setTimeout(() => {
        const tx = this.transactions.find((t) => t.id === newTx.id);
        if (tx) tx.status = 'verified';
      }, 2000 + Math.random() * 3000);
    }

    this.transactions.unshift(newTx);
    return newTx;
  }

  /**
   * Initialize with sample transactions
   */
  private initializeTransactions(): void {
    const donors = [
      'Global Aid Foundation',
      'International Relief Corp',
      'Emergency Response Network',
      'Humanitarian Alliance',
      'Disaster Relief Coalition',
    ];
    const regions = ['Region A', 'Region B', 'Region C', 'Region D'];
    const amounts = ['$500K', '$750K', '$1.2M', '$1.8M', '$2.3M', '$2.5M', '$3M'];

    for (let i = 0; i < 10; i++) {
      this.transactions.push({
        id: `TX-${String(i + 1).padStart(4, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        donor: donors[Math.floor(Math.random() * donors.length)],
        region: regions[Math.floor(Math.random() * regions.length)],
        amount: amounts[Math.floor(Math.random() * amounts.length)],
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        hash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        status: Math.random() > 0.2 ? 'verified' : 'pending',
        blockNumber: this.blockCounter - 10 + i,
      });
    }
  }

  /**
   * Generate new transaction periodically (simulated)
   */
  generateSimulatedTransaction(): void {
    const donors = [
      'Humanitarian Alliance',
      'Disaster Relief Coalition',
      'Global Emergency Fund',
      'Crisis Response Network',
      'Aid Distribution Center',
    ];
    const regions = ['Region A', 'Region B', 'Region C', 'Region D'];
    const amounts = ['$500K', '$750K', '$1.2M', '$1.8M', '$2.3M'];

    this.addTransaction({
      donor: donors[Math.floor(Math.random() * donors.length)],
      region: regions[Math.floor(Math.random() * regions.length)],
      amount: amounts[Math.floor(Math.random() * amounts.length)],
      status: Math.random() > 0.3 ? 'verified' : 'pending',
    });
  }
}
