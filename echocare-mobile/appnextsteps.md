# CoCarely React Native App — Next Steps & Production Readiness

## Current Status: Beta-Ready (Not Production-Ready Yet)

The app is **functionally complete** and connects to the live NestJS backend at
`https://discipline-ai-api-337728476024.us-central1.run.app`. However, several
items must be addressed before App Store / Play Store submission.

---

## Bugs Fixed in This Review

| # | Bug | Fix Applied |
|---|-----|-------------|
| 1 | API response parsing assumed `res.data.data` wrapper — NestJS returns data directly | All screens updated to handle `res.data` directly |
| 2 | Calendar status `no_data` from NestJS vs `no_call` in app | Fixed to handle both `no_data` and `no_call` |
| 3 | Calls list response expected `res.data.data.calls` — NestJS returns `{ calls, total, page, pageSize }` directly | Fixed to `res.data.calls` |

---

## What Works

- Login (phone + password via NestJS `/api/v1/auth/login`)
- Dashboard with patient cards, adherence stats, alerts
- Patient list with search
- Patient detail — 5 tabs (Overview, Today, Calendar, Calls, Medicines)
- Reports with adherence trends, per-medicine compliance bars, mood logs
- Settings with profile editing, notification toggles, subscriptions
- Pull-to-refresh on all screens
- Bottom tab navigation
- JWT auth with AsyncStorage persistence
- Token refresh interceptor

---

## App Store / Play Store Compatibility

### Is it compatible? **Yes, with the steps below.**

