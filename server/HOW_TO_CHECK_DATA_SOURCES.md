# How to Check if Data Sources Are Real or Simulated

## Quick Guide

After restarting your server, check the terminal logs. You'll see clear indicators:

### ✅ REAL Data Indicators:
- `[Weather] ✅ Using REAL data - ...`
- `[Twitter] Found X real tweets`
- `[Twitter] ✅ Using REAL data - Sentiment: X, Urgency: Y`
- `[NASA FIRMS] Found X fire events`

### ⚠️ SIMULATED Data Indicators:
- `[Weather] API key not configured, using simulated data`
- `[Twitter] API not configured, using simulated data`
- `[Planet] API endpoint not found` (falls back to simulated)

---

## Detailed Status Check

### 1. Weather Data (OpenWeatherMap)

**REAL if you see:**
```
[Weather] ✅ Using REAL data - Rain, Temp: 28°C, Rain: 15.5mm
```

**SIMULATED if you see:**
```
[Weather] API key not configured, using simulated data
```

**Check:** Your OpenWeatherMap API key is in `.env` and active.

---

### 2. Satellite Data

**NASA FIRMS (Fire Detection):**
- **REAL:** `[NASA FIRMS] Found X fire events`
- **SIMULATED:** No fire events found or API error
- **Status:** This is FREE and should work automatically

**Planet Insights:**
- **REAL:** `[Planet] Found imagery`
- **SIMULATED:** `[Planet] API endpoint not found` (404 errors are OK - Planet Insights uses different API)
- **Note:** 404 errors are expected if Planet Insights API structure differs

**SentinelHub:**
- Only works if you have SentinelHub credentials configured

---

### 3. Social Media (Twitter/X)

**REAL if you see:**
```
[Twitter] Kerala Flood Zones: Fetching real tweets...
[Twitter] Kerala Flood Zones: Found 15 real tweets
[Twitter] Kerala Flood Zones: ✅ Using REAL data - Sentiment: -0.65, Urgency: 72
```

**SIMULATED if you see:**
```
[Twitter] Kerala Flood Zones: API not configured, using simulated data
```

**Check:** 
1. Make sure `.env` has `TWITTER_BEARER_TOKEN=your_token`
2. **Restart server** after adding token
3. Token should be URL-encoded (with % signs) - that's normal

---

## Current Status (Based on Your Setup)

### ✅ Working (REAL Data):
- **Weather:** OpenWeatherMap API configured ✅
- **NASA FIRMS:** Free, no API key needed ✅

### ⚠️ Partially Working:
- **Twitter:** Bearer Token added, but needs server restart
- **Planet Insights:** 404 errors expected (different API structure)

### 🔄 Fallback Working:
- System gracefully falls back to simulated data if APIs fail
- No errors break the system

---

## How to Verify After Restart

1. **Restart server:**
   ```bash
   # Stop (Ctrl+C)
   npm run dev
   ```

2. **Watch terminal logs:**
   - Look for `✅ REAL` messages
   - Look for `⚠️ SIMULATED` messages
   - Count how many say "REAL" vs "SIMULATED"

3. **Expected Output:**
   ```
   [Weather] ✅ Using REAL data - Rain, Temp: 28°C, Rain: 15.5mm
   [Twitter] Kerala Flood Zones: Fetching real tweets...
   [Twitter] Kerala Flood Zones: Found 12 real tweets
   [Twitter] Kerala Flood Zones: ✅ Using REAL data - Sentiment: -0.45, Urgency: 58
   [NASA FIRMS] Found 0 fire events
   [Planet] API endpoint not found - Planet Insights may use different API structure
   ```

---

## Summary

**After restart, you should see:**
- ✅ Weather: REAL (OpenWeatherMap working)
- ✅ NASA FIRMS: REAL (automatic, no config needed)
- ✅ Twitter: Should be REAL (after restart with token)
- ⚠️ Planet: Expected 404 (different API structure) - falls back gracefully

The system is designed to work even if some APIs fail - it uses the best available data source for each metric!
