# Authentication System Documentation

## Overview

The system uses a **hybrid two-layer authentication architecture**:
1. **Firebase Authentication** - Client-side phone verification via OTP
2. **JWT (JSON Web Tokens)** - Server-side stateless session management

This approach combines Firebase's robust SMS/OTP handling with your API's stateless JWT validation.

---

## Architecture Diagram

```mermaid
graph TB
    subgraph Client["Frontend (Next.js)"]
        Login["Login Page"]
        Firebase["Firebase SDK<br/>Phone Auth"]
        LocalStorage["localStorage<br/>token + refreshToken"]
    end

    subgraph FirebaseAuth["Firebase Authentication<br/>(External Service)"]
        SMS["Send OTP via SMS"]
        OTP["Verify OTP"]
        IDToken["Return ID Token<br/>(contains phone_number)"]
    end

    subgraph Backend["Backend API (NestJS)"]
        VerifyEndpoint["/auth/verify-otp"]
        FirebaseVerify["Verify Firebase<br/>ID Token<br/>(Firebase Admin SDK)"]
        ExtractPhone["Extract & Normalize<br/>Phone Number"]
        UserLookup["Check if User Exists<br/>in MongoDB"]
        CreateUser["Create New User<br/>or Update Existing"]
        JwtGen["Generate Tokens<br/>- Access Token 30m<br/>- Refresh Token 7d"]
        Response["Return User + Tokens"]
    end

    subgraph Database["MongoDB"]
        UserDB["Users Collection"]
    end

    subgraph ProtectedRoutes["Protected API Routes"]
        Guard["JwtAuthGuard<br/>Validates JWT"]
        Handler["Route Handler<br/>Process Request"]
    end

    Client -->|1. User enters phone| Firebase
    Firebase -->|2. Send OTP| SMS
    SMS -->|3. User receives SMS| Client
    Client -->|4. User verifies OTP| Firebase
    Firebase -->|5. OTP correct| OTP
    OTP -->|6. Return ID Token| IDToken
    IDToken -->|7. Send ID Token| VerifyEndpoint
    VerifyEndpoint -->|8. Verify token| FirebaseVerify
    FirebaseVerify -->|9. Token valid| ExtractPhone
    ExtractPhone -->|10. Query user| UserLookup
    UserLookup -->|11. Check MongoDB| UserDB
    UserDB -->|12. User data| UserLookup
    UserLookup -->|13. Create/Update| CreateUser
    CreateUser -->|14. Save to DB| UserDB
    CreateUser -->|15. Generate JWT| JwtGen
    JwtGen -->|16. Return tokens + user| Response
    Response -->|17. Store in localStorage| LocalStorage
    LocalStorage -->|18. Include in headers<br/>Authorization: Bearer JWT| ProtectedRoutes
    ProtectedRoutes -->|19. Validate JWT| Guard
    Guard -->|20. Extract user payload| Handler
    Handler -->|21. Process request| Backend
```

---

## Authentication Flows

### 1. B2C Payer - Phone-Based Registration/Login

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend<br/>(Next.js)
    participant Firebase as Firebase Auth
    participant Backend as Backend API
    participant Database as MongoDB

    User->>Frontend: Enter phone number
    Frontend->>Firebase: Send verification request
    Firebase->>User: Send OTP via SMS
    User->>Frontend: Enter OTP
    Frontend->>Firebase: Verify OTP
    Firebase->>Frontend: Return ID Token
    Frontend->>Backend: POST /auth/verify-otp<br/>(firebaseIdToken, name?, location?, timezone?)
    Backend->>Backend: Verify Firebase ID Token<br/>Extract phone_number
    Backend->>Database: Query user by phone
    alt User Exists
        Database-->>Backend: User found
        Backend->>Database: Update firebaseUid & phoneVerified
        Backend->>Backend: Generate JWT tokens
        Backend-->>Frontend: Return user + token + refreshToken
        Note over Frontend: isNewUser: false
    else User Doesn't Exist
        Database-->>Backend: No user found
        alt Name provided
            Backend->>Database: Create new user with role='payer'
            Backend->>Backend: Generate JWT tokens
            Backend-->>Frontend: Return user + token + refreshToken
            Note over Frontend: isNewUser: true
        else Name NOT provided
            Backend-->>Frontend: needsRegistration: true, phone
            Note over Frontend: Redirect to registration page
        end
    end
    Frontend->>Frontend: Store token & refreshToken in localStorage
    Frontend->>Frontend: Redirect to dashboard
