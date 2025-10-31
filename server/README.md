# ResQ Ledger Backend API Server

Backend API server for ResQ Ledger disaster relief management system, providing real-time AI predictions and blockchain transaction data.

## Setup

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure Environment Variables**
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=3001
   NODE_ENV=development
   
   # Weather API (Optional - falls back to simulated data if not provided)
   OPENWEATHER_API_KEY=your_openweather_api_key_here
   
   # Twitter/X API (Optional - for social media sentiment analysis)
   TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
   
   # Polygon Amoy Blockchain (Optional - for real blockchain integration)
   POLYGON_PRIVATE_KEY=your_polygon_private_key_here
   
   # Payment Gateway (Optional - Razorpay or Stripe)
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   
   # CORS Origins
   CORS_ORIGIN=http://localhost:5173
   ```

   **Getting API Keys:**
   - **OpenWeatherMap**: Sign up at https://openweathermap.org/api (Free tier available)
   - **Twitter/X API**: Requires Twitter Developer account (Optional)
   - **Polygon Private Key**: See [BLOCKCHAIN_SETUP.md](./BLOCKCHAIN_SETUP.md) for detailed instructions
   - **Payment Gateways**: Razorpay (https://razorpay.com) or Stripe (https://stripe.com)

3. **Run the Server**
   
   Development mode:
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### `GET /api/predictions`
Returns AI predictions for disaster-affected regions including:
- Weather severity scores
- Satellite damage assessment
- Social media urgency metrics
- Region rankings based on AI analysis

**Response:**
```json
{
  "regions": [
    {
      "id": "A",
      "name": "Kerala Flood Zones",
      "lat": 10.8505,
      "lon": 76.2711,
      "severity": 87,
      "population": "2.5M",
      "aid": "$5.2M",
      "status": "critical",
      "weatherData": {...},
      "satelliteDamage": 82,
      "socialUrgency": 75
    }
  ],
  "aiMetrics": [...],
  "lastUpdated": "2024-01-15T14:32:18.000Z"
}
```

### `GET /api/transactions`
Returns blockchain transaction data:
- All verified and pending transactions
- Total aid distributed
- Smart contract statistics
- Wallet address and balance (if connected)

**Response:**
```json
{
  "transactions": [...],
  "totalTransactions": 1247,
  "totalAid": "$48.3M",
  "smartContracts": 156,
  "avgProcessingTime": "2.3s",
  "walletAddress": "0x...",
  "walletBalance": "100.5",
  "isRealBlockchain": true
}
```

### `GET /api/blockchain/wallet`
Returns wallet information for donations:
- Wallet address
- Current balance
- Network information
- Connection status

### `POST /api/payments/create`
Create a payment order (Payment Gateway):
- Supports UPI, Cards, Net Banking
- Returns payment link or QR code

### `POST /api/payments/verify`
Verify payment status from gateway

### `GET /api/health`
Health check endpoint

## AI Models

The system uses multiple AI/ML models:

1. **Weather Analysis** (ML Models: Random Forest, XGBoost, Linear Regression)
   - Processes real-time weather data
   - Calculates severity scores based on rainfall, wind speed, humidity

2. **Satellite Imagery** (DL Models: CNN, U-Net, ResNet)
   - Analyzes pre/post-disaster satellite images
   - Estimates damage extent and affected areas

3. **Social Media Sentiment** (NLP Models: Sentiment Analysis, LSTM, BERT)
   - Processes tweets and SOS messages
   - Determines urgency levels from public sentiment

4. **Demographic Analysis** (ML Models: Decision Tree, Regression)
   - Ranks regions by population density and infrastructure
   - Estimates aid requirements

## Data Sources

- **Weather**: OpenWeatherMap API (real-time weather data)
- **Satellite**: SentinelHub, NASA FIRMS (when configured)
- **Social Media**: Twitter/X API (when configured)
- **Demographics**: Government open data portals (pre-configured regions)

## Architecture

- **Framework**: Express.js with TypeScript
- **Data Processing**: Real-time predictions updated every 30 seconds
- **Caching**: In-memory cache with 30-second TTL
- **Blockchain**: 
  - **Real Mode**: Polygon Amoy testnet integration (when `POLYGON_PRIVATE_KEY` is set)
  - **Simulated Mode**: Realistic fake data (when private key not set)
  - Real-time transaction monitoring
  - PolygonScan links for transparency

## Blockchain Integration

The system supports **real blockchain integration** with Polygon Amoy (testnet):

- ✅ **Real Transactions**: Fetches actual transactions from blockchain
- ✅ **Real-Time Monitoring**: Monitors new blocks automatically
- ✅ **Wallet Management**: Shows wallet address and balance
- ✅ **QR Codes**: Generate QR codes for easy donations
- ✅ **PolygonScan Links**: All transactions link to blockchain explorer

**Setup Instructions**: See [BLOCKCHAIN_SETUP.md](./BLOCKCHAIN_SETUP.md) for detailed setup guide.

**Security**: 
- Private keys are stored in `.env` (never in Git)
- Keys are backend-only (never exposed to frontend)
- Testnet only (no real money at risk)

## Notes

- If API keys are not provided, the system falls back to realistic simulated data
- Predictions are automatically refreshed every 30 seconds
- Blockchain transactions:
  - **Real Mode**: Updates when new transactions detected on blockchain
  - **Simulated Mode**: Generated every 10 seconds for demonstration
