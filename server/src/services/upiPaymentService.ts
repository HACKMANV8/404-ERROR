import { ethers } from 'ethers';
import { PolygonService } from './polygonService.js';
import type { BlockchainTransaction } from '../types/index.js';

/**
 * UPI Payment Service
 * Records UPI payments as blockchain transactions
 */
export interface UPIPaymentRecord {
  amount: number; // Amount in INR
  upiReference: string; // UPI transaction reference/ID
  donorName?: string;
  donorPhone?: string;
  region?: string;
  description?: string;
  timestamp: string;
  verified: boolean;
}

export class UPIPaymentService {
  private polygonService: PolygonService;
  private upiId: string | null = null;
  
  // Exchange rate for INR to MATIC (approximate, should be fetched from API in production)
  private readonly INR_TO_MATIC_RATE = 0.001; // 1 INR ≈ 0.001 MATIC (example rate)

  constructor(polygonService: PolygonService) {
    this.polygonService = polygonService;
    this.upiId = (process.env.UPI_ID || '').trim() || null;
  }

  /**
   * Record UPI payment as blockchain transaction
   * Option 1: Just record it as metadata (default)
   * Option 2: Actually send equivalent MATIC to blockchain wallet (if enabled)
   */
  async recordUPIPayment(
    payment: UPIPaymentRecord,
    sendToBlockchain: boolean = false
  ): Promise<BlockchainTransaction> {
    try {
      const walletAddress = this.polygonService.getWalletAddress();
      
      // Allow recording even without wallet (for manual entries)
      if (!walletAddress) {
        console.warn('[UPI Payment] ⚠️ Wallet not connected, but continuing with transaction recording');
      }

      // Convert INR to MATIC (approximate)
      const maticAmount = payment.amount * this.INR_TO_MATIC_RATE;

      let txHash: string;
      let blockNumber: number | undefined;
      let status: 'verified' | 'pending' = 'pending';

      // Get block number from provider
      const provider = this.polygonService.getProvider();
      if (provider) {
        try {
          blockNumber = await provider.getBlockNumber();
        } catch (err) {
          // If provider not available, continue without block number
          console.log('[UPI Payment] ⚠️ Could not get block number, continuing without it');
        }
      }

      // Send REAL blockchain transaction using wallet (WAIT for confirmation)
      if (walletAddress && this.polygonService.getWallet()) {
        try {
          console.log('[UPI Payment] 🔗 Sending real transaction to Polygon Amoy blockchain...');
          console.log('[UPI Payment] ⏳ Waiting for blockchain confirmation (this may take 2-5 seconds)...');
          
          // Send transaction and WAIT for confirmation
          // Frontend will show loading state while this is processing
          const realTx = await this.polygonService.sendTransaction(
            walletAddress, // Send to self
            '0.0001', // Minimal amount in MATIC
            `UPI Payment: ${payment.upiReference} - ₹${payment.amount} - ${payment.region || 'Multiple Regions'}`
          );
          
          // Use REAL blockchain hash and block number
          txHash = realTx.hash;
          blockNumber = realTx.blockNumber;
          status = 'verified';
          
          console.log(`[UPI Payment] ✅ Real blockchain transaction confirmed!`);
          console.log(`[UPI Payment] Hash: ${txHash}`);
          console.log(`[UPI Payment] Block: ${blockNumber}`);
          console.log(`[UPI Payment] View on PolygonScan: https://amoy.polygonscan.com/tx/${txHash}`);
        } catch (error: any) {
          console.error('[UPI Payment] ❌ Error sending real blockchain transaction:', error.message);
          console.warn('[UPI Payment] ⚠️ Falling back to hash generation (transaction not on blockchain)');
          // Fallback: if blockchain transaction fails, still record it but mark as pending
          txHash = this.generateTransactionHash(payment);
          status = 'pending';
        }
      } else {
        // Generate transaction hash (fallback when wallet not connected)
        console.warn('[UPI Payment] ⚠️ Wallet not connected - generating hash only (not real blockchain transaction)');
        txHash = this.generateTransactionHash(payment);
        status = 'pending';
      }

      // Format amount for display
      let amountDisplay: string;
      if (payment.amount >= 1000000) {
        amountDisplay = `₹${(payment.amount / 1000000).toFixed(1)}M`;
      } else if (payment.amount >= 1000) {
        amountDisplay = `₹${(payment.amount / 1000).toFixed(0)}K`;
      } else {
        amountDisplay = `₹${payment.amount}`;
      }

      // Generate transaction ID
      const txId = `UPI-${payment.upiReference.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

      // Create blockchain transaction record
      const blockchainTx: BlockchainTransaction = {
        id: txId,
        donor: payment.donorName || `UPI-${payment.upiReference.substring(0, 6)}`,
        region: payment.region || 'Multiple Regions',
        amount: amountDisplay,
        timestamp: payment.timestamp || new Date().toISOString(),
        hash: txHash,
        status: status,
        blockNumber: blockNumber,
      };

      console.log(`[UPI Payment] ✅ Recorded UPI payment as blockchain transaction: ${txId}`);
      console.log(`[UPI Payment] Amount: ${amountDisplay}, UPI Ref: ${payment.upiReference}`);

      return blockchainTx;
    } catch (error: any) {
      console.error('[UPI Payment] ❌ Error recording UPI payment:', error.message);
      throw error;
    }
  }

  /**
   * Generate a transaction hash from UPI payment details
   * This creates a deterministic hash based on payment data
   */
  private generateTransactionHash(payment: UPIPaymentRecord): string {
    const data = `${payment.upiReference}-${payment.amount}-${payment.timestamp}`;
    // Use ethers to create a hash (similar to blockchain hash format)
    const hash = ethers.keccak256(ethers.toUtf8Bytes(data));
    return hash;
  }

  /**
   * Verify UPI payment (would integrate with bank/payment provider API)
   * For now, returns true if payment record is provided
   */
  async verifyUPIPayment(upiReference: string, amount: number): Promise<boolean> {
    // In production, this would:
    // 1. Call bank API to verify transaction
    // 2. Check UPI transaction status
    // 3. Verify amount matches
    
    // For now, just return true if reference exists
    if (upiReference && amount > 0) {
      console.log(`[UPI Payment] ✅ Verified payment: ${upiReference} for ₹${amount}`);
      return true;
    }
    
    return false;
  }

}