```

### 2. B2B Hospital Admin - Email-Based Login

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend
    participant Backend as Backend API
    participant Database as MongoDB

    User->>Frontend: Enter email + password
    Frontend->>Backend: POST /auth/login<br/>(identifier, password)
    Backend->>Database: Query user by email
    alt User Found
        Database-->>Backend: User document
        Backend->>Backend: Verify password with bcrypt.compare()
        alt Password Valid
            Backend->>Backend: Generate JWT tokens
            Backend-->>Frontend: Return user + token + refreshToken
        else Password Invalid
            Backend-->>Frontend: 401 Unauthorized
        end
    else User Not Found
        Backend-->>Frontend: 401 Invalid credentials
    end
    Frontend->>Frontend: Store tokens in localStorage
    Frontend->>Frontend: Redirect to dashboard
```

### 3. Token Refresh Flow

```mermaid
sequenceDiagram
    participant Frontend as Frontend
    participant Backend as Backend API

    Frontend->>Frontend: Check token expiration
    alt Access Token Expired & Refresh Token Valid
        Frontend->>Backend: POST /auth/refresh<br/>(refreshToken)
        Backend->>Backend: Verify refresh token<br/>Extract user ID
        Backend->>Backend: Generate new JWT tokens
        Backend-->>Frontend: Return new token + refreshToken
        Frontend->>Frontend: Update localStorage
    else Both Tokens Expired
        Frontend->>Frontend: Redirect to login
    end
```

### 4. Accessing Protected Routes

```mermaid
sequenceDiagram
    participant Frontend as Frontend
    participant Backend as Backend API
    participant Guard as JwtAuthGuard
    participant Handler as Route Handler

    Frontend->>Backend: GET /protected-route<br/>Header: Authorization: Bearer {token}
    Backend->>Guard: Check if route is protected
    Guard->>Guard: Extract JWT from Authorization header
    Guard->>Guard: Verify JWT signature using JWT_SECRET
    alt Signature Valid & Token Not Expired
        Guard->>Guard: Decode payload<br/>Extract userId & role
        Guard->>Handler: Pass user object (userId, role)
        Handler->>Handler: Process request with user context
        Handler-->>Frontend: Return response (200)
    else Invalid or Expired
        Guard-->>Frontend: 401 Unauthorized
    end
```

---

## Implementation Details

### Environment Variables

