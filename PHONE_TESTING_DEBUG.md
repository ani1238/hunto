# Phone Testing Debug Guide

## Network Setup
- Mac IP: 192.168.1.24
- Backend API: http://192.168.1.24:3000
- Web App: http://192.168.1.24:5173
- Both on same WiFi

## Startup Sequence

### 1. Terminal 1 - Backend
```bash
cd ~/hunto-workspace
docker compose up
```

Watch for:
```
backend-go-1  | [GIN-debug] Listening and serving HTTP on :3000
```

### 2. Terminal 2 - Web App Dev Server
```bash
cd ~/hunto-workspace/web
npm run dev
```

Watch for:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.24:5173/
```

### 3. Phone Browser
Open: `http://192.168.1.24:5173`

## Testing Flow
1. Enter phone number (any 10 digits)
2. Click "Send OTP"
3. Enter OTP: `1111`
4. Enter name and email
5. Grant location permission
6. Browse restaurants
7. Click restaurant → View Menu
8. Add items to cart
9. Checkout

## If You Get Network Errors

### Check 1: Is backend running?
```bash
curl http://192.168.1.24:3000/api/restaurants
```
Should return JSON with restaurants

### Check 2: Is dev server running?
```bash
curl http://192.168.1.24:5173
```
Should return HTML

### Check 3: Are they on same WiFi?
```bash
ping 192.168.1.24
```

### Check 4: Check browser console
- Open DevTools (F12) on phone
- Look for network errors
- Check Console tab for JavaScript errors

### Check 5: CORS Headers
The backend should send:
```
Access-Control-Allow-Origin: http://192.168.1.24:5173
```

## Environment Variables

### Backend (.env)
Backend loads from docker-compose.yml:
- PORT: 3000
- DATABASE_URL: postgres connection
- CORS_ALLOWED_ORIGINS: includes 192.168.1.24

### Frontend (web/.env)
```
VITE_API_BASE_URL=http://192.168.1.24:3000
```

## Logs to Check

### Backend Startup
```
[GIN-debug] GET    /api/restaurants    --> main.(*App).listRestaurants
[GIN-debug] POST   /api/auth/request-otp --> main.(*App).requestOTP
[GIN-debug] Listening and serving HTTP on :3000
```

### Web Dev Server
```
✓ 150 modules transformed
Port 5173 ready
```

### If OTP fails
Check backend logs for:
- Database connection errors
- OTP provider errors
- CORS rejection (403)

## Quick Debug

Copy this to test each component:

```bash
# 1. Check backend API
curl -X POST http://192.168.1.24:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'
# Should return: {"message":"OTP sent"}

# 2. Check restaurants endpoint
curl http://192.168.1.24:3000/api/restaurants
# Should return: {"data":[...], "message":"Restaurants fetched"}

# 3. Check dev server
curl http://192.168.1.24:5173 | head -5
# Should return HTML
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Connection refused | Backend not running or wrong port |
| CORS error | Browser blocked due to origin mismatch |
| Cannot find restaurants | API endpoint or database issue |
| Location permission denied | Grant in browser settings |
| Blank page on phone | Dev server not serving HTML |

