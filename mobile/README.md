# Hunto Mobile App (Expo)

Cross-platform mobile app built with React Native + Expo. Runs on iOS, Android, and web.

## Quick Start

```bash
# Install dependencies
npm install

# Start Expo CLI (choose platform or open web browser)
npm start

# Or run specific platform
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser (http://localhost:8081)
```

## Why Expo?

Expo abstracts away native complexity while keeping the React Native API. You get:

- **Web Support**: `npm start -- --web` runs in browser instantly
- **EAS Build**: Cloud builds for iOS TestFlight and Android APK without local setup
- **Over-the-air Updates**: Push updates without app store review
- **Managed Services**: Push notifications, fonts, location, camera, etc.

## Testing

### Web (Browser)
```bash
npm start -- --web
# Opens http://localhost:8081
# Responsive: Press 'w' in the CLI
```

### iOS Simulator (macOS only)
```bash
npm run ios
# Auto-opens iOS simulator, hot reload on save
```

### Android Emulator
```bash
npm run android
# Auto-opens Android emulator
```

### Physical Phone (iOS/Android)
1. Download Expo Go app from App Store / Play Store
2. Run: `npm start`
3. Scan QR code with phone camera
4. App opens in Expo Go (hot reload supported)

### Test on Real Device via LAN
```bash
npm start

# On another machine on same WiFi:
# - Scan QR code with Expo Go app
# - Or enter IP manually in Expo Go

# For more control, use tunnel:
npm start -- --tunnel
```

## Architecture

```
mobile/
├── src/
│   ├── screens/          # Page components (Login, Home, Cart, etc.)
│   ├── components/       # Reusable UI components
│   ├── navigation/       # React Navigation setup
│   ├── store/            # Zustand state management
│   ├── api/              # API client for backend
│   ├── constants/        # Theme, colors, mock data
│   └── assets/           # Images, fonts
├── App.js                # Entry point (Expo config applied here)
├── app.json              # Expo configuration
├── package.json
└── babel.config.js
```

## Configuration

### app.json (Expo Config)
Key settings for building:

```json
{
  "expo": {
    "name": "Hunto",
    "slug": "hunto",
    "bundleIdentifier": "com.hunto.app",  // iOS
    "package": "com.hunto.app",            // Android
    "ios": {
      "supportsTablet": false,
      "infoPlist": { "NSLocationWhenInUseUsageDescription": "..." }
    },
    "android": {
      "package": "com.hunto.app",
      "permissions": ["ACCESS_FINE_LOCATION"]
    }
  }
}
```

## Building for Production

### Option 1: EAS Build (Recommended, Cloud)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project
eas build:configure

# Build iOS
eas build --platform ios

# Build Android
eas build --platform android

# View builds at https://expo.dev/accounts/[username]/projects/[project-name]
```

### Option 2: Local Build (Advanced)
Requires Xcode (iOS) and Android Studio (Android).

```bash
# Eject to bare React Native (⚠️ removes Expo benefits)
expo prebuild --clean
```

**Note**: After ejecting, use bare React Native commands and lose Expo's managed services.

## Sharing Components with Web

The `/shared` folder contains components used by both Expo and web:

```
../shared/
├── components/       # UI components (both web & mobile compatible)
├── hooks/           # Custom hooks
├── api/             # Backend API client
├── store/           # Zustand state
├── constants/       # Colors, theme, data
```

### Example: Using Shared Component
```jsx
// src/screens/HomeScreen.js
import { RestaurantCard } from '../../../shared/components';

export default function HomeScreen() {
  return <RestaurantCard restaurant={...} />;
}
```

## Debugging

### Expo DevTools
Press 'd' in terminal while `npm start` is running:
- Open React DevTools for component inspection
- See network requests
- Check logs

### React Native Debugger (External Tool)
```bash
npm install -g react-native-debugger
react-native-debugger
```

### Console Logs
```jsx
import { logger } from '../shared/utils'; // if available
console.log('Debug:', data);  // Works in Expo DevTools
```

## Common Issues

### Hot Reload Not Working
- Ensure phone and computer on same WiFi
- Restart Metro bundler: Press 'i' or 'a' in CLI
- Kill and restart: `npm start`

### Metro Bundler Error
```bash
# Clear cache
npm start -- --clear
```

### Build Fails with "duplicate symbols"
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npm start -- --web --clear
```

### EAS Build Error: "Not a member of team"
```bash
eas login  # Ensure logged in to correct account
eas whoami
```

## Environment Variables

Create `.env` in mobile/ folder (NOT committed to git):

```
VITE_API_BASE_URL=http://localhost:8080  # for web dev
EXPO_API_BASE_URL=http://localhost:8080  # for Expo dev
GOOGLE_CLIENT_ID=your-client-id
```

## Next Steps for MVP

1. **Implement Auth** (shared/api/apiClient.js)
   - Replace mock tokens with real Google OAuth
   - Save JWT to secure storage

2. **Build Screens**
   - Use shared/components for UI
   - Route via React Navigation

3. **Test on Physical Phone**
   - iOS Safari for web version
   - Expo Go for native preview

4. **Deploy Web to Vercel**
   - See web/README.md

5. **Build iOS/Android** (after feature parity)
   - Use EAS Build for TestFlight/APK
   - Cost: $99/year for iOS, free for Android

## Comparison: Expo vs Bare React Native

| Feature | Expo | Bare RN |
|---------|------|---------|
| Setup | 5 min | 30 min |
| Web Support | ✅ | Requires React Native Web |
| OTA Updates | ✅ | ❌ |
| Cloud Builds | ✅ EAS | ❌ |
| Local Setup | Minimal | Xcode + Android Studio |
| App Store Build | 10 min | 1-2 hours |
| Size | ~50MB | ~20MB |

For MVP, **Expo is recommended** to move faster. Switch to bare React Native later if needed.

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [EAS Build Guide](https://docs.expo.dev/build/introduction/)