**Backend (.env):**
```env
# JWT Configuration
JWT_SECRET=a33a5e7071c9ad3473fd9bbc3d50d866e56d2ea99681b8f1d386fd84aaa2c495
JWT_EXPIRES_IN=30m
JWT_REFRESH_SECRET=6162683df739199e14487ce432e59efeaf482d81b50d2a2c00b8919890ef362d
JWT_REFRESH_EXPIRES_IN=7d

# Firebase Configuration
FIREBASE_PROJECT_ID=gen-lang-client-0753210648
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@gen-lang-client-0753210648.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Core Files

| File | Purpose |
|------|---------|
| [auth.service.ts](../apps/api/src/auth/auth.service.ts) | Core auth logic: register, login, Firebase verification, JWT generation |
| [auth.controller.ts](../apps/api/src/auth/auth.controller.ts) | REST endpoints: /auth/login, /auth/verify-otp, /auth/refresh, /auth/register |
| [jwt.strategy.ts](../apps/api/src/auth/strategies/jwt.strategy.ts) | Passport JWT strategy for token validation |
| [jwt-auth.guard.ts](../apps/api/src/common/guards/jwt-auth.guard.ts) | NestJS guard that enforces JWT validation on routes |
| [firebase-admin.module.ts](../apps/api/src/firebase/firebase-admin.module.ts) | Firebase Admin SDK initialization |
| [firebase.ts](../apps/web/lib/firebase.ts) | Firebase client initialization (frontend) |
| [use-auth.ts](../apps/web/lib/hooks/use-auth.ts) | React hook managing authentication state |
| [auth.ts](../apps/web/lib/api/auth.ts) | Frontend API client for auth endpoints |

---

## Token Details

### Access Token (JWT)

**Expiration:** 30 minutes
**Purpose:** Authenticate API requests
**Payload:**
```json
{
  "sub": "user_mongodb_id",
  "role": "payer|hospital_admin|super_admin",
  "iat": 1234567890,
  "exp": 1234569690
}
```

**Usage:**
```bash
curl -H "Authorization: Bearer {token}" https://api.example.com/dashboard
```

### Refresh Token

**Expiration:** 7 days
**Purpose:** Obtain new access tokens without re-authenticating
**Flow:**
1. Access token expires
2. Frontend sends refresh token to `/auth/refresh`
3. Backend validates refresh token & generates new pair
4. Frontend updates localStorage with new tokens

---

## User Types & Roles

### 1. **Payer** (B2C)
- Senior citizen paying for healthcare
- **Authentication:** Firebase phone OTP
- **Identifier:** Phone number
- **Data:** name, phone, timezone, location, relationship_to_patient

### 2. **Hospital Admin** (B2B)
- Hospital administrator managing patients
- **Authentication:** Email + password (bcrypt hashed)
- **Identifier:** Email
- **Data:** email, name, hospitalName, timezone

### 3. **Super Admin**
- System administrator
- **Authentication:** Email + password
- **Identifier:** Email

---

## Security Considerations

### ✅ Implemented

- **Firebase OTP Verification:** Phone numbers verified by Firebase before trusting
- **JWT Signature Validation:** Every token validated with JWT_SECRET before processing
- **Password Hashing:** Admin passwords hashed with bcrypt (12 rounds)
- **Token Expiration:** Access tokens short-lived (30m), refresh tokens medium-lived (7d)
- **Phone Normalization:** Consistent handling of phone formats (removes `+` prefix)
- **Firebase UID Tracking:** Stores Firebase UID in user record for audit & phone recovery
- **CORS Configuration:** Dynamic origin validation in main.ts
- **Public Routes:** `/auth/login`, `/auth/register/*`, `/auth/verify-otp` marked with `@Public()` decorator

### ⚠️ Known Risks & Recommendations

| Risk | Current Implementation | Recommendation |
|------|------------------------|-----------------|
| **XSS via localStorage** | Tokens stored in localStorage | Consider httpOnly cookies + CSRF tokens for higher security |
| **Token replay attacks** | No request signing | Consider request signatures for sensitive operations |
| **Refresh token rotation** | Not rotating on use | Implement rotation: old token invalidated after refresh |
| **Phone number updates** | No validation workflow | Require phone re-verification if user changes phone |

---

## Common Operations

### Register New B2C Payer

```bash
# Frontend initiates Firebase OTP flow
# User verifies OTP with Firebase
# Frontend sends Firebase ID Token to backend

curl -X POST https://api.example.com/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseIdToken": "eyJhbGciOiJSUzI1NiIs...",
    "name": "John Doe",
    "location": "New York",
    "timezone": "America/New_York"
  }'

# Response
{
  "user": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "phone": "919876543210",
    "name": "John Doe",
    "role": "payer",
    "timezone": "America/New_York"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isNewUser": true
}
```

### Login Hospital Admin

```bash
curl -X POST https://api.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@hospital.com",
    "password": "SecurePassword123"
  }'

# Response
{
  "user": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "admin@hospital.com",
    "name": "Admin Name",
    "role": "hospital_admin",
    "hospitalName": "City Hospital"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Refresh Access Token

```bash
curl -X POST https://api.example.com/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Access Protected Route

```bash
curl -X GET https://api.example.com/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Response
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "phone": "919876543210",
  "name": "John Doe",
  "role": "payer",
  "phoneVerified": true,
  "firebaseUid": "xK2mR9pL..."
}
```

---

## Troubleshooting

### "Invalid or expired Firebase token"
- **Cause:** Firebase ID token expired or invalid
- **Fix:** User needs to re-verify OTP in Firebase auth flow

### "Invalid refresh token"
- **Cause:** Refresh token expired (7 days) or tampered with
- **Fix:** User needs to log in again

### "Invalid or expired token" on protected routes
- **Cause:** Access token expired or invalid signature
- **Fix:** Call `/auth/refresh` with refresh token to get new access token

### "Phone number already registered"
- **Cause:** Phone exists in database
- **Fix:** User should log in with existing account instead of registering

### Firebase token verification fails
- **Cause:** Firebase_PRIVATE_KEY malformed in .env
- **Fix:** Ensure private key includes literal `\n` characters or is properly escaped

---

## Future Enhancements

- [ ] Implement refresh token rotation (invalidate old token after refresh)
- [ ] Add phone number change verification workflow
- [ ] Implement httpOnly cookies for token storage
- [ ] Add multi-factor authentication (MFA)
- [ ] Add login audit trail / device tracking
- [ ] Implement rate limiting on auth endpoints
- [ ] Add password reset flow for admin accounts
- [ ] Implement OAuth2 for enterprise SSO
