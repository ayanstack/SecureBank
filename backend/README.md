# SecureBank — Production Backend Documentation

SecureBank is a resilient, banking-grade backend built with Node.js ES modules, Express 5, and MongoDB/Mongoose. It features strict RBAC, multi-document ACID transactions with 2-phase conditional fallback, idempotency protections, anti-enumeration security, and NoSQL injection safeguards.

---

## 1. System Requirements & Prerequisites

- **Node.js**: `v18.x` or higher (`v24.x` recommended and verified).
- **Package Manager**: `npm` (v10+).
- **MongoDB**: `v6.x` or `v7.x` (Replica set recommended for native multi-document transactions; standalone MongoDB is supported via built-in atomic 2-phase conditional updates).
- **SMTP Provider**: Any standard SMTP provider (e.g. Gmail App Password, AWS SES, SendGrid).

---

## 2. Installation & Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in the required values:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   MONGO_URI=mongodb://localhost:27017/securebank
   JWT_ACCESS_SECRET=your_jwt_access_secret_min_32_characters_long
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_characters_long
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   ```

---

## 3. Running the Server

### Development Mode (with automatic reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Running Automated Test Suite
```bash
npm test
```
The test suite utilizes the Node.js native test runner (`node --test`) to execute 34 isolated integration tests covering authentication, authorization, IDOR prevention, banking operations, transfers, idempotency, statements, and security.

---

## 4. Architectural & Security Design

### Authentication & Sessions
- **Passwords**: Hashed with `bcryptjs` using a cost factor of 12. Password hashes are excluded from all query projections by default (`select: false`).
- **Token Design**:
  - **Access Token**: Short-lived (15 minutes), signed with `JWT_ACCESS_SECRET`, includes `userId`, `role`, and `sessionId`.
  - **Refresh Token**: 7-day expiry, stored in the database `Session` model.
  - **Token Rotation**: Every call to `POST /api/auth/refresh` rotates the refresh token, invalidating the old token.
  - **Reuse Detection**: If a revoked refresh token is re-submitted, all active sessions for that user are revoked immediately.
- **Account Lockout**: After 5 consecutive failed login attempts, the user account is locked for 15 minutes.
- **Anti-Enumeration**: Endpoints such as `forgot-password` and `resend-verification` return identical success responses regardless of whether an email exists in the database.

### Transaction PIN & Anti-Brute Force
- Transaction PINs are 4-digit numeric secrets stored as bcrypt hashes.
- Verification enforces a strict 3-attempt limit with a 15-minute lockout cooldown upon failure.
- Changing the PIN requires re-verifying the current PIN.

### Money Transfers & Financial Correctness
- **Monetary Precision**: All calculations use integer minor-unit arithmetic (paise/cents) through `src/utils/money.mjs` to eliminate IEEE 754 floating-point errors.
- **Dual Transaction Strategy**:
  - **Replica Set**: Automatically detects replica set support and executes transfers within MongoDB multi-document ACID transactions (`session.startTransaction()`).
  - **Standalone MongoDB**: Seamlessly falls back to atomic 2-phase conditional updates (`balance: { $gte: amount }`) with automatic rollback.
- **Idempotency Protection**: Transfers accept an `Idempotency-Key` HTTP header (or body parameter). Retried requests replay the existing transaction record without duplicate debiting.
- **Self-Transfer Prevention**: Sender and receiver accounts cannot be identical.
- **Daily Transfer Limit**: Enforces a strict daily cap (₹50,000) per account.
- **Reversal Accounting**: Reversals credit the sender (`-CR`) and debit the receiver (`-DR`), verifying sufficient balance before execution.

### Security Hardening
- **NoSQL Injection**: Custom Express 5-compatible middleware `src/middleware/noSqlSanitize.mjs` deeply cleans request bodies and blocks dangerous query/parameter operators (`$where`, `$gt`, `$ne`, dotted paths).
- **Formula Injection**: CSV statement downloads escape leading `=+\-@\t\r` characters with single quotes.
- **Rate Limiting**:
  - Global API: 500 requests / 15 minutes.
  - Auth routes: 60 attempts / 15 minutes.
  - OTP routes: 20 attempts / 15 minutes.
  - Statement email: 10 emails / 15 minutes.
- **Cache-Control**: Sensitive financial endpoints set `Cache-Control: no-store, no-cache, must-revalidate, private` to prevent intermediary proxy caching.
- **Graceful Shutdown**: Handles `SIGINT` and `SIGTERM`, draining pending requests, terminating Socket.IO, and closing MongoDB connections cleanly.

---

## 5. API Reference Summary

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register new customer account |
| POST | `/login` | Authenticate and receive access + refresh tokens |
| POST | `/verify-email` | Verify email address using token |
| POST | `/resend-verification` | Resend verification email |
| POST | `/refresh` | Rotate refresh token & obtain new access token |
| POST | `/logout` | Revoke current refresh token session |
| PUT | `/change-password` | Authenticated password change (revokes sessions) |
| POST | `/forgot-password` | Request password reset token |
| POST | `/reset-password` | Reset password with token (revokes sessions) |

### User Profile & PIN (`/api/users`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/me` | Get authenticated user profile |
| PATCH | `/profile` | Update allowed profile fields (`firstName`, `lastName`) |
| POST | `/transaction-pin` | Set initial 4-digit transaction PIN |
| POST | `/verify-transaction-pin`| Verify transaction PIN with attempt lockout |
| PUT | `/transaction-pin` | Change transaction PIN |

