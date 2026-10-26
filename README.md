# Restaurant App: Android APKs (testing builds)

There are two APKs:

| File | Data | Needs |
|------|------|-------|
| [RestaurantApp-Database.apk](https://github.com/Waqasjan76/Restaurant-App-/raw/apk/RestaurantApp-Database.apk) | MongoDB backend (Assignment 2, latest `main`) | The test backend must be running on the developer PC with its tunnel open |
| [RestaurantApp.apk](https://github.com/Waqasjan76/Restaurant-App-/raw/apk/RestaurantApp.apk) | Offline demo data on the phone (Assignment 1) | Nothing |

The database APK talks to `https://dodge-teaches-per-inc.trycloudflare.com/api`, a temporary test tunnel. If the backend or tunnel is stopped, or the tunnel address changes, that APK shows "Cannot reach the restaurant API" until it is rebuilt.

## Offline APK

**Download:** [RestaurantApp.apk](https://github.com/Waqasjan76/Restaurant-App-/raw/apk/RestaurantApp.apk) (43.7 MB)

- Android 7.0 or newer (arm64 and armv7 phones)
- Works fully offline with built-in demo data. No server needed.
- Built from the Assignment 1 version of the app (commit `c9a6401` on `main`).

## Install
1. Open the download link on the phone and download the APK.
2. Tap the file. If Android asks, allow **Install unknown apps** for your browser or file manager.
3. Open **Restaurant App**.

## Demo logins
| Role | Email | Password |
|------|-------|----------|
| Customer | customer@demo.com | Customer123 |
| Manager | manager@demo.com | Manager123 |

Promo codes: `WELCOME10`, `STUDENT15`, `FEAST20`
