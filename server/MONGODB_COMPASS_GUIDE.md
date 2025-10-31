# MongoDB Compass - Step-by-Step Guide

## Connecting to MongoDB Atlas from Compass

### Step 1: Open MongoDB Compass
- If you have it installed: Open MongoDB Compass from your applications
- If not installed: Download from https://www.mongodb.com/try/download/compass

### Step 2: Connect Using Connection String
1. When Compass opens, you'll see a connection screen
2. In the **"New Connection"** field at the top, paste:
   ```
   mongodb+srv://medinikopparapu_db_user:Pp8njudOfXk4KB85@cluster0.rfkeuiv.mongodb.net/?appName=Cluster0
   ```
3. Click the green **"Connect"** button (or press Enter)

### Step 3: Navigate to Your Database
After connecting successfully:
1. Look at the **left sidebar** - you'll see a list of databases
2. Look for **"resqledger"** in the list
3. **Note:** If you don't see it yet, that's normal! It will be created automatically when you save your first transaction

### Step 4: Open the Database
1. Click on **"resqledger"** in the left sidebar
2. You'll see a list of collections inside the database

### Step 5: View the Transactions Collection
1. Look for a collection named **"transactions"**
2. Click on **"transactions"**
3. You'll see all your saved transactions displayed as JSON documents
4. Each transaction will show fields like:
   - `id`: Transaction ID
   - `donor`: Donor name
   - `region`: Region name
   - `amount`: Amount donated
   - `hash`: Transaction hash
   - `timestamp`: When it was created
   - And more...

## What If I Don't See the Database/Collection?

### Database Not Visible?
- The database is created **automatically** when you save your first transaction
- Make sure your server is running and has connected to MongoDB
- Try recording a transaction through your app, then refresh Compass

### Collection Not Visible?
- Same as above - the `transactions` collection is created when the first transaction is saved
- Check your server logs to ensure MongoDB connection is successful

## Verifying Connection is Working

### Check Server Logs
When you start your server, you should see:
```
[MongoDB] ✅ Connected to database: resqledger
[Blockchain] ✅ MongoDB integration enabled
```

### Test by Recording a Transaction
1. Use your frontend or API to record a test transaction
2. Then check Compass - it should appear in the `transactions` collection

### Refresh in Compass
- If data doesn't appear immediately, click the **refresh icon** in Compass
- Or close and reopen the database/collection view

## Quick Visual Guide

```
MongoDB Compass
├── Left Sidebar (Databases)
│   └── resqledger  ← Click here
│       └── Collections
│           └── transactions  ← Your transactions are here
│               └── Document 1: { id, donor, amount, ... }
│               └── Document 2: { id, donor, amount, ... }
│               └── ...
```

## Troubleshooting

### "Authentication Failed" Error?
- Double-check your username and password in the connection string
- Make sure there are no extra spaces

### "Connection Timeout" Error?
- Check your internet connection
- Verify your IP address is whitelisted in Atlas Network Access
- Make sure the cluster is running in Atlas dashboard

### Can't See Database?
- The database is created on first write operation
- Record a test transaction first, then check Compass
- Refresh the database list in Compass

## Saving the Connection (Optional)

To save this connection for future use:
1. Click the **"Favorite"** icon (star) next to the connection
2. Or go to **File → Save Connection**
3. Give it a name like "ResQ Ledger Atlas"

