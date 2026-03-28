# Shared Components & Utils

Reusable code used by both **web** and **mobile** apps (via React Native Web).

## 📁 Folder Structure

```
shared/
├── components/           # UI components (React Native compatible)
│   ├── RestaurantCard.js
│   ├── MenuItemCard.js
│   ├── CartBar.js
│   ├── BannerCarousel.js
│   └── ...
│
├── hooks/                # Custom React hooks
│   ├── useAuth.js
│   ├── useCart.js
│   └── ...
│
├── api/                  # Backend API client
│   └── apiClient.js
│
├── store/                # Zustand state management
│   └── cartStore.js
│
├── constants/            # Theme, mock data
│   ├── theme.js
│   ├── mockData.js
│   └── ...
│
└── types/                # Type definitions (optional)
    └── index.js
```

## 🎯 Why Share Code?

Sharing components between web and mobile:

| Approach | Setup Time | Code Reuse | Maintenance |
|----------|-----------|-----------|-------------|
| Separate codebases | 2 hours | 0% | High |
| Shared folder | 30 min | 80% | Low |
| Monorepo (turborepo) | 2 hours | 85% | Medium |

We use **shared folder** (simplest, 80% reuse).

## 📦 Using Shared Components

### In Web (React + Vite)
```jsx
// web/src/screens/HomeScreen.jsx
import { RestaurantCard, CartBar } from '../../shared/components';

export default function HomeScreen() {
  return (
    <div>
      <RestaurantCard restaurant={...} />
      <CartBar />
    </div>
  );
}
```

### In Mobile (React Native + Expo)
```jsx
// mobile/src/screens/HomeScreen.js
import { RestaurantCard, CartBar } from '../../shared/components';

export default function HomeScreen() {
  return (
    <View>
      <RestaurantCard restaurant={...} />
      <CartBar />
    </View>
  );
}
```

### Using Shared Store (Zustand)
```jsx
// Either web or mobile
import { useCartStore } from '../../shared/store';

export function CartButton() {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  
  return <button onClick={() => addItem(item)}>Add to Cart</button>;
}
```

### Using Shared API
```jsx
import { api } from '../../shared/api';

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  
  useEffect(() => {
    api.getRestaurants().then(setRestaurants);
  }, []);
  
  return restaurants;
}
```

## ✅ What Works in Shared

Components that work in **both** web and mobile:

### ✅ Safe
- `React.` components
- `react-native` imports (`View`, `Text`, `Image`, `ScrollView`, etc.)
- Custom hooks
- Zustand stores
- Plain JavaScript utilities
- API calls

### ❌ Don't Share
- Expo-specific modules (`expo-camera`, `expo-location`)
- Platform-specific code (without `Platform.select()`)
- React DOM features (portals, refs to DOM nodes)
- Browser APIs (localStorage, fetch without async/await wrapper)

### ⚠️ Conditional Sharing
Use `Platform` for platform-specific code:

```jsx
import { Platform, View, ScrollView } from 'react-native';

// Shared component with platform logic
export function SafeList({ items }) {
  const ListComponent = Platform.OS === 'web' ? 'div' : ScrollView;
  
  return (
    <ListComponent>
      {items.map(item => <Item key={item.id} item={item} />)}
    </ListComponent>
  );
}
```

## 🔄 Current Shared Content

### Components
- `RestaurantCard.js` - Restaurant card in list
- `MenuItemCard.js` - Menu item in restaurant
- `CartBar.js` - Cart summary at bottom
- `BannerCarousel.js` - Image carousel

### API
- `apiClient.js` - HTTP client with auth headers

### Store
- `cartStore.js` - Cart state (Zustand)

### Constants
- `theme.js` - Colors, spacing, fonts
- `mockData.js` - Sample restaurants, items, orders

## 📝 Adding New Shared Components

1. **Create component** in `shared/components/YourComponent.js`:
```jsx
import { View, Text, StyleSheet } from 'react-native';

export function YourComponent() {
  return (
    <View style={styles.container}>
      <Text>Hello from shared!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 8,
  },
});
```

2. **Export from index** (create if needed):
```jsx
// shared/components/index.js
export { YourComponent } from './YourComponent';
export { RestaurantCard } from './RestaurantCard';
// ... etc
```

3. **Use in web/mobile**:
```jsx
import { YourComponent } from '../../shared/components';
```

## 🧪 Testing Shared Components

### In Web (Vite Dev Server)
```bash
cd web && npm run dev
# Components hot-reload on save
```

### In Mobile (Expo)
```bash
cd mobile && npm start -- --web
# Web view of Expo, also hot-reloads
```

### On Real Phone (Expo Go)
```bash
cd mobile && npm start
# Scan QR with Expo Go app
# Hot reload on save while app is focused
```

## 🚨 Common Issues

### Import path errors
```jsx
// ❌ Wrong
import { RestaurantCard } from '@shared/components';

// ✅ Right
import { RestaurantCard } from '../../shared/components';
```

### Web app shows "Cannot find module"
- Ensure `shared/` folder is at repo root level
- Check path is relative: `../../shared/`
- Run `npm install` in web/ folder

### Expo can't hot reload shared changes
```bash
# Clear bundler cache
cd mobile && npm start -- --clear
```

### Styling differences between web & mobile
React Native Web has some CSS limitations. Use `StyleSheet.create()` consistently:

```jsx
// ✅ Good - works everywhere
const styles = StyleSheet.create({
  button: { padding: 10, backgroundColor: '#007AFF' }
});

// ❌ Bad - web won't apply
<div style={{ WebkitTapHighlightColor: 'transparent' }} />
```

## 📚 Example: Complete Shared Component

```jsx
// shared/components/RestaurantCard.js
import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

export function RestaurantCard({ restaurant, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <Image
        source={{ uri: restaurant.image }}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.name}>{restaurant.name}</Text>
        <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
        <View style={styles.footer}>
          <Text style={styles.rating}>★ {restaurant.rating}</Text>
          <Text style={styles.delivery}>{restaurant.deliveryTime} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    ...theme.shadows,
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  cuisine: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rating: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  delivery: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
```

## 🎓 Best Practices

1. **Keep it simple** - Shared code should be general-purpose
2. **Document props** - Add JSDoc comments for component APIs
3. **Test on both** - Always verify on web AND mobile before committing
4. **Use constants** - Import theme/colors from `shared/constants`
5. **No platform-specific** - Avoid `require` of platform-specific modules
6. **Lazy load images** - Use `react-native-image-cache` for performance

## 📦 Future: Monorepo Conversion

If codebase grows, migrate to monorepo with Turborepo:

```bash
npm install -D turbo

# Will share deps, cache builds, and speed up CI/CD
turbo run build --parallel
```

For now, **shared/ folder is simpler and faster to set up**.

---

**Next**: Check web/README.md and mobile/README.md for component usage examples!
