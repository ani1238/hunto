# Safari Network Debugging for Phone Testing

## Enable Safari Developer Tools on Phone

### Step 1: On Mac
1. Open Safari
2. Go to **Safari menu → Preferences → Advanced**
3. Check **"Show Develop menu in menu bar"**
4. Close preferences

### Step 2: On iPhone/iPad
1. Go to **Settings → Safari → Advanced**
2. Enable **"Web Inspector"** (toggle ON)

### Step 3: Connect Your Phone
1. Plug iPhone into Mac with USB cable
2. Trust the device on your phone if prompted

### Step 4: Debug in Safari
1. On Mac, open a page in Safari
2. Go to **Develop menu** (top menu bar)
3. You should see your device name
4. Select it → Select the page you're testing
5. **Web Inspector window opens**

### Step 5: Check Network Tab
1. In Web Inspector, go to **Network tab**
2. Reload the page on your phone (⌘R)
3. Look for network requests
4. Click on `/api/auth/request-otp` to see:
   - Request headers
   - Response status
   - Response body
   - CORS headers

## What to Look For

### Successful Request
```
Status: 200 OK or 204 No Content
Headers include:
  Access-Control-Allow-Origin: http://192.168.1.24:5173
  Content-Type: application/json
```

### Failed Request (CORS)
```
Status: 403 Forbidden or 0 (blocked)
No Access-Control-Allow-Origin header
Browser blocks due to CORS policy
```

### Failed Request (Network)
```
Status: (Network error)
Cannot reach server
Check connectivity
```

## Console Errors

In the **Console tab**, look for messages like:
```
XMLHttpRequest cannot load due to access control checks
Failed to fetch
TypeError: Network request failed
```

## Common Network Issues

1. **CORS Error (red X)**
   - Backend CORS config doesn't allow origin
   - Fix: Add 192.168.1.24:5173 to CORS_ALLOWED_ORIGINS

2. **Network Error (ERR_CONNECTION_REFUSED)**
   - Can't reach backend at 192.168.1.24:3000
   - Fix: Make sure backend is running and accessible

3. **Timeout (no response)**
   - Request sent but no response received
   - Fix: Check backend is actually listening

## Testing Flow

1. Open Web Inspector → Console
2. Open your app on phone (http://192.168.1.24:5173)
3. Enter phone number
4. Click "Send OTP"
5. **Immediately** check:
   - **Network tab**: See POST /api/auth/request-otp request
   - **Console tab**: Any JavaScript errors?
   - **Request headers**: Has Origin? Content-Type?
   - **Response headers**: Has Access-Control-Allow-Origin?
   - **Response body**: What does it say?

This will show exactly what's failing!
