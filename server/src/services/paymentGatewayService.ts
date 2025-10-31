import axios from 'axios';

/**
 * Payment Gateway Service
 * Handles integration with payment gateways (Razorpay, Stripe, etc.)
 * Supports: UPI, Credit/Debit Cards, Bank Transfer
 * 
 * Note: This is a placeholder service structure
 * You'll need to integrate with actual payment gateway SDKs
 */
export interface PaymentRequest {
  amount: number; // Amount in smallest currency unit (e.g., paise for INR)
  currency: string; // 'INR' for Indian Rupees
  region: string; // Target region for donation
  donorName?: string; // Optional donor name
  donorEmail?: string; // Optional donor email
  description?: string; // Payment description
}

export interface PaymentResponse {
  paymentId: string;
  status: 'created' | 'pending' | 'completed' | 'failed';
  amount: number;
  currency: string;
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet' | 'crypto';
  gatewayResponse?: any; // Gateway-specific response
  qrCode?: string; // QR code data for UPI payments
  paymentLink?: string; // Payment link for cards/netbanking
}

export class PaymentGatewayService {
  private razorpayKeyId: string | null = null;
  private razorpayKeySecret: string | null = null;
  private stripeSecretKey: string | null = null;

  private upiId: string | null = null;
  private bankAccount: {
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
    accountHolderName?: string;
    accountType?: string;
  } = {};

  constructor() {
    // Load payment gateway credentials from environment
    this.razorpayKeyId = (process.env.RAZORPAY_KEY_ID || '').trim();
    this.razorpayKeySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    this.stripeSecretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    
    // Load UPI and Bank details
    this.upiId = (process.env.UPI_ID || '9989998205-2@ybl').trim();
    
    // Load bank account details
    this.bankAccount = {
      accountNumber: (process.env.BANK_ACCOUNT_NUMBER || '').trim() || undefined,
      ifsc: (process.env.BANK_IFSC || '').trim() || undefined,
      bankName: (process.env.BANK_NAME || '').trim() || undefined,
      accountHolderName: (process.env.BANK_ACCOUNT_HOLDER_NAME || 'KOPPARAPU MEDINI').trim(),
      accountType: (process.env.BANK_ACCOUNT_TYPE || 'Savings').trim(),
    };
  }

  /**
   * Create payment order
   * Supports multiple payment methods
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Check which payment gateway is configured
    if (this.razorpayKeyId && this.razorpayKeySecret) {
      return this.createRazorpayPayment(request);
    } else if (this.stripeSecretKey) {
      return this.createStripePayment(request);
    } else {
      // Fallback: Return mock payment response
      console.log('[Payment Gateway] ⚠️ No payment gateway configured - using mock response');
      return this.createMockPayment(request);
    }
  }

  /**
   * Create Razorpay payment order
   */
  private async createRazorpayPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Razorpay API endpoint
      const razorpayUrl = 'https://api.razorpay.com/v1/orders';
      
      // Create order request
      const orderData = {
        amount: request.amount, // Amount in paise
        currency: request.currency || 'INR',
        receipt: `RESQ-${Date.now()}`,
        notes: {
          region: request.region,
          donorName: request.donorName || 'Anonymous',
          description: request.description || `Aid for ${request.region}`,
        },
      };

      // Create Basic Auth header
      const auth = Buffer.from(`${this.razorpayKeyId}:${this.razorpayKeySecret}`).toString('base64');