### Bank Accounts (`/api/accounts`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create SAVINGS or CURRENT account |
| GET | `/` | List owned bank accounts |
| GET | `/:id` | Get details of single owned account |
| PATCH | `/:id/freeze` | Freeze active account |
| PATCH | `/:id/unfreeze`| Unfreeze frozen account |
| PATCH | `/:id/close` | Close account (zero balance required) |
| PATCH | `/:id/primary` | Set primary bank account |

### Transactions (`/api/transactions`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/deposit` | Deposit money (atomic balance increment) |
| POST | `/withdraw` | Withdraw money (atomic balance check) |
| GET | `/history/:accountId` | Filtered, paginated transaction history |
| GET | `/:id` | Get details of single transaction |

### Money Transfers (`/api/transfers`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Execute transfer with PIN & idempotency key |
| GET | `/:id` | View transfer details (sender or receiver only) |
| PATCH | `/:id/reverse` | Reverse a completed transfer |

### Beneficiaries (`/api/beneficiaries`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Add beneficiary (validates IFSC & own-account check) |
| GET | `/` | List owned beneficiaries with pagination |
| PUT | `/:id` | Update beneficiary details |
| DELETE | `/:id` | Delete beneficiary |
| PATCH | `/:id/activate` | Activate beneficiary |
| PATCH | `/:id/deactivate` | Deactivate beneficiary |

### Bank Statements (`/api/statements`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/:accountId` | Full paginated account statement with date filters |
| GET | `/:accountId/summary` | Statement summary (opening, closing, credits, debits) |
| GET | `/:accountId/mini` | Mini statement (latest 5 transactions) |
| GET | `/:accountId/monthly` | Statement for specific month and year |
| GET | `/:accountId/download/csv` | Download CSV statement with formula injection protection |
| GET | `/:accountId/download/pdf` | Download formatted PDF statement |
| POST | `/:accountId/email` | Email statement as attached PDF |

### OTP Services (`/api/otp`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Generate OTP with 60s cooldown |
| POST | `/verify` | Verify OTP code (max 5 attempts) |
| POST | `/resend` | Resend OTP with cooldown |

### Sessions & Notifications
| Route | Methods | Description |
|---|---|---|
| `/api/sessions` | GET, DELETE | Manage active sessions and revoke devices |
| `/api/sessions/others` | DELETE | Revoke all other active sessions |
| `/api/notifications` | GET, PATCH, DELETE | Real-time and persistent notification management |
| `/api/dashboard` | GET | Aggregated customer dashboard statistics |
| `/api/health` | GET | Health check and API status |
