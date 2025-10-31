# Blockchain Setup Guide - Polygon Amoy (Testnet)

This guide will help you set up real blockchain integration with Polygon Amoy testnet for ResQ Ledger.

## Prerequisites

1. **Polygon Amoy Testnet Account**
   - Polygon Amoy is a testnet (free, no real money)
   - Get testnet MATIC from faucet: https://faucet.polygon.technology/

2. **Wallet Private Key**
   - You'll need a wallet with a private key
   - Can use MetaMask or generate a new wallet
   - **IMPORTANT**: Never share your private key or commit it to Git!

## Step 1: Get Polygon Amoy Testnet MATIC

1. **Install MetaMask** (if you don't have it)
   - Download from: https://metamask.io/
   - Create or import a wallet

2. **Add Polygon Amoy Testnet**
   - Open MetaMask
   - Go to Settings → Networks → Add Network
   - Network Name: `Polygon Amoy`
   - RPC URL: `https://rpc-amoy.polygon.technology`
   - Chain ID: `80002`
   - Currency Symbol: `MATIC`
   - Block Explorer: `https://amoy.polygonscan.com`

3. **Get Testnet MATIC**
   - Visit: https://faucet.polygon.technology/
   - Enter your wallet address
   - Request testnet MATIC (free)

## Step 2: Get Your Private Key

⚠️ **SECURITY WARNING**: Private keys are sensitive. Never share them publicly or commit to Git!

### Option A: Export from MetaMask
1. Open MetaMask
2. Click account icon → Account details
3. Click "Show private key"
4. Enter your password
5. Copy the private key (starts with `0x`)

### Option B: Generate New Wallet (Recommended for Testnet)
You can use ethers.js to generate a new wallet:

```javascript
const { ethers } = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
```

Save both address and private key securely.

## Step 3: Add to Environment Variables

1. **Open `server/.env` file**

2. **Add your Polygon private key**:
   ```env
   # Polygon Amoy Blockchain (Testnet)
   POLYGON_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
   ```

   Example:
   ```env
   POLYGON_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
   ```

3. **Optional: Payment Gateway Keys**
   If you want to use Razorpay or Stripe:
   ```env
   # Razorpay (Optional)
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   
   # Stripe (Optional)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

## Step 4: Restart Server

After adding the private key:

```bash
cd server
npm run dev
```

## Step 5: Verify Connection

Check the server console logs. You should see:

```
[Polygon] ✅ Connected to Polygon Amoy testnet
[Polygon] ✅ Wallet connected - Address: 0x...
[Blockchain] ✅ Connected to Polygon Amoy - Balance: X.XXXX MATIC
[Blockchain] ✅ Loaded X real transactions
```

If you see:
```
[Blockchain] ⚠️ Using simulated transactions - Add POLYGON_PRIVATE_KEY to .env for real blockchain
```
Then the private key wasn't loaded correctly. Check:
- `.env` file is in `server/` directory
- Private key format is correct (starts with `0x`)
- No extra spaces or quotes around the private key
- Server was restarted after adding the key

## How It Works

### Real Blockchain Mode (When Private Key is Added)

- ✅ **Real Transactions**: Fetches actual transactions from Polygon Amoy
- ✅ **Real-Time Monitoring**: Monitors new blocks for incoming transactions
- ✅ **Wallet Balance**: Shows actual MATIC balance
- ✅ **PolygonScan Links**: All transactions link to real blockchain explorer
- ✅ **QR Code**: Wallet address QR code for easy donations

### Simulated Mode (When Private Key is NOT Added)

- ⚠️ **Simulated Transactions**: Uses realistic fake data
- ⚠️ **No Real Blockchain**: Doesn't connect to Polygon Amoy
- ✅ **Still Functional**: Dashboard works perfectly for demos
- ℹ️ **Clear Indicator**: Shows "Using Simulated Data" badge

## Security Best Practices

1. **Never commit `.env` to Git**
   - The `.env` file is already in `.gitignore`
   - Always verify before pushing to GitHub

2. **Use Testnet Only**
   - Polygon Amoy is a testnet (no real money)
   - For production, use mainnet with secure key management

3. **Rotate Keys Regularly**
   - If a private key is exposed, generate a new one
   - Never reuse exposed keys

4. **Backend Only**
   - Private keys stay in backend (server/.env)
   - Never expose keys to frontend

## Testing Transactions

### Option 1: Send Test MATIC
1. Get testnet MATIC from faucet
2. Send to your wallet address
3. Transaction will appear on dashboard automatically

### Option 2: Use Testnet Explorer
- Visit: https://amoy.polygonscan.com
- Search for your wallet address
- View all transactions

## Troubleshooting

### "Provider not initialized"
- Check internet connection
- Polygon Amoy RPC might be temporarily down
- Try again after a few minutes

### "Error connecting wallet"
- Verify private key format (must start with `0x`)
- Check for extra spaces in `.env` file
- Ensure private key is for Polygon Amoy network

### "No transactions found"
- This is normal if wallet is new
- Send some test MATIC to generate transactions
- Real transactions only appear after receiving/sending funds

### Transactions not updating
- Real blockchain monitoring checks every block (~2 seconds)
- API endpoint refreshes every 10 seconds
- Be patient - transactions take time to confirm

## Next Steps

Once blockchain is connected:

1. **Smart Contracts**: Deploy contracts for automatic aid distribution
2. **Payment Gateway**: Integrate Razorpay/Stripe for traditional payments
3. **Multi-Signature**: Set up multi-sig wallet for security
4. **Region Linking**: Connect transactions to specific disaster regions

## Resources

- **Polygon Amoy Docs**: https://docs.polygon.technology/docs/develop/amoy/get-started/
- **PolygonScan Explorer**: https://amoy.polygonscan.com
- **Faucet**: https://faucet.polygon.technology/
- **ethers.js Docs**: https://docs.ethers.org/v6/

