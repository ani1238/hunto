# Geolocation Issue on iPhone Safari

## The Problem
Safari on iOS requires **HTTPS** or **localhost** to access geolocation.

Since you're accessing via `http://192.168.1.24:5173` (HTTP, not HTTPS), the browser silently denies geolocation permission.

## Solutions

### Option 1: Use HTTPS (Recommended for Production)
- Get SSL certificate for 192.168.1.24 or domain
- Run dev server on HTTPS

### Option 2: Force Manual Location Entry (Quick Fix)
- Skip auto-geolocation on HTTP
- Show "Enter Location Manually" prompt
- User can then use "Pick from Map" feature

### Option 3: Test on Localhost
- Access on Mac via `http://localhost:5173`
- Geolocation works on localhost even with HTTP

## Quick Fix - Disable Geolocation on HTTP

We can add a check: if on HTTP (not localhost/secure), skip auto-geolocation and prompt user to enter location manually.

## For Now
Since you're on `http://192.168.1.24`, geolocation won't work.

### Workaround:
1. Click "Change Location" on home screen
2. Click "📍 Pick from Map"
3. Drag marker to your location
4. Save it

This achieves the same result as auto-geolocation!
