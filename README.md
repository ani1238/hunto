# 🐾 Dwiggy — Pet Food Delivery App

> Like Swiggy, but for your pets!

## Project Structure

```
dwiggy/
├── mobile/          # React Native (Expo) app
│   ├── src/
│   │   ├── screens/         # HomeScreen, RestaurantScreen, CartScreen
│   │   ├── components/      # RestaurantCard, BannerCarousel, MenuItemCard, CartBar
│   │   ├── navigation/      # Stack navigator
│   │   ├── store/           # Zustand cart store
│   │   └── constants/       # theme, mockData
│   └── App.js
│
├── backend/         # Node.js + Express REST API
│   └── src/
│       ├── routes/          # auth, restaurants, orders
│       ├── controllers/     # (next: add business logic)
│       ├── models/          # (next: Mongoose schemas)
│       └── middleware/      # (next: auth middleware)
│
└── admin/           # (coming soon: restaurant admin dashboard)
```

## Tech Stack

| Layer       | Tech                              |
|-------------|-----------------------------------|
| Mobile      | React Native + Expo               |
| Navigation  | React Navigation (Stack)          |
| State       | Zustand                           |
| Backend     | Node.js + Express                 |
| Database    | MongoDB (Mongoose)                |
| Auth        | JWT                               |
| Styling     | React Native StyleSheet           |

## Getting Started

### Mobile
```bash
cd mobile
npm install
npx expo start
```

### Backend
```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev
```

## Screens (implemented)
- **HomeScreen** — banners, category filter, restaurant list with search
- **RestaurantScreen** — hero image, stats, menu with add-to-cart
- **CartScreen** — item quantities, bill breakdown, place order CTA

## Next Steps
- [ ] Add Mongoose models (User, Restaurant, Order)
- [ ] Wire up auth middleware (JWT)
- [ ] Connect mobile to real backend API
- [ ] Add order tracking screen
- [ ] Payment gateway integration
- [ ] Admin dashboard for restaurant owners
