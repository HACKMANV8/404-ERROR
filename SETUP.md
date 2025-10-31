# Setup Guide - ResQ Ledger

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Step-by-Step Setup

### 1. Install Frontend Dependencies

```bash
cd resq-intel-dash-main
npm install
```

### 2. Set Up Backend Server

```bash
cd server
npm install
```

### 3. Configure Backend (Optional)

Create a `.env` file in the `server` directory:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Optional: For real weather data
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Optional: For real social media sentiment
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
```

**Note**: If you don't provide API keys, the system will use realistic simulated data for demonstration.

### 4. Start the Backend Server

In the `server` directory:

```bash
npm run dev
```

You should see:
```
🚀 ResQ Ledger API server running on http://localhost:3001
```

### 5. Start the Frontend (in a new terminal)

In the `resq-intel-dash-main` directory:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or port configured in vite.config.ts)

### 6. Open the Application

Navigate to `http://localhost:5173` in your browser.

## What You'll See

### Dashboard Page
- **AI Metrics**: Real-time weather severity, satellite damage, and social urgency scores
- **Interactive Map**: Regions plotted with their severity levels (based on lat/lon coordinates)
- **Aid Distribution**: List of regions with their population, severity, and aid amounts
- **Live Transactions**: Real-time blockchain transaction feed

### Blockchain Page
- **Statistics**: Total transactions, aid distributed, smart contracts, processing times
- **Blockchain Visualization**: Visual representation of blocks
- **Transaction Ledger**: Complete list of all verified and pending transactions

## API Endpoints

The backend provides:

- `GET /api/predictions` - AI predictions and region data
- `GET /api/transactions` - Blockchain transactions
- `GET /api/health` - Health check

## Real-Time Updates

- **Predictions**: Updated every 30 seconds
- **Transactions**: Updated every 10 seconds
- **Frontend**: Automatically refetches data using React Query

## Getting API Keys (Optional)

### OpenWeatherMap API
1. Sign up at https://openweathermap.org/api
2. Get your free API key
3. Add to `.env` file: `OPENWEATHER_API_KEY=your_key`

### Twitter/X API (Optional)
1. Apply for Twitter Developer account
2. Create an app and get Bearer Token
3. Add to `.env` file: `TWITTER_BEARER_TOKEN=your_token`

## Troubleshooting

### Backend won't start
- Make sure you've run `npm install` in the `server` directory
- Check if port 3001 is already in use
- Verify Node.js version is 18+

### Frontend can't connect to API
- Make sure backend is running on port 3001
- Check CORS settings in backend
- Verify API URL in `src/lib/api.ts`

### No data showing
- Check browser console for errors
- Verify backend is running and accessible
- Check network tab for API calls

## Development Notes

- The system uses **simulated data** if API keys are not provided
- Predictions are cached for 30 seconds to reduce API calls
- Regions are based on real Indian disaster-prone areas:
  - Kerala Flood Zones
  - Mumbai Coastal Area
  - Assam Flood Plains
  - Odisha Cyclone Zone

## Next Steps

1. Replace simulated services with actual ML models
2. Integrate real blockchain (Ethereum, Polygon, etc.)
3. Connect to real satellite imagery APIs
4. Add authentication and user management
5. Deploy to production
