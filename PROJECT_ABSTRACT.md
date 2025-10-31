# ResQ Ledger - Project Abstract & Presentation

## 🎯 Project Overview

**ResQ Ledger** is a comprehensive disaster relief management system that combines **AI-powered predictions** with **blockchain transparency** to ensure effective, corruption-free, and transparent distribution of aid during natural disasters in India.

### Core Mission
To revolutionize disaster relief operations by providing real-time AI-driven insights and immutable blockchain records for complete transparency in aid distribution.

---

## ✨ Key Features & Innovations

### 1. **Multi-Model AI Disaster Prediction System**
Real-time analysis across 17 disaster-prone regions in India using multiple AI/ML models:

#### AI Models Implemented:
- **Weather Analysis**: Random Forest, XGBoost, Linear Regression
  - Analyzes temperature, rainfall, wind speed, humidity, pressure
  - Calculates weather severity scores
  - Integrates with OpenWeatherMap API

- **Satellite Imagery Analysis**: CNN, U-Net, ResNet (Deep Learning)
  - Damage assessment from pre/post-disaster satellite images
  - Integrates multiple sources:
    - **NASA FIRMS**: Fire and flood detection (FREE API)
    - **Planet Insights**: High-resolution satellite imagery
    - **SentinelHub**: Alternative satellite data source

- **Social Media Sentiment Analysis**: Sentiment Analysis, LSTM, BERT (NLP)
  - Analyzes Twitter/X data for SOS messages
  - Determines urgency levels from public sentiment
  - Keyword-based disaster detection

- **Demographic Analysis**: Decision Tree, Regression
  - Population density assessment
  - Infrastructure analysis (hospitals, roads)
  - Elevation-based risk factors

#### Disaster Types Monitored:
1. **Floods** - 50km radius monitoring, water level tracking
2. **Cyclones** - IMD classification standards (Depression to Super Cyclonic Storm)
3. **Earthquakes** - USGS API integration, magnitude tracking
4. **Drought & Heatwaves** - IMD heatwave classification, rainfall deficit analysis

### 2. **Real Blockchain Integration (Polygon Amoy)**

#### Blockchain Features:
- ✅ **Real Blockchain Transactions** on Polygon Amoy testnet
- ✅ **Wallet Management** with QR codes for donations
- ✅ **Real-Time Transaction Monitoring** - automatic block detection
- ✅ **Immutable Records** - all transactions stored on blockchain
- ✅ **PolygonScan Verification** - every transaction verifiable on blockchain explorer
- ✅ **Smart Contract Visualization** - shows latest blockchain blocks

#### Transaction Flow:
1. User records payment with screenshot verification
2. System verifies UTR using OCR
3. Signs transaction with private key
4. Creates real blockchain transaction (0.0001 MATIC)
5. Waits for blockchain confirmation (2-5 seconds)
6. Displays transaction hash and block number
7. Updates Smart Contract Network visualization

### 3. **Screenshot Verification System** (NEW INNOVATION)

#### Anti-Fraud Mechanism:
- **OCR Technology**: Uses Tesseract.js to extract UTR from payment screenshots
- **Automatic Verification**: Compares extracted UTR with manually entered reference
- **Fraud Prevention**: Only creates blockchain transactions if UTR matches
- **Clear Error Messages**: Shows "UTR numbers don't match" if verification fails

#### How It Works:
1. User uploads UPI payment confirmation screenshot
2. System extracts UTR number using OCR
3. Compares with manually entered UPI Reference
4. **If Match**: Proceeds to sign and create blockchain transaction
5. **If No Match**: Blocks transaction and shows error

### 4. **MongoDB Atlas Integration**

#### Database Features:
- **Persistent Storage**: All transactions saved to MongoDB Atlas (cloud)
- **Automatic Indexing**: Optimized queries for fast lookups
- **Data Integrity**: Prevents duplicate transactions
- **Scalable**: Cloud-based MongoDB for reliability

#### Data Stored:
- Transaction details (hash, amount, donor, region)
- UPI payment references
- Payment method tracking
- Timestamps and status

### 5. **Payment Gateway Integration**

#### Supported Payment Methods:
- **UPI Payments** (with screenshot verification)
- **Razorpay Integration** (Cards, UPI, Net Banking)
- **Stripe Integration** (International payments)
- **Bank Account Details** (Direct transfers)
- **QR Code Generation** for easy donations

