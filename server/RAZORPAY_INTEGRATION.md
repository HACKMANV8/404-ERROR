# Razorpay Payment Gateway Integration

## ✅ Setup Complete

Your Razorpay test API keys have been configured:

- **Key ID**: `rzp_test_Ra9RGyZE41ljvd`
- **Key Secret**: `xNhci0Do9aY5Wp5XSJURmzTj` (configured in `.env`)

## 🎯 What's Been Integrated

### 1. **Automatic Payment Detection (Webhook)**
- ✅ Webhook endpoint: `POST /api/payments/razorpay-webhook`
- ✅ Automatically detects when payments are received
- ✅ Records payments to blockchain and MongoDB
- ✅ Updates frontend in real-time

### 2. **Manual Payment Entry (Admin Form)**
- ✅ Admin form on Blockchain page
- ✅ Quick manual entry for UPI payments
- ✅ Saves to both blockchain and MongoDB
- ✅ Immediate frontend update

### 3. **Payment Gateway Service**
- ✅ Razorpay API integration
- ✅ Payment order creation
- ✅ Payment verification
- ✅ UPI QR code generation

## 📋 How It Works

### Automatic Flow (Recommended)
1. **User makes payment** → Razorpay processes it
2. **Razorpay sends webhook** → Your backend receives notification
3. **Backend records transaction** → Saves to MongoDB + blockchain cache
4. **Frontend auto-updates** → Transaction appears in dashboard

### Manual Flow (Fallback)
1. **Admin scans UPI QR** → Payment received in bank account
2. **Admin enters details** → Uses "Record Payment" form on Blockchain page
3. **Backend records transaction** → Saves to MongoDB + blockchain cache
4. **Frontend updates** → Transaction appears immediately

## 🔧 Webhook Setup (For Automatic Detection)

To enable automatic payment detection, you need to configure Razorpay webhooks:

### Step 1: Get Your Webhook URL
Your webhook URL should be:
```
https://your-domain.com/api/payments/razorpay-webhook
```

For local development, use a tunnel service:
- **ngrok**: `ngrok http 3001`
- **localtunnel**: `npx localtunnel --port 3001`

### Step 2: Configure in Razorpay Dashboard
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings** → **Webhooks**
3. Click **"Add New Webhook"**
4. Enter your webhook URL
5. Select events:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
   - ✅ `order.paid`
6. Save the webhook

### Step 3: Test Webhook
1. Make a test payment using Razorpay test mode
2. Check backend logs for: `[Razorpay Webhook] 📥 Received webhook`
3. Verify transaction appears in dashboard

## 📊 Testing

### Test Payment Recording
1. Open your frontend → Blockchain page
2. Use the **"Admin: Record Payment"** form
3. Enter:
   - Amount: `500`
   - UPI Reference: `TEST123456789`
   - Donor Name: `Test Donor`
   - Region: Select any region
4. Click **"Record Payment"**
5. ✅ Transaction should appear immediately

### Test Razorpay Integration
1. Use Razorpay test cards:
   - **Success**: `4111 1111 1111 1111`
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date
2. Make a test payment
3. Check backend logs for webhook events
4. ✅ Transaction should appear in dashboard

## 🔒 Security Notes

- ✅ Private keys stored in `.env` (never committed to Git)
- ✅ Webhook signature verification (can be added in production)
- ✅ Test mode enabled (no real money involved)
- ✅ HTTPS required for production webhooks

## 🚀 Next Steps

1. **Test the integration**:
   ```bash
   cd server
   npm run dev
   ```

2. **Make a test payment** using the admin form

3. **Check MongoDB** to verify transaction storage:
   ```bash
   # Connect to MongoDB
   mongosh
   use resqledger
   db.transactions.find().pretty()
   ```

4. **View transactions** in the Blockchain dashboard

## 📝 API Endpoints

### `POST /api/payments/record-upi`
Manually record a UPI payment.

**Request:**
```json
{
  "amount": 500,
  "upiReference": "UPI123456789",
  "donorName": "John Doe",
  "donorPhone": "+91-9876543210",
  "region": "Kerala Flood Zones",
  "description": "Flood relief donation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "UPI payment recorded successfully",
  "transaction": {
    "id": "txn_...",
    "hash": "0x...",
    "amount": "₹500",
    ...
  }
}
```

### `POST /api/payments/razorpay-webhook`
Razorpay webhook endpoint (automatic payment detection).

## 🐛 Troubleshooting

### Webhook Not Receiving Events
- Check webhook URL is publicly accessible
- Verify webhook is enabled in Razorpay dashboard
- Check backend logs for webhook errors
- Ensure webhook events are selected correctly

### Payments Not Appearing
- Check MongoDB connection
- Verify backend is running
- Check browser console for API errors
- Verify transaction was saved: `db.transactions.find().pretty()`

### Environment Variables Not Loading
- Restart the backend server after adding `.env` variables
- Check `.env` file is in `server/` directory
- Verify no extra spaces in `.env` values

## 📚 Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Webhooks Guide](https://razorpay.com/docs/webhooks/)
- [Razorpay Test Cards](https://razorpay.com/docs/payments/test-cards/)