      const response = await axios.post(razorpayUrl, orderData, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      const order = response.data;

      console.log(`[Payment Gateway] ✅ Razorpay order created: ${order.id}`);

      return {
        paymentId: order.id,
        status: 'created',
        amount: request.amount,
        currency: request.currency || 'INR',
        paymentMethod: 'card', // Default, can be changed based on user selection
        gatewayResponse: order,
        paymentLink: `https://checkout.razorpay.com/v1/checkout.js?key=${this.razorpayKeyId}&order_id=${order.id}`,
      };
    } catch (error: any) {
      console.error('[Payment Gateway] ❌ Razorpay error:', error.message);
      throw new Error(`Payment gateway error: ${error.message}`);
    }
  }

  /**
   * Create Stripe payment
   */
  private async createStripePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Stripe API endpoint
      const stripeUrl = 'https://api.stripe.com/v1/payment_intents';

      const paymentData = new URLSearchParams({
        amount: request.amount.toString(),
        currency: request.currency || 'inr',
        description: request.description || `Aid for ${request.region}`,
        metadata: JSON.stringify({
          region: request.region,
          donorName: request.donorName || 'Anonymous',
        }),
      });

      const response = await axios.post(stripeUrl, paymentData, {
        headers: {
          'Authorization': `Bearer ${this.stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      });

      const paymentIntent = response.data;

      console.log(`[Payment Gateway] ✅ Stripe payment intent created: ${paymentIntent.id}`);

      return {
        paymentId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
        amount: request.amount,
        currency: request.currency || 'INR',
        paymentMethod: 'card',
        gatewayResponse: paymentIntent,
      };
    } catch (error: any) {
      console.error('[Payment Gateway] ❌ Stripe error:', error.message);
      throw new Error(`Payment gateway error: ${error.message}`);
    }
  }

  /**
   * Create mock payment (for development/testing)
   */
  private createMockPayment(request: PaymentRequest): PaymentResponse {
    return {
      paymentId: `MOCK-${Date.now()}`,
      status: 'pending',
      amount: request.amount,
      currency: request.currency || 'INR',
      paymentMethod: 'upi',
      qrCode: `upi://pay?pa=your-upi-id@paytm&pn=ResQ%20Ledger&am=${request.amount}&cu=INR&tn=Aid%20for%20${encodeURIComponent(request.region)}`,
      paymentLink: '#',
    };
  }

  /**
   * Verify payment status
   */
  async verifyPayment(paymentId: string, gateway: 'razorpay' | 'stripe'): Promise<PaymentResponse> {
    if (gateway === 'razorpay' && this.razorpayKeyId && this.razorpayKeySecret) {
      return this.verifyRazorpayPayment(paymentId);
    } else if (gateway === 'stripe' && this.stripeSecretKey) {
      return this.verifyStripePayment(paymentId);
    } else {
      throw new Error('Payment gateway not configured');
    }
  }

  /**
   * Verify Razorpay payment
   */
  private async verifyRazorpayPayment(paymentId: string): Promise<PaymentResponse> {
    try {
      const auth = Buffer.from(`${this.razorpayKeyId}:${this.razorpayKeySecret}`).toString('base64');
      const response = await axios.get(`https://api.razorpay.com/v1/orders/${paymentId}`, {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
        timeout: 10000,
      });

      const order = response.data;

      return {
        paymentId: order.id,
        status: order.status === 'paid' ? 'completed' : 'pending',
        amount: order.amount,
        currency: order.currency,
        paymentMethod: 'card',
        gatewayResponse: order,
      };
    } catch (error: any) {
      throw new Error(`Payment verification error: ${error.message}`);
    }
  }

  /**
   * Verify Stripe payment
   */
  private async verifyStripePayment(paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await axios.get(`https://api.stripe.com/v1/payment_intents/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.stripeSecretKey}`,
        },
        timeout: 10000,
      });

      const paymentIntent = response.data;

      return {
        paymentId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethod: 'card',
        gatewayResponse: paymentIntent,
      };
    } catch (error: any) {
      throw new Error(`Payment verification error: ${error.message}`);
    }
  }

  /**
   * Generate UPI QR code data (legacy - direct UPI, no automatic detection)
   */
  generateUPIQR(upiId?: string, amount?: number, merchantName?: string, transactionNote?: string): string {
    const finalUpiId = upiId || this.upiId || '';
    const finalMerchantName = merchantName || this.bankAccount.accountHolderName || 'ResQ Ledger';
    const finalAmount = amount ? `&am=${amount}` : '';
    const finalNote = transactionNote ? `&tn=${encodeURIComponent(transactionNote)}` : '';
    
    // UPI payment URL format
    const upiUrl = `upi://pay?pa=${finalUpiId}&pn=${encodeURIComponent(finalMerchantName)}${finalAmount}&cu=INR${finalNote}`;
    return upiUrl;
  }

  /**
   * Create Razorpay QR code (for automatic payment detection via webhook)
   * Returns QR code image URL and reference ID
   */
  async createRazorpayQRCode(amount?: number, description?: string): Promise<{ qrCodeUrl: string; qrCodeId: string; qrCodeImage: string } | null> {
    try {
      if (!this.razorpayKeyId || !this.razorpayKeySecret) {
        console.log('[Payment Gateway] ⚠️ Razorpay not configured - cannot create QR code');
        return null;
      }

      // Razorpay QR Code API endpoint
      const razorpayUrl = 'https://api.razorpay.com/v1/qr_codes';
      
      // Create QR code request
      const qrData: any = {
        type: 'upi_qr', // Static QR code
        name: 'ResQ Ledger Donation',
        usage: 'multiple_use', // Can accept multiple payments
        description: description || 'Donation for disaster relief',
        fixed_amount: amount ? true : false,
      };

      // If amount specified, add it (in paise)
      if (amount) {
        qrData.fixed_amount = true;
        qrData.payments = {
          amount: Math.round(amount * 100), // Convert to paise
          currency: 'INR',
        };
      }

      // Create Basic Auth header
      const auth = Buffer.from(`${this.razorpayKeyId}:${this.razorpayKeySecret}`).toString('base64');

      const response = await axios.post(razorpayUrl, qrData, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      const qrCode = response.data;

      console.log(`[Payment Gateway] ✅ Razorpay QR code created: ${qrCode.id}`);

      return {
        qrCodeUrl: qrCode.short_url || `https://razorpay.com/qr/${qrCode.id}`,
        qrCodeId: qrCode.id,
        qrCodeImage: qrCode.image_url || qrCode.qr_url || qrCode.short_url,
      };
    } catch (error: any) {
      console.error('[Payment Gateway] ❌ Razorpay QR code creation error:', error.message);
      if (error.response) {
        console.error('[Payment Gateway] Response:', error.response.data);
      }
      // Return null to fall back to direct UPI QR code
      return null;
    }
  }

  /**
   * Get UPI ID
   */
  getUPIId(): string | null {
    return this.upiId;
  }

  /**
   * Get bank account details
   */
  getBankAccount() {
    return this.bankAccount;
  }
}

