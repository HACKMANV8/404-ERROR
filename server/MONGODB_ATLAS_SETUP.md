# MongoDB Atlas Setup - Quick Guide

## Why MongoDB Atlas?
- ✅ **Free tier** (512 MB storage - perfect for hackathons)
- ✅ **No installation needed** - works immediately
- ✅ **Cloud-based** - accessible from anywhere
- ✅ **Easy setup** - 5 minutes to get started

## Step-by-Step Setup

### 1. Create Account
- Go to: https://www.mongodb.com/cloud/atlas/register
- Sign up with email (or use Google/GitHub)

### 2. Create Free Cluster
- After login, click "Build a Database"
- Select **"FREE" (M0) Shared** cluster
- Choose region closest to you (e.g., Mumbai, Singapore)
- Click "Create" (takes 1-3 minutes)

### 3. Create Database User
- Go to **"Database Access"** (left sidebar)
- Click **"Add New Database User"**
- Authentication Method: **Password**
- Username: `resqledger` (or your choice)
- Password: Click "Autogenerate Secure Password" or create your own
- **IMPORTANT**: Save the password! You'll need it for the connection string
- Click "Add User"

### 4. Allow Network Access
- Go to **"Network Access"** (left sidebar)
- Click **"Add IP Address"**
- For development: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
- Or add your specific IP address
- Click "Confirm"

### 5. Get Connection String
- Go back to **"Database"** → Click **"Connect"** on your cluster
- Choose **"Connect your application"**
- Driver: **Node.js** (version 5.5 or later)
- Copy the connection string
- It looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/`

### 6. Update .env File
Replace the connection string in your `.env` file:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/resqledger?retryWrites=true&w=majority
MONGODB_DB_NAME=resqledger
```

**Important**: 
- Replace `<username>` and `<password>` with your actual database user credentials
- Add `/resqledger` after `.net/` (this is the database name)

### 7. Test Connection
Restart your server:
```bash
npm run dev
```

You should see:
```
[MongoDB] ✅ Connected to database: resqledger
```

## Troubleshooting

### Connection Failed?
1. **Check Network Access**: Make sure your IP is whitelisted (0.0.0.0/0 for development)
2. **Check Username/Password**: Make sure they match your database user
3. **Check Connection String**: Should start with `mongodb+srv://`
4. **Check Database Name**: Make sure `/resqledger` is in the connection string

### Still Not Working?
- Check Atlas dashboard for any error messages
- Verify cluster is running (should show "Running" status)
- Try creating a new database user if password issues persist

## What's Next?
Once connected, all transactions will automatically:
- ✅ Save to MongoDB
- ✅ Persist across server restarts
- ✅ Be visible in MongoDB Compass (connect using same connection string)

