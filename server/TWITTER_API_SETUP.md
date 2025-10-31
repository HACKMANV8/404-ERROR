# Twitter/X API Setup Guide

## Overview

The ResQ Ledger system integrates Twitter/X API v2 for real-time social media sentiment analysis. This provides real-time urgency scores and sentiment from tweets related to disasters and affected regions.

---

## Step 1: Apply for Twitter Developer Account

1. **Go to Twitter Developer Portal**
   - Visit: https://developer.twitter.com/
   - Click "Sign up" or "Apply" if you already have a Twitter account

2. **Create Developer Account**
   - Sign in with your Twitter/X account
   - Fill out the application form:
     - Use case: "Academic Research" or "Building a disaster relief monitoring system"
     - Describe: "Monitoring social media for disaster-related posts to help emergency response"
     - Accept terms and submit

3. **Wait for Approval**
   - Approval can take a few hours to a few days
   - You'll receive an email when approved

---

## Step 2: Create an App

1. **Go to Developer Portal**
   - Visit: https://developer.twitter.com/en/portal/dashboard

2. **Create New App**
   - Click "Create App" or "Add App"
   - Name: `ResQ Ledger Disaster Monitor`
   - Description: `Social media sentiment analysis for disaster relief`

3. **Get Bearer Token**
   - After creating app, go to "Keys and Tokens" tab
   - Find "Bearer Token" section
   - Click "Generate" or "Regenerate"
   - **IMPORTANT**: Copy the Bearer Token immediately - you can't see it again!
   - It looks like: `AAAAAAAAAAAAAAAAAAAAAMLheAAAAAAA0%2BuSeid%2BULvsea4JtiGRiSDSJSI%3DEUifiRBkKG5E2XzMDjRfl76ZC9Ub0wnz4XsNiRVBChTYbJcE3F`

---

## Step 3: API Access Level

### Free Tier (Essential):
- **Cost**: FREE
- **Rate Limits**: 
  - 10,000 tweets/month
  - 10 requests/15 minutes for search
- **Perfect for**: Development and testing

### Paid Tiers:
- **Basic**: $100/month - 10,000 tweets/month
- **Pro**: $5,000/month - Higher limits
- **Enterprise**: Custom pricing

**For your project**: Free tier is sufficient for monitoring 4 regions!

---

## Step 4: Add Bearer Token to .env

Open `server/.env` and add:

```env
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

Replace `your_bearer_token_here` with your actual Bearer Token.

---

## Step 5: Restart Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## How It Works

### Search Queries:
The system searches for tweets containing:
- Region name (e.g., "Kerala", "Mumbai")
- Disaster keywords: flood, cyclone, earthquake, emergency, SOS, rescue
- Language: English only
- Excludes: Retweets (only original tweets)

### Sentiment Analysis:
- **Negative Keywords**: flood, damage, destroyed, stuck, emergency, SOS
- **Urgent Keywords**: SOS, HELP, URGENT, CRITICAL, TRAPPED
- **Positive Keywords**: help, rescue, safe, saved, grateful
- Calculates sentiment on -1 to +1 scale (-1 = very negative, +1 = very positive)

### Urgency Score:
Combines:
- **Tweet Volume**: More tweets = higher urgency (0-50 points)
- **Sentiment**: More negative = higher urgency (0-30 points)
- **Engagement**: More retweets/likes = higher urgency (0-20 points)

---

## What You'll Get

Once configured, the system will:
- ✅ Fetch real tweets about disasters in monitored regions
- ✅ Analyze sentiment from actual social media posts
- ✅ Calculate urgency scores based on tweet activity
- ✅ Extract trending hashtags (#FloodRelief, #SOS, etc.)
- ✅ Show real-time social media urgency on dashboard

---

## Troubleshooting

### "401 Unauthorized"
- Check if Bearer Token is correct in `.env`
- Make sure there are no extra spaces
- Regenerate Bearer Token if needed

### "429 Rate Limit Exceeded"
- Free tier allows 10 requests per 15 minutes
- System automatically falls back to simulated data
- Consider upgrading to Basic tier for higher limits

### "No tweets found"
- May be no recent disaster-related tweets in that region
- System falls back to simulated data
- Try during actual disaster events for real data

### Approval Taking Too Long
- Twitter approval can take 1-3 days
- Use simulated data until approved
- Contact Twitter support if taking longer

---

## Cost Summary

- **Developer Account**: FREE
- **Essential API Access**: FREE (10K tweets/month)
- **Total Cost**: $0 for development

---

## Next Steps

1. Apply for Twitter Developer account
2. Wait for approval (usually 1-3 days)
3. Create app and get Bearer Token
4. Add to `.env` file
5. Restart server
6. Real-time social media sentiment analysis will activate!

---

**Note**: Until you have a Bearer Token, the system will use realistic simulated data based on region severity. This is perfectly fine for development and testing!
