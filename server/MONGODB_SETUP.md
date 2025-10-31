# MongoDB Setup Guide

## What I've Fixed:

✅ **Automatic Transaction Migration**: All existing transactions will now be saved to MongoDB automatically when the server starts

✅ **Better Error Messages**: Clear instructions on how to fix MongoDB connection issues

## Two Options for MongoDB:

### Option 1: Local MongoDB (Windows)

If you have MongoDB installed locally:

1. **Start MongoDB Service:**
   ```bash
   # Check if MongoDB is running
   # In Windows, check Services:
   # - Press Win+R, type "services.msc"
   # - Look for "MongoDB Server" service
   # - If not running, right-click and "Start"
   ```

2. **Or start MongoDB manually:**
   ```bash
   # If MongoDB is installed but not as a service:
   mongod --dbpath "C:\data\db"
   ```

3. **Your .env already has:**
   ```
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB_NAME=resqledger
   ```

### Option 2: MongoDB Atlas (Cloud - Recommended for Hackathon)

MongoDB Atlas is free and easier to set up:

1. **Create Free Account:**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up (free tier: 512 MB storage)

2. **Create a Cluster:**
   - Choose "Free" (M0) cluster
   - Choose a region close to you
   - Click "Create Cluster"

3. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`

4. **Update .env:**
   ```bash
   # Replace MONGODB_URI with your Atlas connection string
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/resqledger?retryWrites=true&w=majority
   MONGODB_DB_NAME=resqledger
   ```

5. **Allow Network Access:**
   - In Atlas, go to "Network Access"
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0) for development
   - Or add your specific IP

## After Setup:

1. **Restart your server:**
   ```bash
   npm run dev
   ```

2. **Check the logs:**
   - You should see: `✅ MongoDB connected successfully`
   - You should see: `🔄 Migrating X transactions to MongoDB...`
   - You should see: `✅ Migration complete: X migrated`

3. **All transactions will now:**
   - ✅ Save to MongoDB automatically
   - ✅ Load from MongoDB on server restart
   - ✅ Persist across server restarts

## Troubleshooting:

If you see `⚠️ MongoDB connection failed`:

1. **Local MongoDB:**
   - Make sure MongoDB service is running
   - Check if port 27017 is available
   - Try: `netstat -an | grep 27017`

2. **MongoDB Atlas:**
   - Check your connection string is correct
   - Make sure IP address is whitelisted
   - Make sure database user has correct permissions

## Which Should You Use?

- **For Hackathon/Demo:** MongoDB Atlas (cloud) - easier, no setup needed
- **For Local Development:** Local MongoDB if you have it installed

**If you want to use MongoDB Atlas, just:**
1. Create account at https://mongodb.com/cloud/atlas
2. Get your connection string
3. Give me the connection string (or update .env yourself)
4. I'll help you test the connection!

