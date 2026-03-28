# Dwiggy Go Backend (PostgreSQL)

Production-oriented Go backend for Dwiggy with auth, cart management, and user location persistence.

## Requirements

- Go 1.23+
- PostgreSQL running
- DATABASE_URL env var (default: `postgres://postgres:postgres@localhost:5432/dwiggy?sslmode=disable`)
- Optional: `OTP_DEBUG_MODE=true` to include `debugOtp` in OTP response (dev only)
- Optional: `ADMIN_API_KEY=admin123` for admin endpoints
- Optional: `PARTNER_KEYS=1:partner-1,2:partner-2` for restaurant partner access
- Optional: `CORS_ALLOWED_ORIGINS=http://localhost:5174,http://127.0.0.1:5174`
- Optional image uploads (S3-compatible: Cloudflare R2, MinIO, S3):
  - `STORAGE_BUCKET=dwiggy-images`
  - `STORAGE_REGION=auto`
  - `STORAGE_ENDPOINT=https://<account>.r2.cloudflarestorage.com` (or MinIO/S3 endpoint)
  - `STORAGE_ACCESS_KEY_ID=<key>`
  - `STORAGE_SECRET_ACCESS_KEY=<secret>`
  - `STORAGE_PUBLIC_BASE_URL=https://cdn.example.com` (optional public CDN/domain)
  - `STORAGE_UPLOAD_PREFIX=menu-items` (optional)
  - `STORAGE_FORCE_PATH_STYLE=true` (recommended for MinIO/R2)
  - `STORAGE_MAX_UPLOAD_MB=5` (default 5)

## Setup

1. Start Postgres
2. Create DB:

```bash
createdb dwiggy
```

3. Run server:

```bash
cd backend-go
go run .
```

### Local Docker setup with MinIO image uploads (recommended for dev)

From repo root:

```bash
export HOST_LAN_IP=192.168.1.24  # set your machine LAN IP for phone-reachable image URLs
docker compose up -d --build
```

This starts:
- API on `http://localhost:3000`
- Postgres on `localhost:5435`
- MinIO S3 API on `http://localhost:9000`
- MinIO console on `http://localhost:9001` (user/pass: `minioadmin` / `minioadmin`)

The compose file auto-creates bucket `dwiggy-images` with public-read + CORS for partner web upload.
`HOST_LAN_IP` controls the generated public image URL host (`STORAGE_PUBLIC_BASE_URL`), so mobile devices can load uploaded images.

## API

### Auth

- `POST /api/auth/request-otp` (JSON: `phone`)
- `POST /api/auth/verify-otp` (JSON: `phone`, `otp`)
- `POST /api/auth/register` (JSON: `name`, `email`, `phone`)
- `POST /api/auth/login` (JSON: `email`)
- `GET /api/auth/me` (header `Authorization: Bearer mock-token-<id>`)

### Cart (auth required)

- `GET /api/cart` - get current cart
- `POST /api/cart/items` - add/update item (`productId`, `productName`, `unitPrice`, `quantity`, optional `restaurantId`, `metadataJson`)
- `DELETE /api/cart/items/:itemId` - remove a cart item
- `DELETE /api/cart` - clear cart

### User Locations (auth required)

- `GET /api/users/me/locations` - list saved locations
- `POST /api/users/me/locations` - create location
- `PUT /api/users/me/locations/:locationId` - update location
- `POST /api/users/me/locations/:locationId/select` - set current location
- `DELETE /api/users/me/locations/:locationId` - delete location

### Admin (header `X-Admin-Key: <ADMIN_API_KEY>`)

- `GET /api/admin/dashboard`
- `GET /api/admin/restaurants`
- `POST /api/admin/restaurants`
- `PUT /api/admin/restaurants/:restaurantId`
- `DELETE /api/admin/restaurants/:restaurantId`
- `POST /api/admin/restaurants/:restaurantId/menu-items`
- `PUT /api/admin/menu-items/:menuItemId`
- `DELETE /api/admin/menu-items/:menuItemId`
- `GET /api/admin/discounts`
- `POST /api/admin/discounts`
- `PUT /api/admin/discounts/:discountId`
- `DELETE /api/admin/discounts/:discountId`
- `GET /api/admin/orders`
- `PUT /api/admin/orders/:orderId/status`

### Partner Console (headers `X-Restaurant-Id`, `X-Partner-Key`)

- `GET /api/partner/me`
- `PUT /api/partner/availability` (`isOpen`, `openingTime`, `closingTime`)
- `GET /api/partner/menu-items`
- `POST /api/partner/menu-items/upload-url` (body: `fileName`, `contentType`, `sizeBytes`)
- `POST /api/partner/menu-items`
- `PUT /api/partner/menu-items/:menuItemId`
- `DELETE /api/partner/menu-items/:menuItemId`
- `GET /api/partner/orders`
- `PUT /api/partner/orders/:orderId/status`

Restaurant and order payloads include contact phone (`phone` on restaurant objects, `restaurantPhone` on order objects) so client apps can expose call actions.

Placed orders now require partner action within 30 seconds:
- Partner accepts by updating status to `preparing`.
- If no acceptance within 30 seconds, backend auto-cancels order on subsequent reads/updates.
- Order payload includes `acceptBy` and `acceptanceSecondsRemaining` fields for partner timer UX.

Partner keys are now persisted in DB (`restaurant_partners`) as SHA-256 hashes.
`PARTNER_KEYS` env is used to seed/rotate keys at startup.

## Notes

- Current token scheme is still mock (`mock-token-<id>`). Replace with signed JWT + expiry/refresh.
- User location is stored in a dedicated `user_locations` table (recommended over storing a single mutable location on `users`).
