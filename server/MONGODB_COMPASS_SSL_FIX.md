# Fix SSL Error in MongoDB Compass

## Error: `TLSV1_ALERT_INTERNAL_ERROR`

This is a common SSL/TLS connection issue with MongoDB Atlas in Compass. Here are several solutions:

## Solution 1: Update MongoDB Compass (Recommended)

1. **Check your Compass version:**
   - In Compass: Help → About MongoDB Compass
   - Should be version 1.40+ for best Atlas compatibility

2. **Update if needed:**
   - Download latest from: https://www.mongodb.com/try/download/compass
   - Install the latest version

## Solution 2: Use Connection String with SSL Parameters

Try this modified connection string in Compass:

```
mongodb+srv://medinikopparapu_db_user:Pp8njudOfXk4KB85@cluster0.rfkeuiv.mongodb.net/resqledger?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=false
```

Or try without the database name first:
```
mongodb+srv://medinikopparapu_db_user:Pp8njudOfXk4KB85@cluster0.rfkeuiv.mongodb.net/?retryWrites=true&w=majority&tls=true
```

## Solution 3: Use Individual Connection Fields Instead

Instead of pasting the URI, try filling fields individually:

1. In Compass "New Connection" dialog
2. Click "Fill in connection fields individually" (toggle at top)
3. Fill in:
   - **Hostname:** `cluster0.rfkeuiv.mongodb.net`
   - **Authentication:** Username / Password
   - **Username:** `medinikopparapu_db_user`
   - **Password:** `Pp8njudOfXk4KB85`
   - **Authentication Database:** `admin` (or leave default)
   - **SSL/TLS:** Select "System CA" or "Server Validation"

## Solution 4: Check Network/Firewall

1. **Check Atlas Network Access:**
   - Go to MongoDB Atlas dashboard
   - Network Access → Make sure your IP or 0.0.0.0/0 is allowed

2. **Check Windows Firewall:**
   - Temporarily disable firewall to test
   - If it works, add MongoDB Compass to firewall exceptions

## Solution 5: Use Atlas Web Interface (Alternative)

If Compass doesn't work, you can use Atlas web interface:
1. Go to: https://cloud.mongodb.com
2. Navigate to your cluster
3. Click "Browse Collections"
4. You can view/edit data directly in the browser

## Solution 6: Test Connection from Command Line

Test if connection works from terminal:
```bash
mongosh "mongodb+srv://medinikopparapu_db_user:Pp8njudOfXk4KB85@cluster0.rfkeuiv.mongodb.net/resqledger?retryWrites=true&w=majority"
```

If this works, the issue is specifically with Compass.

## Quick Fix (Try This First):

1. **Close MongoDB Compass completely**
2. **Restart MongoDB Compass**
3. **In the connection string, try without appName:**
   ```
   mongodb+srv://medinikopparapu_db_user:Pp8njudOfXk4KB85@cluster0.rfkeuiv.mongodb.net/?retryWrites=true&w=majority
   ```
4. **After connecting, navigate to resqledger database manually**

## Still Not Working?

The good news is: **Your server connection is working fine!** 

- Your `.env` file has the correct connection string
- Your Node.js server can connect (we already verified this)
- The SSL error is only affecting MongoDB Compass GUI

**Workaround:** You can:
- View data through your application/frontend
- Use MongoDB Atlas web interface to browse collections
- View server logs to see transactions being saved

Let me know which solution works for you!

