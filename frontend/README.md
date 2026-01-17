# Electricity Monitor Frontend

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Backend URL:
   - Open `store/useStore.ts`
   - Set `API_URL` to your backend address (e.g., `http://10.0.2.2:8000` for Android Emulator, or your local IP).

3. Run the app:
   ```bash
   npx expo start
   ```
   - Press `a` for Android.
   - Scan QR code with Expo Go.

## Android Build

1. Configure `app.json`:
   - Update `package` to your unique ID.
   - Add `google-services.json` for Google Sign-In.

2. Build APK:
   ```bash
   eas build -p android --profile preview
   ```
