# Dwiggy Restaurant Console (React + Vite)

Simple restaurant-facing portal for partners to manage menu and order status.

## Setup

```bash
cd admin
npm install
cp .env.example .env
npm run dev
```

By default it runs on `http://localhost:5174`.

## Backend requirements

Run backend with:

```bash
cd backend-go
PARTNER_KEYS=1:partner-1,2:partner-2,3:partner-3,4:partner-4 go run .
```

Login in UI with:
- Restaurant ID (example: `1`)
- Partner Key (example: `partner-1`)

## Features

- Partner login (restaurant-scoped)
- Menu upload/manage (URL or direct file upload)
- Restaurant-specific order list
- Order status updates for own restaurant only

## Dish image upload setup (cheap S3-compatible storage)

The portal supports uploading dish photos directly from user file picker.
Backend issues a signed upload URL, browser uploads directly to storage, and the saved public URL is auto-filled in menu form.

Set backend envs:

- `STORAGE_BUCKET`
- `STORAGE_REGION`
- `STORAGE_ENDPOINT`
- `STORAGE_ACCESS_KEY_ID`
- `STORAGE_SECRET_ACCESS_KEY`
- Optional: `STORAGE_PUBLIC_BASE_URL`, `STORAGE_UPLOAD_PREFIX`, `STORAGE_FORCE_PATH_STYLE`, `STORAGE_MAX_UPLOAD_MB`

For local development, this repo's `docker-compose.yml` already provisions MinIO and wires backend `STORAGE_*` values.
Just run from repo root:

```bash
docker compose up -d --build
```

Then image upload in partner app should work without extra cloud setup.

## Notes

- This is an MVP partner portal.
- For production, replace header-key auth with proper partner accounts/JWT + RBAC.
