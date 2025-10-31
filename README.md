# ResQ Ledger - Disaster Relief Management System

ResQ Ledger is a disaster relief management system powered by AI and Blockchain, designed to ensure effective, transparent, and corruption-free distribution of aid during natural disasters.

## Features

- **Multi-Model AI**: Weather prediction, satellite imagery analysis, and social media sentiment tracking
- **Real-Time Predictions**: Live updates every 30 seconds with AI-calculated severity scores
- **Blockchain Transparency**: Immutable smart contract transactions
- **Interactive Dashboard**: Visual map showing affected regions with real-time data
- **Automated Aid Distribution**: Smart contracts automatically release aid based on AI-verified conditions

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- React Query for data fetching

### Backend
- Node.js + Express
- TypeScript
- Real-time AI prediction services
- Blockchain transaction simulation

## Quick Start

### 1. Install Frontend Dependencies

```bash
cd resq-intel-dash-main
npm install
```

### 2. Start Backend Server

```bash
cd server
npm install
npm run dev
```

The backend server will run on `http://localhost:3001`

### 3. Start Frontend Development Server

```bash
# In the resq-intel-dash-main directory
npm run dev
```

The frontend will run on `http://localhost:5173` (or port 8080 as configured)

## Configuration

### Backend Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=3001
NODE_ENV=development
OPENWEATHER_API_KEY=your_key_here  # Optional
TWITTER_BEARER_TOKEN=your_token_here  # Optional
CORS_ORIGIN=http://localhost:5173
```

**Note**: If API keys are not provided, the system uses realistic simulated data for demonstration.

### Frontend API Configuration

The frontend automatically connects to `http://localhost:3001` by default. To change this, set the `VITE_API_URL` environment variable:

```bash
VITE_API_URL=http://your-api-url:3001 npm run dev
```

## Project Structure

```
resq-intel-dash-main/
├── src/                    # Frontend source code
│   ├── pages/             # Page components
│   ├── components/        # Reusable components
│   ├── lib/               # API client and utilities
│   └── hooks/             # React hooks
├── server/                 # Backend server
│   ├── src/
│   │   ├── services/      # AI prediction services
│   │   ├── config/        # Configuration files
│   │   └── index.ts       # Express server
│   └── package.json
└── package.json
```

## API Endpoints

### `GET /api/predictions`
Returns real-time AI predictions for disaster-affected regions.

### `GET /api/transactions`
Returns blockchain transaction data.

### `GET /api/health`
Health check endpoint.

## AI Models Used

1. **Weather Analysis**: Random Forest, XGBoost, Linear Regression
2. **Satellite Imagery**: CNN, U-Net, ResNet
3. **Social Media Sentiment**: Sentiment Analysis, LSTM, BERT
4. **Demographic Analysis**: Decision Tree, Regression

## Data Sources

- **Weather**: OpenWeatherMap API
- **Satellite**: SentinelHub, NASA FIRMS
- **Social Media**: Twitter/X API
- **Demographics**: Government open data portals

## Development

### Frontend Development
```bash
npm run dev
```

### Backend Development
```bash
cd server
npm run dev
```

### Building for Production
```bash
# Frontend
npm run build

# Backend
cd server
npm run build
npm start
```

## Features in Detail

### Real-Time Dashboard
- AI metrics: Weather Severity, Satellite Damage, Social Urgency
- Interactive map with affected regions
- Live transaction feed
- Region rankings based on AI predictions

### Blockchain Transparency
- Immutable transaction ledger
- Smart contract visualization
- Real-time transaction updates
- Public verification of all aid distribution

## Notes

- The system uses simulated data if API keys are not configured
- Predictions update every 30 seconds
- Transactions are generated every 10 seconds for demonstration
- In production, replace simulated services with actual blockchain and AI model integrations

## License

This project is for hackathon/demonstration purposes.