# EchoCare Mobile App (React Native / Expo)

AI-powered medication adherence monitoring dashboard for caregivers.

## Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS App Store / Google Play Store)

### Setup

```bash
cd echocare-mobile

# Install dependencies
npm install

# Download fonts (see Fonts section below)

# Start the dev server
npx expo start
```

Scan the QR code with Expo Go (Android) or Camera (iOS) to run on your phone.

### Fonts Setup

Download these fonts and place them in `assets/fonts/`:

1. **Fraunces** - from [Google Fonts](https://fonts.google.com/specimen/Fraunces)
   - `Fraunces-Medium.ttf`
   - `Fraunces-SemiBold.ttf`

2. **Manrope** - from [Google Fonts](https://fonts.google.com/specimen/Manrope)
   - `Manrope-Regular.ttf`
   - `Manrope-Medium.ttf`
   - `Manrope-SemiBold.ttf`
   - `Manrope-Bold.ttf`

### Backend Configuration

Edit `src/services/api.js` and set `API_URL` to your NestJS backend:

```js
const API_URL = 'https://discipline-ai-api-337728476024.us-central1.run.app';
```

The app expects these endpoints (matching the existing NestJS API):
- `POST /auth/login` - Login with phone number
- `GET /auth/me` - Get current user
- `GET /patients` - List patients
- `GET /patients/:id` - Get patient detail
- `GET /patients/:id/adherence/today` - Today's adherence
- `GET /patients/:id/adherence/calendar` - Monthly calendar
- `GET /patients/:id/stats` - Stats for period
- `GET /patients/:id/medicines` - Patient medicines
- `GET /patients/:id/calls` - Call history (paginated)
- `GET /users/me` - User profile
- `PUT /users/me` - Update profile

### Building for Stores

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## Project Structure

```
echocare-mobile/
├── App.js                    # Entry point
├── app.json                  # Expo config
├── assets/fonts/             # Custom fonts
├── src/
│   ├── components/
│   │   └── Icons.js          # SVG icon components
│   ├── hooks/
│   │   └── useAuth.js        # Auth context & hook
│   ├── navigation/
│   │   ├── AppNavigator.js   # Bottom tabs + stacks
│   │   └── AuthNavigator.js  # Login flow
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── PatientsScreen.js
│   │   ├── PatientDetailScreen.js
│   │   ├── ReportsScreen.js
│   │   └── SettingsScreen.js
│   ├── services/
│   │   └── api.js            # Axios API client
│   └── theme/
│       └── index.js          # Colors, fonts, spacing
```

## Features

- **Dashboard**: Family overview with adherence stats, alerts, patient cards
- **Patients**: Search & browse with health conditions, streaks
- **Patient Detail**: 5 tabs - Overview, Today, Calendar, Calls, Medicines
- **Reports**: Charts for adherence trends, per-medicine compliance, vitals, mood
- **Settings**: Profile, notifications, subscription management
- **Pull-to-refresh** on all data screens
- **Native navigation** with bottom tabs

## Tech Stack

- Expo SDK 52
- React Navigation 7
- react-native-chart-kit (charts)
- react-native-svg (icons)
- AsyncStorage (auth persistence)
- expo-linear-gradient (login gradient)
