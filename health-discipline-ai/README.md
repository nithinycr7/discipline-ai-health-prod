# Health Discipline AI

AI-powered medication adherence monitoring platform using voice calls.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router, React Server Components)
- **Backend:** NestJS (TypeScript, REST API)
- **Database:** MongoDB Atlas
- **AI Voice:** ElevenLabs (TTS)
- **Telephony:** Twilio (calls, WhatsApp)
- **Payments:** Razorpay + Stripe

## Project Structure

- `apps/web` - Next.js frontend
- `apps/api` - NestJS backend
- `packages/shared` - Shared TypeScript types and utilities
- `packages/eslint-config` - Shared ESLint configuration
- `packages/tsconfig` - Shared TypeScript configuration

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB Atlas account
- Twilio account
- ElevenLabs account

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Run development servers
npm run dev
```

### Development

```bash
# Run all apps in development mode
npm run dev

# Run specific app
npm run dev --filter=web
npm run dev --filter=api

# Build all apps
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

## Environment Variables

### Backend (apps/api)

- `NODE_ENV` - Environment (development/production)
- `PORT` - API server port (default: 3001)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT token signing
- `JWT_EXPIRES_IN` - JWT expiration time (default: 15m)
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `FRONTEND_URL` - Next.js frontend URL (for CORS)

### Frontend (apps/web)

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_ENV` - Environment name

## License

Proprietary