The app uses **Expo SDK 52** which supports building native binaries for both stores via [EAS Build](https://docs.expo.dev/build/introduction/).

### Required for Store Submission

#### 1. EAS Build Setup
```bash
npm install -g eas-cli
eas login
eas build:configure
```

#### 2. iOS (App Store)
- [ ] Apple Developer Account ($99/year) — https://developer.apple.com
- [ ] Create App ID and provisioning profile in Apple Developer Portal
- [ ] Replace placeholder `assets/icon.png` with a real 1024x1024 app icon
- [ ] Add splash screen image (`assets/splash.png`)
- [ ] Update `app.json` with real `bundleIdentifier`
- [ ] Build: `eas build --platform ios --profile production`
- [ ] Submit: `eas submit --platform ios`

#### 3. Android (Play Store)
- [ ] Google Play Developer Account ($25 one-time) — https://play.google.com/console
- [ ] Replace placeholder `assets/icon.png` with adaptive icon (foreground + background)
- [ ] Update `app.json` with real `package` name
- [ ] Build: `eas build --platform android --profile production`
- [ ] Submit: `eas submit --platform android`

#### 4. `eas.json` Config (create this file)
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

---

## Production Readiness Checklist

### Must Fix Before Launch (P0)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | **App icon & splash screen** | Missing | Replace placeholder `assets/icon.png` with branded 1024x1024 icon |
| 2 | **Firebase OTP auth** | Not implemented | Currently uses phone+password login. NestJS has `verify-otp` endpoint ready. Need Firebase Auth SDK for phone OTP |
| 3 | **Token refresh flow** | Partial | `refreshToken` is stored but auto-refresh on 401 is not wired. Add silent refresh in axios interceptor |
| 4 | **Error states & empty states** | Basic | Add proper error screens, retry buttons, offline detection |
| 5 | **Test on real devices** | Not done | Must test on iOS 16+ and Android 12+ physical devices |
| 6 | **Environment config** | Hardcoded URL | Move `API_URL` to `app.config.js` with env-based switching (dev/staging/prod) |

### Should Fix (P1)

| # | Item | Notes |
|---|------|-------|
| 7 | **Push notifications** | Use `expo-notifications` + Firebase Cloud Messaging for missed-medicine alerts |
| 8 | **Biometric auth** | `expo-local-authentication` for Face ID / fingerprint unlock |
| 9 | **Offline caching** | Cache patient data locally so the app works without network |
| 10 | **Loading skeletons** | Replace spinner with skeleton shimmer for better perceived performance |
| 11 | **Deep linking** | Handle `cocarely://patient/:id` links from WhatsApp reports |
| 12 | **Analytics** | Add Mixpanel/Amplitude to track screen views, feature usage |
| 13 | **Crash reporting** | Sentry or Bugsnag for production error tracking |
| 14 | **Accessibility** | Add `accessibilityLabel` to all interactive elements |

### Nice to Have (P2)

| # | Item | Notes |
|---|------|-------|
| 15 | Dark mode | Use `useColorScheme()` + theme switching |
| 16 | Patient onboarding | Add new patient wizard from the app |
| 17 | Call audio playback | Play call recordings from the app |
| 18 | Share reports | Generate & share PDF/WhatsApp summary |
| 19 | Haptic feedback | Add subtle haptics on tab switches, button presses |
| 20 | Localization | Hindi/regional language support |

---

## How to Run Locally

```bash
# 1. Navigate to the project
cd echocare-mobile

# 2. Install dependencies
npm install

# 3. Start Expo dev server
npx expo start

# 4. On your phone:
#    - Install "Expo Go" from App Store / Play Store
#    - Scan the QR code shown in terminal
#    - App loads on your phone
```

### Running on Simulators
```bash
# iOS Simulator (macOS only, requires Xcode)
npx expo start --ios

# Android Emulator (requires Android Studio)
npx expo start --android
```

---

## Environment Configuration (Recommended)

Replace `app.json` with `app.config.js` for env-based config:

```js
// app.config.js
const IS_PROD = process.env.APP_ENV === 'production';

export default {
  expo: {
    name: IS_PROD ? 'CoCarely' : 'CoCarely (Dev)',
    slug: 'cocarely-mobile',
    extra: {
      apiUrl: IS_PROD
        ? 'https://discipline-ai-api-337728476024.us-central1.run.app'
        : 'http://localhost:3001',
    },
  },
};
```

Then in `api.js`:
```js
import Constants from 'expo-constants';
const API_URL = Constants.expoConfig.extra.apiUrl;
```

---

## Token Refresh Fix (Recommended)

Add this to `src/services/api.js` interceptor:

```js
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('cocarely_refresh_token');
        const res = await axios.post(`${API_URL}${PREFIX}/auth/refresh`, { refreshToken });
        await AsyncStorage.setItem('cocarely_token', res.data.token);
        await AsyncStorage.setItem('cocarely_refresh_token', res.data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
        return api(originalRequest);
      } catch {
        await AsyncStorage.multiRemove(['cocarely_token', 'cocarely_refresh_token']);
      }
    }
    return Promise.reject(err);
  }
);
```

---

## Firebase OTP Integration (Required for Production)

The NestJS backend already has `POST /api/v1/auth/verify-otp` which accepts a `firebaseToken`.

Steps:
1. Install: `npx expo install @react-native-firebase/app @react-native-firebase/auth`
2. Add Firebase config to `app.json` (google-services.json / GoogleService-Info.plist)
3. Replace password login with Firebase phone auth flow
4. Send the Firebase ID token to `/api/v1/auth/verify-otp`

---

## Project Structure

```
echocare-mobile/
├── App.js                          # Entry + font loading + navigation container
├── app.json                        # Expo config
├── package.json                    # Dependencies
├── assets/
│   ├── fonts/                      # Fraunces + Manrope TTF files
│   └── icon.png                    # App icon (placeholder — replace!)
└── src/
    ├── components/Icons.js         # 16 SVG icon components
    ├── hooks/useAuth.js            # Auth context + login/logout
    ├── navigation/
    │   ├── AppNavigator.js         # Bottom tabs + patient detail stacks
    │   └── AuthNavigator.js        # Login stack
    ├── screens/
    │   ├── LoginScreen.js          # Phone + password login
    │   ├── DashboardScreen.js      # Home — stats, alerts, patient cards
    │   ├── PatientsScreen.js       # Search + patient list
    │   ├── PatientDetailScreen.js  # 5-tab detail (Overview/Today/Calendar/Calls/Meds)
    │   ├── ReportsScreen.js        # Charts, per-med compliance, mood
    │   └── SettingsScreen.js       # Profile, notifications, subscription, logout
    ├── services/api.js             # Axios client → NestJS backend
    └── theme/index.js              # Colors, fonts, spacing, radius
```

---

## Summary

| Area | Status |
|------|--------|
| Core features | Done |
| NestJS API integration | Done (all endpoints wired) |
| Android compatible | Yes (via Expo/EAS) |
| iOS compatible | Yes (via Expo/EAS) |
| Production ready | No — needs icon, OTP auth, token refresh, device testing |
| Store submittable | After P0 items above |
