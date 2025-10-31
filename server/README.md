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
   
   # CORS Origins
   CORS_ORIGIN=http://localhost:5173
   ```

   **Getting API Keys:**
   - **OpenWeatherMap**: Sign up at https://openweathermap.org/api (Free tier available)
   - **Twitter/X API**: Requires Twitter Developer account (Optional)

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

**Response:**
```json
{
  "transactions": [...],
  "totalTransactions": 1247,
  "totalAid": "$48.3M",
  "smartContracts": 156,
  "avgProcessingTime": "2.3s"
}
```

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
- **Blockchain**: Simulated smart contract transactions (can be replaced with real blockchain integration)

## Notes

- If API keys are not provided, the system falls back to realistic simulated data
- Predictions are automatically refreshed every 30 seconds
- Blockchain transactions are generated every 10 seconds for demonstration
