# Hunto - Pet Food Delivery Platform

A complete pet food delivery solution with web (PWA), mobile (Expo), admin portal, and Go backend API.

## 🚀 Quick Links

| Component | Purpose | Tech | Deploy To |
|-----------|---------|------|-----------|
| **Web** | Customer app (phone-optimized) | React + Vite + PWA | [Vercel](https://vercel.com) ($0) |
| **Mobile** | iOS/Android native (optional) | React Native + Expo | [EAS Build](https://eas.dev) (Free-$99) |
| **Admin** | Partner management portal | React + Vite | [Vercel](https://vercel.com) ($0) |
| **Backend** | REST API | Go + Gin + PostgreSQL | [Railway](https://railway.app) ($7/mo) |

## 📦 Project Structure

```
hunto/
├── web/                    # Customer web app (PWA, phone-first)
│   ├── public/            # PWA manifest, service worker
│   ├── src/               # React components
│   └── README.md          # Web app guide
│
├── mobile/                # Native app (iOS/Android via Expo)
│   ├── src/               # React Native screens & components
│   ├── app.json           # Expo configuration
│   └── README.md          # Mobile app guide
│
├── admin/                 # Partner portal (restaurant management)
│   ├── src/               # React components
│   └── README.md          # Admin guide
│
├── shared/                # Reusable code (web + mobile)
│   ├── components/        # UI components
│   ├── hooks/             # Custom React hooks
│   ├── api/               # Backend API client
│   ├── store/             # Zustand state management
│   ├── constants/         # Theme, mock data
│   └── types/             # Type definitions
│
├── backend-go/            # REST API & business logic
│   ├── handlers/          # HTTP route handlers
│   ├── models/            # Database models
│   ├── middleware/        # Auth, CORS, logging
│   ├── config.go          # Configuration management
│   └── README.md          # Backend guide
│
├── docker-compose.yml     # Local dev: PostgreSQL + MinIO + Go API
└── .gitignore             # Git configuration
```

## 🎯 Launch Strategy (MVP to Production)

### Phase 1: Web App ($0 cost, 1-2 weeks)
- [ ] Complete web app features (auth, restaurants, cart, checkout)
- [ ] Test on real phones (iOS Safari, Android Chrome)
- [ ] Deploy to Vercel
- [ ] Launch and gather user feedback

**Cost**: $0 | **Time**: 1-2 weeks

### Phase 2: Add Native Apps (Optional, $99/year)
- [ ] Deploy iOS app via EAS Build → App Store
- [ ] Deploy Android app via EAS Build → Play Store
- [ ] Reuse 80% code from web via shared/ folder

**Cost**: $99/year (iOS only) | **Time**: 1 week

### Phase 3: Advanced Features ($7-50/month)
- [ ] Real-time order tracking (WebSocket)
- [ ] Push notifications (Firebase)
- [ ] Payment gateway (Stripe)
- [ ] Multi-region delivery zones

## 🛠 Tech Stack

### Frontend
- **React 18** - UI framework (web/admin)
- **Vite 5** - Build tool
- **React Native + Expo** - Mobile (iOS/Android)
- **Zustand** - State management

### Backend
- **Go 1.24** - Language
- **Gin** - HTTP framework
- **GORM** - ORM
- **PostgreSQL 15** - Database

### Authentication
- **OTP via SMS** - Phone number login
- **Twilio/AWS SNS** - SMS delivery
- **JWT** - Session tokens

### Infrastructure
- **Docker Compose** - Local development
- **Railway** - Backend + PostgreSQL ($7/mo)
- **Vercel** - Web + Admin hosting ($0)
- **AWS S3** - Image storage ($1-10/mo)
- **Twilio** - SMS OTP ($1-5/mo)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (web/mobile/admin)
- Go 1.24+ (backend)
- Docker & Docker Compose (local dev)

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/ani1238/hunto.git
cd hunto

# 2. Start backend + database
docker-compose up -d

# 3. Start web app (new terminal)
cd web && npm install && npm run dev
# http://localhost:5173

# 4. Start admin portal (new terminal)
cd admin && npm install && npm run dev
# http://localhost:5174

# 5. Start mobile app (new terminal)
cd mobile && npm install && npm start
# Press 'w' for web, 'i' for iOS, 'a' for Android
```

## 📖 Documentation

- **[Web App](/web/README.md)** - PWA setup, testing, deployment
- **[Mobile App](/mobile/README.md)** - Expo testing, EAS builds, TestFlight
- **[Admin Portal](/admin/README.md)** - Partner dashboard
- **[Backend API](/backend-go/README.md)** - Go API, endpoints, database

## 📱 Testing

### Web (Phone Browser)
```bash
cd web && npm run dev
# On phone: http://YOUR_IP:5173
```

### Mobile (Expo)
```bash
cd mobile && npm start
# Press 'w' for web, or scan QR for native
```

### Backend
```bash
curl http://localhost:8080/api/restaurants
```

## 🌍 Deployment

### Web → Vercel ($0/month)
Connect web/ folder to Vercel → Auto-deploys on push

### Backend → Railway ($7/month)
Connect repo to Railway with PostgreSQL → Auto-deploys

### Mobile → EAS Build (Free-$99)
```bash
cd mobile && eas build --platform ios
```

## 💰 Cost (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| Web Hosting | $0 | Vercel free tier |
| Admin Hosting | $0 | Vercel free tier |
| Backend | $7 | Railway |
| Database | $0 | 5GB included |
| Storage | $1-5 | AWS S3 |
| SMS (OTP) | $1-5 | Twilio (~100 SMS = $1) |
| **Total** | **$10-20/mo** | **Or $110-120 with iOS** |
| iOS App (yearly) | $99 | Apple Developer account |

## 🔐 Environment Variables

### Backend (backend-go/.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/hunto
API_KEY=your-secret-key
STORAGE_BUCKET=hunto-images
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://hunto.vercel.app

# SMS OTP Configuration
SMS_PROVIDER=twilio  # or aws-sns
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRY=24h  # Token expires after 24 hours
```

### Web (web/.env.local)
```
VITE_API_BASE_URL=http://localhost:8080
```

### Mobile (mobile/.env)
```
EXPO_API_BASE_URL=http://localhost:8080
```

## 📊 Why This Architecture?

| Choice | Benefit |
|--------|---------|
| **PWA First** | $0 cost, instant updates, instant testing |
| **Shared Code** | DRY, components work on web & mobile |
| **Expo** | Cloud builds, no local native tools needed |
| **Go Backend** | Fast, efficient, great for APIs |

---

**Ready to launch?** Start with [Web App Guide](/web/README.md) 🚀
