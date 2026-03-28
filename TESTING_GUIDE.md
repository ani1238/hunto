# Hunto Testing Guide - Complete Instructions

## 🎯 Overview

You can test Hunto in **3 ways**:

1. **Web App** (PWA) - Phone-optimized, deploys to Vercel ($0)
2. **Expo** (React Native) - Native code preview
3. **Backend API** - Direct endpoint testing

---

## 🌐 Web App Testing (Recommended for MVP)

### Quick Start

```bash
cd web
npm install
npm run dev
```

Opens http://localhost:5173 automatically.

### Test on Phone (Same WiFi)

```bash
# Find your computer IP
ipconfig getifaddr en0    # macOS
hostname -I               # Linux
```

On your phone, open: `http://YOUR_IP:5173`

### Test Offline (PWA)

1. Open http://localhost:5173
2. DevTools → Network → Set to "Offline"
3. Refresh page → Should still work (cached)
4. Go online → Network works again

### Debug Web App

**React DevTools Extension**
- Inspect components, props, state
- Check performance

**Console**
```javascript
// Check service worker
navigator.serviceWorker.getRegistrations().then(r => console.log(r));

// View cached assets
caches.keys().then(names => console.log(names));
```

---

## ⚛️ Mobile Testing with Expo

### Quick Start

```bash
cd mobile
npm install
npm start

# Press 'w' for web browser
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
```

### Test on Real Phone

1. Download **Expo Go** app (App Store / Play Store)
2. Run `npm start`
3. Scan QR code with camera
4. App opens in Expo Go
5. Changes hot-reload on save

### Expo Keyboard Shortcuts

| Key | Action |
|-----|--------|
| w | Web browser |
| i | iOS simulator |
| a | Android emulator |
| d | React DevTools |
| r | Reload |
| c | Clear cache |

---

## 🧪 Testing Checklist

### Functionality
- [ ] Login works (mock Google OAuth)
- [ ] Restaurant list loads
- [ ] Add items to cart
- [ ] Cart displays correctly
- [ ] Checkout completes
- [ ] Order confirmation shows

### Mobile UX
- [ ] Smooth scrolling
- [ ] Buttons responsive to touch
- [ ] No layout shifts
- [ ] Text readable on small screens
- [ ] Mobile keyboard works with forms

### Performance
- [ ] Lighthouse score > 80
- [ ] Page load < 3 seconds
- [ ] No console errors
- [ ] Images load properly

### Browser Compatibility
- [ ] iOS Safari (iPhone)
- [ ] Android Chrome (Pixel)
- [ ] Firefox
- [ ] Works at 375px width

### Offline Mode
- [ ] App loads without internet
- [ ] Cached pages visible
- [ ] Error handling for API failures
- [ ] Works when connection restored

---

## 📊 Test Scenarios

### Scenario 1: New User Signup
1. Open http://localhost:5173
2. Click "Login with Google"
3. Verify redirected to home
4. Check auth token in storage

### Scenario 2: Browse & Add to Cart
1. Browse restaurants
2. Click restaurant → See menu
3. Add 3 items to cart
4. Verify cart count shows "3"
5. Open cart → See items & total
6. Checkout → See confirmation

### Scenario 3: Test Offline
1. Start web app: `npm run dev`
2. Open http://localhost:5173
3. DevTools → Network → Offline
4. Refresh page → Should still work
5. Navigate around → Cached pages work
6. Go online → Network works

### Scenario 4: Test on Multiple Devices
```bash
# Find your IP
ipconfig getifaddr en0

# On each phone:
http://192.168.1.100:5173
```

Test on:
- iPhone 12/13/14
- Pixel 5/6/7
- iPad
- Any Android phone

---

## 📱 Browser Testing Matrix

### Mobile (Primary)
- **iOS**: Safari (Web App)
- **Android**: Chrome (Web App)

### Desktop (Secondary)
- **Chrome**: DevTools mobile emulation
- **Firefox**: Mobile emulation
- **Safari**: Responsive design mode

### DevTools Mobile Emulation

1. Open DevTools (F12)
2. Device Toggle (Ctrl+Shift+M)
3. Test devices:
   - iPhone 14: 390×844
   - Pixel 5: 393×851
   - iPad: 768×1024

---

## 🔍 Testing Backend API

### Test Endpoints

```bash
# List restaurants
curl http://localhost:8080/api/restaurants | jq

# Get restaurant menu
curl http://localhost:8080/api/restaurants/1/menu | jq

# Get orders (requires auth header)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/orders | jq
```

### Check Backend Status

```bash
# Is backend running?
curl http://localhost:8080/health

# Response should be 200 OK
# If not, start: docker-compose up -d
```

---

## 🛠 Troubleshooting

### Port Already in Use
Find and stop the process:
```bash
# macOS/Linux
lsof -i :5173

# Then restart
npm run dev
```

### Styling Different on Real Phone
- DevTools emulation ≠ real phone
- Always test on actual device
- Check viewport meta tags

### Service Worker Cache Stale
```javascript
// In DevTools console
caches.delete('hunto-v1')  // Clear cache
location.reload()           // Reload
```

### Hot Reload Not Working
```bash
rm -rf node_modules/.vite
npm run dev
```

### CORS Errors
- Backend not running
- Check API URL in .env.local
- Verify CORS configuration

---

## 📈 Performance Testing

### Lighthouse Audit

1. DevTools → Lighthouse
2. Click "Analyze page load"
3. Target scores:
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 90

### Core Web Vitals

- **LCP** (Largest Paint): < 2.5s
- **FID** (Input Delay): < 100ms
- **CLS** (Layout Shift): < 0.1

---

## 📋 Pre-Launch Checklist

Before deploying to Vercel:

- [ ] All features work locally
- [ ] Mobile UI responsive
- [ ] Lighthouse > 80
- [ ] Offline mode works
- [ ] iOS Safari tested
- [ ] Android Chrome tested
- [ ] No console errors
- [ ] API endpoints work
- [ ] Auth flow complete
- [ ] Performance acceptable

---

## 🚀 Deploy to Vercel & Test

1. Push code to GitHub
2. Connect web/ folder to Vercel
3. Auto-deploys: https://hunto.vercel.app
4. Share link with friends
5. Collect feedback

### Monitor Production

- Vercel Analytics dashboard
- Real user metrics
- Error logs
- User feedback

---

## 🚦 Quick Commands

```bash
# Web App
cd web && npm run dev          # Start dev
npm run build                  # Build for production

# Mobile
cd mobile && npm start         # Start Expo
npm start -- --web             # Expo web

# Backend
docker-compose up              # Start services
curl http://localhost:8080/health

# Find IP
ipconfig getifaddr en0         # macOS
hostname -I                     # Linux
```

---

## 🎓 Next Steps

1. **Start web**: `cd web && npm run dev`
2. **Test on phone**: `http://YOUR_IP:5173`
3. **Test offline**: DevTools → Offline
4. **Check performance**: Lighthouse
5. **Deploy to Vercel**: Connect GitHub

See component guides:
- [Web README](/web/README.md)
- [Mobile README](/mobile/README.md)
- [Backend README](/backend-go/README.md)

---

**Happy testing! 🚀**
