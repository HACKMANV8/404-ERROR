# Satellite Data API Setup Guide

## Overview

The ResQ Ledger system integrates two satellite data sources:

1. **NASA FIRMS** (FREE - No API key needed!) ✅
2. **SentinelHub** (Free tier available, requires registration)

---

## 1. NASA FIRMS (Fire Information for Resource Management System)

### ✅ Already Working!
- **Cost**: FREE
- **API Key**: NOT REQUIRED
- **Status**: Already integrated and working

### What it provides:
- Real-time fire detection
- Active fire/flood event locations
- Event confidence scores
- Data updates multiple times per day

### How it works:
- Automatically fetches fire data for India
- Detects fires within 50km of monitored regions
- Calculates damage scores based on fire density and confidence

**No setup needed - it's already working!**

---

## 2. SentinelHub (Satellite Imagery Analysis)

### Setup Required (Optional)

#### Step 1: Create Account
1. Go to: https://www.sentinel-hub.com/
2. Click "Sign Up" (top right)
3. Create a free account

#### Step 2: Create OAuth Client
1. After signing in, go to: https://apps.sentinel-hub.com/dashboard/#/account
2. Navigate to "OAuth clients" section
3. Click "Create new OAuth client"
4. Fill in:
   - **Name**: ResQ Ledger
   - **Redirect URL**: `http://localhost:3001` (for development)
   - **Scopes**: Select "SH" (Sentinel Hub)
5. Click "Create"

#### Step 3: Get Credentials
1. After creation, you'll see:
   - **Client ID**: (copy this)
   - **Client Secret**: (copy this - shown only once!)
2. **Important**: Save the Client Secret immediately - you can't see it again!

#### Step 4: Add to .env File
Open `server/.env` and add:

```env
SENTINELHUB_CLIENT_ID=your_client_id_here
SENTINELHUB_CLIENT_SECRET=your_client_secret_here
```

#### Step 5: Restart Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### What it provides:
- High-resolution Sentinel-2 satellite imagery
- NDWI (Normalized Difference Water Index) for flood detection
- NDVI (Normalized Difference Vegetation Index) for vegetation damage
- Before/after comparison imagery
- Cloud coverage analysis

### Free Tier Limits:
- Limited requests per month
- Sufficient for development and testing
- Upgrade required for high-volume production use

---

## How the System Works

### Data Priority:
1. **First**: NASA FIRMS data (always checked - FREE)
2. **Second**: SentinelHub imagery (if credentials configured)
3. **Fallback**: Weather-based estimation (if APIs unavailable)

### Damage Calculation:
The system combines:
- Fire/flood event density from NASA FIRMS
- Water level changes from SentinelHub NDWI
- Vegetation loss from SentinelHub NDVI
- Infrastructure damage indicators
- Weather severity correlation

### Confidence Scores:
- **NASA FIRMS only**: 70-85% confidence
- **SentinelHub only**: 80-95% confidence
- **Both sources**: 90-95% confidence
- **Weather-based fallback**: 50-60% confidence

---

## Testing

### Check if NASA FIRMS is working:
Look at the server terminal - you should see:
- No errors when fetching FIRMS data
- Damage scores calculated from real fire events (if any active)

### Check if SentinelHub is working:
1. Add credentials to `.env`
2. Restart server
3. Check terminal for authentication success
4. Look for "SentinelHub" in damage source indicators

---

## Troubleshooting

### NASA FIRMS not working:
- Check internet connection
- API endpoint may be temporarily down (rare)
- System automatically falls back to weather-based estimation

### SentinelHub authentication errors:
- Verify Client ID and Secret are correct in `.env`
- Check for typos or extra spaces
- Make sure you restarted the server after adding credentials
- Wait a few minutes after creating OAuth client (activation delay)

### No satellite data showing:
- Check if there are active fires/floods in the region
- SentinelHub may have no recent cloud-free imagery
- System will use weather-based estimation (which is still valuable!)

---

## Cost Summary

- **NASA FIRMS**: FREE ✅ (No setup needed)
- **SentinelHub**: FREE tier available (Registration + setup required)
- **Total Cost**: $0 for development/testing

---

## Next Steps

1. ✅ **NASA FIRMS**: Already integrated - no action needed
2. ⏳ **SentinelHub**: Optional - add credentials for enhanced imagery analysis

The system works great with just NASA FIRMS! SentinelHub adds extra detail but isn't required.