#### Payment Flow:
- Automatic payment detection via Razorpay webhooks
- Manual payment recording with verification
- Blockchain transaction creation for all payments

### 6. **Interactive Real-Time Dashboard**

#### Dashboard Components:
- **AI Metrics Cards**: Weather Severity, Satellite Damage, Social Urgency
- **Interactive Map**: Visual representation of 17 disaster-prone regions
- **Region Rankings**: Sorted by AI-calculated severity scores
- **Live Transaction Feed**: Real-time blockchain transaction updates
- **Status Indicators**: Critical, High, Medium, Low severity levels

#### Real-Time Updates:
- Predictions refresh every 30 seconds
- Transaction data updates every 2 seconds
- Live blockchain monitoring
- Auto-refreshing charts and metrics

---

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Query** for data fetching and caching
- **Recharts** for data visualization
- **React Router** for navigation
- **QR Code** generation for donations

### Backend
- **Node.js + Express** with TypeScript
- **MongoDB** with native driver (MongoDB Atlas)
- **Ethers.js** for blockchain integration
- **Tesseract.js** for OCR (screenshot verification)
- **Multer** for file uploads
- **Razorpay SDK** for payment gateway
- **Axios** for API calls

### AI/ML Integration
- **OpenWeatherMap API** - Real-time weather data
- **NASA FIRMS API** - Fire and flood detection
- **USGS Earthquake API** - Seismic activity monitoring
- **Twitter/X API** - Social media sentiment
- **Planet Labs API** - Satellite imagery
- **SentinelHub API** - Alternative satellite data

### Blockchain
- **Polygon Amoy** testnet
- **Ethers.js** for wallet and transaction management
- **PolygonScan** for transaction verification

---

## 📊 System Architecture

### Data Flow:
1. **Data Collection** → Multiple APIs (Weather, Satellite, Social Media)
2. **AI Processing** → ML models analyze and predict risks
3. **Dashboard Display** → Real-time visualization
4. **Payment Recording** → Screenshot verification + OCR
5. **Blockchain Storage** → Immutable transaction records
6. **Database Persistence** → MongoDB Atlas storage

### Key Services:
- `AIPredictionService` - Orchestrates all AI models
- `BlockchainService` - Manages blockchain transactions
- `OCRService` - Extracts UTR from screenshots
- `PaymentGatewayService` - Handles payment integrations
- `UPIPaymentService` - Processes UPI payments
- `WeatherService`, `SatelliteService`, `SocialMediaService` - Data collection

---

## 🎯 Problem Statement Solved

### Challenges Addressed:
1. **Lack of Transparency** → Blockchain ensures all transactions are verifiable
2. **Fraud & Corruption** → Screenshot verification prevents fake transactions
3. **Delayed Response** → Real-time AI predictions enable proactive action
4. **Inefficient Resource Allocation** → AI-driven severity rankings
5. **No Audit Trail** → Immutable blockchain records

### Solution Impact:
- ✅ **Transparency**: Every donation is verifiable on blockchain
- ✅ **Accountability**: Screenshot verification prevents fake entries
- ✅ **Proactive**: Real-time AI predictions enable early intervention
- ✅ **Efficient**: AI-driven prioritization of aid distribution
- ✅ **Trustworthy**: Public blockchain verification builds donor confidence

---

## 📈 Key Metrics & Statistics

### Dashboard Metrics:
- **Total Transactions**: Real-time count from MongoDB
- **Total Aid Distributed**: Calculated from all transaction amounts
- **Smart Contracts**: Current blockchain block number (real)
- **Avg. Processing Time**: ~2.3 seconds (blockchain confirmation time)

### Coverage:
- **17 Disaster-Prone Regions** monitored in real-time
- **4 Disaster Types**: Floods, Cyclones, Earthquakes, Drought/Heatwaves
- **Multiple AI Models**: 7+ different ML/DL models working together
- **Real-Time Updates**: Every 30 seconds for predictions

---

## 🔒 Security Features

### Blockchain Security:
- Private keys stored securely in `.env` (never in Git)
- Backend-only key management (never exposed to frontend)
- Testnet environment (no real money risk)
- Real blockchain verification

