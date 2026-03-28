# Hunto Web App

Progressive Web App (PWA) built with React + Vite, optimized for mobile devices.

## Authentication Flow

The app uses **OTP-based authentication** (no Google login needed):

```
1. User enters phone number (+91XXXXXXXXXX)
   ↓
2. Backend sends 6-digit OTP via SMS (Twilio)
   ↓
3. User enters OTP from SMS
   ↓
4. Backend verifies OTP and issues JWT token
   ↓
5. User logged in → Home screen
```

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (opens at http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Features

- ✅ **OTP Login** - Phone number + 6-digit OTP
- ✅ **PWA** - Works offline, installable on home screen
- ✅ **Mobile-first** - Optimized for phones
- ✅ **Fast** - Cached with service worker
- ✅ **Responsive** - Works on all screen sizes

## Architecture

```
web/
├── src/
│   ├── index.jsx          # React entry point
│   ├── App.jsx            # Login + Home screens
│   └── App.css            # Mobile-first styles
├── index.html             # Entry HTML (PWA meta tags)
└── vite.config.js         # Vite configuration
```

## Authentication

### Send OTP
```javascript
// POST /api/auth/send-otp
{
  "phone": "9876543210"
}

// Response
{
  "success": true,
  "message": "OTP sent to +919876543210"
}
```

### Verify OTP
```javascript
// POST /api/auth/verify-otp
{
  "phone": "9876543210",
  "otp": "123456"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user123",
    "phone": "9876543210",
    "name": "John Doe"
  }
}
```

## Testing on Phone

### Local Network Testing (Same WiFi)
1. Start dev server: `npm run dev`
2. Find your computer's IP: `ipconfig getifaddr en0` (macOS)
3. On your phone, open: `http://YOUR_IP:5173`
4. Test the OTP login flow

### Using ngrok for External Testing
```bash
npm install -g ngrok
npm run dev  # In one terminal
ngrok http 5173  # In another terminal
# Share the ngrok URL (e.g., https://abc123.ngrok.io) with others
```

## PWA Features

- **Offline Support**: Service worker caches assets and API responses
- **Install to Home Screen**: "Add to Home Screen" on iOS/Android
- **Standalone Mode**: Runs fullscreen without browser UI
- **Push Notifications**: Ready for Firebase integration (future)

## API Integration

The app connects to the Hunto backend via environment variables:

```bash
# Create .env.local
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-client-id-here
```

## Deployment

### Vercel (Recommended, $0 cost)
```bash
npm i -g vercel
vercel login
vercel
```

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

## Shared Components

The `/shared` folder contains reusable components used by both web and mobile:

```
../shared/
├── components/       # Shared UI components
├── hooks/           # Custom React hooks
├── api/             # API client
├── store/           # State management (Zustand)
├── constants/       # Theme, mock data
└── types/           # TypeScript types (optional)
```

### Using Shared Components
```jsx
// In web/src/screens/HomeScreen.jsx
import { RestaurantCard, CartBar } from '../../shared/components';
```

## Mobile-First Design Tips

1. **Viewport**: Meta tags in `index.html` ensure proper mobile scaling
2. **Touch targets**: Min 44x44px for buttons
3. **Safe Areas**: Use `react-native-safe-area-context` for notches
4. **Network**: Service worker handles offline scenarios
5. **Performance**: Lazy load components and images

## Comparison: Web vs Mobile vs Expo

| Feature | Web (Vite) | Expo | Bare React Native |
|---------|-----------|------|-------------------|
| Browser | ✅ | ✅ (web) | ❌ |
| iOS | ❌ | ✅ (EAS) | ✅ (Xcode) |
| Android | ❌ | ✅ (EAS) | ✅ (Android Studio) |
| Deployment | Vercel | EAS | App Store/Play Store |
| Cost | $0 | Free (with credits) | $99 (iOS) / Free (Android) |
| Time to MVP | 1 week | 2 weeks | 4+ weeks |

## Troubleshooting

### Port already in use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
npm run dev
```

### Service worker not updating
- Hard refresh: Cmd+Shift+R (macOS) or Ctrl+Shift+R (Windows)
- Clear site data in DevTools → Application → Clear storage

### Import errors from shared/
- Ensure paths use `../../shared/` (not `@shared/` unless configured)
- Check that shared/ folder exists at same level as web/

## Next Steps

1. Implement real authentication (replace mock in `shared/api`)
2. Add screens: HomeScreen, RestaurantScreen, CartScreen, CheckoutScreen
3. Integrate real API endpoints
4. Add PWA icons (icon.png, screenshot.png in public/)
5. Deploy to Vercel
6. Test on iOS Safari and Android Chrome

## Resources

- [React Native Web Docs](https://necolas.github.io/react-native-web/)
- [Vite Documentation](https://vitejs.dev)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
