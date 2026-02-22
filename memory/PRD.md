# EchoCare Mobile App - PRD

## Original Problem Statement
Build a React Native mobile app for EchoCare (Health Discipline AI) that connects directly to the existing NestJS backend, allowing caregivers to check the patient dashboard on Android and iOS.

## Architecture
- **App**: React Native (Expo SDK 52) — cross-platform Android & iOS
- **Navigation**: React Navigation 7 (bottom tabs + native stacks)
- **Charts**: react-native-chart-kit
- **Icons**: Custom SVG via react-native-svg
- **Auth**: AsyncStorage + JWT Bearer tokens
- **Backend**: Existing NestJS API (no changes needed)
- **Branch**: `react-native-app`

## User Personas
1. **Primary**: NRI children (25-45) monitoring elderly parents' medicine intake from abroad
2. **Secondary**: Local family caregivers checking daily adherence on the go

## Core Requirements
- Native mobile app for both Android & iOS (via Expo)
- Login with phone number
- Bottom tab navigation (Home / Patients / Reports / Settings)
- Dashboard with real-time patient overview, adherence stats, alerts
- Patient detail with 5-tab view (Overview / Today / Calendar / Calls / Medicines)
- Reports with adherence trend charts, per-medicine compliance bars, vitals, mood logs
- Settings with profile editing, notification toggles, subscription info, logout
- Pull-to-refresh on all data screens

## What's Been Implemented (Feb 22, 2026)

### React Native App (`/app/echocare-mobile/`)
- [x] Expo project setup with all dependencies
- [x] Custom fonts (Fraunces + Manrope) downloaded and configured
- [x] Auth system (AsyncStorage + JWT + AuthContext)
- [x] API service connecting to NestJS backend
- [x] LoginScreen with gradient, phone input
- [x] DashboardScreen with greeting, stats, alerts, patient cards, pull-to-refresh
- [x] PatientsScreen with search, patient list, health conditions, streaks
- [x] PatientDetailScreen with 5 tabs (Overview, Today, Calendar, Calls, Meds)
  - Adherence trend chart, period selector, per-medicine bars
  - Today's medicine checklist, vitals, complaints
  - Calendar with color-coded days
  - Paginated call history
  - Medicine list with timing, food pref, nicknames, critical badges
- [x] ReportsScreen with patient/period selectors, charts, mood timeline
- [x] SettingsScreen with profile, notifications, subscriptions, logout
- [x] SVG icon components (16 icons)
- [x] Warm Sand + Sage Green + Terracotta design theme
- [x] Bottom tab navigation with active state indicators

### Previous: Web Dashboard (`app-master` branch)
- [x] React web app (mobile-responsive) with FastAPI mock backend
- [x] All 6 pages functional with charts and mock data

## Prioritized Backlog
### P0 (Critical)
- Test on physical device via Expo Go
- Configure API_URL to production NestJS backend

### P1 (Important)
- Push notifications (expo-notifications)
- Biometric auth (expo-local-authentication)
- Offline mode / data caching
- OTP-based login flow

### P2 (Nice to Have)
- App Store / Play Store submission (EAS Build)
- Dark mode support
- Patient onboarding wizard
- Call audio playback
- Share reports via WhatsApp

## Next Tasks
1. Set API_URL in `src/services/api.js` to production NestJS backend
2. Test on Expo Go (iOS + Android)
3. Add push notifications for missed medicine alerts
4. Run `eas build` for store submission
