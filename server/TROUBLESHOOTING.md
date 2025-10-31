# Troubleshooting: Transactions Not Saving

## Step-by-Step Debugging

### 1. Check MongoDB Connection

**Start your server and check logs:**

```bash
cd server
npm run dev
```

**Look for these messages:**
- ✅ `[MongoDB] ✅ Connected to database: resqledger` - **GOOD**
- ❌ `[MongoDB] ❌ Connection error:` - **BAD - MongoDB not running**

**If MongoDB connection fails:**
1. Make sure MongoDB is running on your computer
2. Check if MongoDB service is started:
   - Windows: Open Services → Find "MongoDB" → Start if stopped
   - Or open MongoDB Compass and connect manually

### 2. Test Recording a Transaction

**Use this command to test:**

```bash
curl -X POST http://localhost:3001/api/payments/record-upi \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "upiReference": "TEST-001",
    "donorName": "Test Donor",
    "region": "Kerala Flood Zones"
  }'
```

### 3. Check Server Logs

**When you record a transaction, you should see:**

```
[API] 📥 Received UPI payment recording request: {...}
[API] ✅ Validating UPI payment: {...}
[UPI Payment] ✅ Recorded UPI payment as blockchain transaction: UPI-...
[Blockchain] 💾 Attempting to save transaction: UPI-...
[MongoDB] ✅ Transaction saved successfully: UPI-... (ID: ...)
[Blockchain] ✅ Transaction saved to MongoDB: UPI-...
[API] ✅ UPI payment recorded successfully: UPI-...
```

**If you see errors:**
- `[MongoDB] ❌ Failed to save transaction` - Check error details
- `[Blockchain] ⚠️ MongoDB model not available` - MongoDB not connected

### 4. Check MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Go to `resqledger` database
4. Open `transactions` collection
5. **You should see your transaction there!**

### 5. Check Frontend

**The frontend should auto-refresh every 10 seconds.**

**To force refresh:**
1. Open browser console (F12)
2. Check Network tab
3. Look for requests to `/api/transactions`
4. Check if data is being returned

**Or manually refresh:**
- Refresh the page (F5)
- The React Query should refetch automatically

## Common Issues

### Issue 1: MongoDB Not Connected

**Symptoms:**
- Logs show: `[Blockchain] ⚠️ MongoDB not connected yet`
- Transactions not saved to MongoDB

**Solution:**
1. Make sure MongoDB is running
2. Check `.env` file has correct `MONGODB_URI`
3. Restart server after fixing

### Issue 2: Unique Hash Constraint Error

**Symptoms:**
- Error: `E11000 duplicate key error`
- Trying to save same transaction twice

**Solution:**
- Each UPI reference should be unique
- Use different `upiReference` for each test

### Issue 3: Frontend Not Updating

**Symptoms:**
- Transaction saved but not showing in UI

**Solutions:**
1. **Wait 10 seconds** - Frontend auto-refreshes every 10 seconds
2. **Refresh page** manually (F5)
3. **Check browser console** for errors
4. **Check Network tab** - Is `/api/transactions` returning new data?

### Issue 4: Transaction Saved But Not in Frontend

**Check:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for GET request to `/api/transactions`
4. Click on it → Response tab
5. **Does it show your new transaction?**

**If yes but UI doesn't update:**
- React Query cache issue
- Try hard refresh (Ctrl+Shift+R)

**If no:**
- MongoDB query issue
- Check server logs for errors

## Testing Checklist

- [ ] MongoDB is running
- [ ] Server logs show MongoDB connected
- [ ] API request succeeds (200 response)
- [ ] Server logs show transaction saved
- [ ] MongoDB Compass shows transaction
- [ ] Frontend refetches after 10 seconds
- [ ] Transaction appears in dashboard

## Quick Test Commands

### Test 1: Check MongoDB Connection
```bash
# In MongoDB Compass, try to connect manually
# Should connect to: mongodb://localhost:27017
```

### Test 2: Record Transaction
```bash
curl -X POST http://localhost:3001/api/payments/record-upi \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "upiReference": "TEST-002",
    "donorName": "Test",
    "region": "Kerala"
  }'
```

### Test 3: Check Transactions
```bash
curl http://localhost:3001/api/transactions
```

### Test 4: Check MongoDB
```bash
# In MongoDB Compass:
# 1. Connect
# 2. Open resqledger database
# 3. Open transactions collection
# 4. Should see your transaction
```

## Still Not Working?

Share these logs with me:
1. Server startup logs (MongoDB connection)
2. Transaction recording logs (when you call the API)
3. Any error messages
4. MongoDB Compass screenshot showing transactions (or lack thereof)

