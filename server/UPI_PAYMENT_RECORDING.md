# UPI Payment to Blockchain Recording Guide

## Overview

When someone makes a UPI payment to your UPI ID (`9989998205-2@ybl`), the money goes to your bank account, but it needs to be **manually recorded** as a blockchain transaction for transparency.

## How It Works

1. **User makes UPI payment** → Money goes to your bank account
2. **You verify the payment** → Check bank statement/UPI app
3. **Record on blockchain** → Use API to create blockchain transaction record
4. **Transaction appears** → Shows up on dashboard with blockchain hash

## API Endpoints

### 1. Record UPI Payment (Manual Entry)

**Endpoint:** `POST /api/payments/record-upi`

**Request Body:**
```json
{
  "amount": 1000,
  "upiReference": "UPI1234567890123456",
  "donorName": "John Doe",
  "donorPhone": "+91-9876543210",
  "region": "Kerala Flood Zones",
  "description": "Donation for flood relief"
}
```

**Response:**
```json
{
  "success": true,
  "message": "UPI payment recorded as blockchain transaction",
  "transaction": {
    "id": "UPI-12345678-ABC123",
    "donor": "John Doe",
    "region": "Kerala Flood Zones",
    "amount": "₹1K",
    "hash": "0x...",
    "status": "verified",
    "blockNumber": 12345
  }
}
```

### 2. Verify and Record (with verification step)

**Endpoint:** `POST /api/payments/verify-and-record-upi`

**Request Body:** (same as above)

This endpoint verifies the payment before recording.

## How to Record Payments

### Option A: Using cURL (Command Line)

```bash
curl -X POST http://localhost:3001/api/payments/record-upi \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "upiReference": "UPI1234567890123456",
    "donorName": "John Doe",
    "region": "Kerala Flood Zones"
  }'
```

### Option B: Using Postman/API Client

1. Open Postman
2. Create POST request to `http://localhost:3001/api/payments/record-upi`
3. Add JSON body with payment details
4. Send request

### Option C: From Frontend (Admin Panel)

We can add an admin panel in the frontend for easy recording.

### Option D: Automate with Webhook (Future)

For automatic detection, you'd need:
- Bank webhook integration
- Payment gateway webhooks (Razorpay/Stripe)
- UPI app webhooks

## What Information You Need

When someone pays via UPI, you need:

1. **UPI Reference Number** - Found in:
   - Your bank SMS
   - UPI app transaction history
   - Bank statement
   - Format: Usually starts with "UPI" or "TXN" followed by numbers

2. **Amount** - Amount paid in INR

3. **Donor Details** (Optional):
   - Name
   - Phone number
   - Email (if available)

4. **Region** - Which disaster region the donation is for

## Example Workflow

1. **Payment Received:**
   - User scans QR code
   - Pays ₹500 via PhonePe
   - You receive SMS: "You received ₹500 from John Doe (UPI1234567890123456)"

2. **Record Transaction:**
   ```bash
   curl -X POST http://localhost:3001/api/payments/record-upi \
     -H "Content-Type: application/json" \
     -d '{
       "amount": 500,
       "upiReference": "UPI1234567890123456",
       "donorName": "John Doe",
       "region": "Kerala Flood Zones"
     }'
   ```

3. **Transaction Appears:**
   - Shows up in blockchain dashboard
   - Has unique transaction hash
   - Visible to everyone
   - Link to view on PolygonScan (if on blockchain)

## Testing

To test the system:

```bash
# Record a test payment
curl -X POST http://localhost:3001/api/payments/record-upi \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "upiReference": "TEST-UPI-001",
    "donorName": "Test Donor",
    "region": "Kerala Flood Zones",
    "description": "Test payment"
  }'
```

Then check the blockchain dashboard - you should see the transaction!

## Notes

- **Blockchain Hash:** Each UPI payment gets a unique blockchain hash based on UPI reference and timestamp
- **Transparency:** All recorded payments are visible on the dashboard
- **Verification:** Transactions are marked as "verified" immediately
- **No Actual MATIC Transfer:** By default, this just creates a record. To actually send MATIC, set `sendToBlockchain: true`

## Future Improvements

1. **Automatic Detection:**
   - Bank SMS parsing
   - Email parsing
   - Payment gateway webhooks

2. **Smart Contract:**
   - Store payment metadata on-chain
   - Immutable records

3. **Auto-convert to MATIC:**
   - Convert INR to MATIC
   - Automatically send to blockchain wallet