### Data Verification:
- Screenshot OCR verification prevents fake data
- UTR number matching ensures transaction authenticity
- Duplicate transaction prevention
- Hash-based duplicate detection

### API Security:
- CORS protection
- Input validation
- File upload size limits (10MB)
- Image type verification

---

## 🚀 Innovation Highlights

### Unique Features:
1. **Screenshot Verification**: First-of-its-kind OCR-based UTR verification for UPI payments
2. **Multi-Source AI**: Combines weather, satellite, social media, and demographic data
3. **Real Blockchain Integration**: Actual Polygon blockchain, not simulated
4. **Comprehensive Coverage**: 17 regions, 4 disaster types, 7+ AI models
5. **Real-Time Everything**: Live updates across all systems

### Technical Achievements:
- Seamless integration of multiple APIs
- Efficient MongoDB indexing for fast queries
- Real-time blockchain monitoring
- OCR processing with high accuracy
- Scalable cloud-based architecture

---

## 📱 User Interface Features

### Dashboard:
- Interactive map with hover effects
- Region cards with severity indicators
- AI metrics visualization
- Real-time status updates
- Color-coded severity levels

### Blockchain Page:
- Wallet address with QR code
- Payment recording form with screenshot upload
- Transaction ledger with verification status
- Smart Contract Network visualization
- PolygonScan links for verification

### Payment Form:
- Drag-and-drop screenshot upload
- Image preview
- Real-time OCR processing feedback
- Clear error messages
- Success notifications with blockchain links

---

## 🔮 Future Enhancements

### Potential Additions:
- Mobile app for field workers
- Automated aid distribution based on AI predictions
- Smart contracts for automatic fund release
- Integration with government databases
- Machine learning model training on historical data
- Multi-language support
- SMS/WhatsApp notifications

---

## 📝 API Endpoints

### Core Endpoints:
- `GET /api/predictions` - AI predictions for all regions
- `GET /api/transactions` - Blockchain transaction data
- `GET /api/blockchain/wallet` - Wallet information
- `POST /api/payments/record-upi` - Record payment with screenshot verification
- `GET /api/payments/options` - Payment method options
- `POST /api/payments/razorpay-webhook` - Automatic payment detection
- `GET /api/health` - System health check

---

## 🎓 Presentation Points

### For Judges/Demo:
1. **Show Real-Time Predictions**: Demonstrate live AI updates
2. **Upload Screenshot**: Show OCR verification in action
3. **Show Blockchain Transaction**: Display real transaction on PolygonScan
4. **Interactive Map**: Click on regions to see detailed analysis
5. **Transaction Ledger**: Show transparent record of all donations
6. **Multi-Disaster Coverage**: Highlight comprehensive monitoring

### Key Talking Points:
- "Real blockchain integration, not simulated"
- "OCR-powered fraud prevention"
- "Multi-model AI for comprehensive disaster prediction"
- "Complete transparency with verifiable blockchain records"
- "Real-time monitoring of 17 regions across India"
- "MongoDB Atlas for persistent, scalable storage"

---

## 📊 Technical Specifications

### Performance:
- Predictions update: 30 seconds
- Transaction updates: 2 seconds
- Blockchain confirmation: 2-5 seconds
- OCR processing: 3-10 seconds (depending on image)
- Database queries: Optimized with indexes

### Scalability:
- Cloud-based MongoDB (Atlas)
- Stateless backend design
- Horizontal scaling ready
- CDN-ready frontend build

### Reliability:
- Error handling at all levels
- Fallback mechanisms
- Real-time monitoring
- Health check endpoints

---

## 🏆 Hackathon Highlights

### Why This Project Stands Out:
1. **Complete Solution**: End-to-end disaster management system
2. **Real Technology**: Actual blockchain, not simulated
3. **Innovation**: OCR verification prevents fraud
4. **Comprehensive**: Multiple AI models, multiple disaster types
5. **Production-Ready**: MongoDB integration, error handling, scalability

### Demo Flow:
1. Show dashboard with live AI predictions
2. Upload payment screenshot → OCR extraction → Verification
3. Create blockchain transaction → Show PolygonScan link
4. Display transaction in Smart Contract Network
5. Show MongoDB persistence

---

This abstract covers all major aspects of your ResQ Ledger project and is ready for presentation! 🚀

