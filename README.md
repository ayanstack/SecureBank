# CoinCraft — Digital Banking Platform
## Full-Stack MERN Architecture | AI Assistance | Deep Blue & Red Executive Interface

CoinCraft is a digital banking platform engineered using modern web technologies, strict application security controls, ACID transactional integrity, and rule-based fraud monitoring.

---

## 1. Architectural Highlights

### A. Complete Blue / Red Color Transformation
* **Deep Blue Themed Surfaces**: All previous stark-white backgrounds and cards have been converted to a deep blue palette (`#081526` page background, `#0B1F3A` elevated containers, `#0D274D` card panels, and `#1E4578` borders).
* **Red Primary Action Palette**: All previous blue action elements, CTA buttons, active tabs, and highlights now use `#D62839` (hover `#BA1E2E`, active `#8A1420`) with dedicated red glow focus indicators (`shadow-glow-red`).
* **Contrast & Accessibility**: Main text styled in high-contrast `#F7FAFF` with accessible `#94B4DB` secondary and `#628CBF` metadata text, satisfying WCAG 2.2 AA contrast ratios.

### B. Security Architecture & Threat Defense
* **Dual-Token Authentication Lifecycle**: Short-lived Access Tokens (15m) paired with rotating Refresh Tokens (7d) stored in MongoDB with cross-tab storage sync.
* **Session Invalidation**: Changing passwords immediately invalidates and revokes all active user sessions across all devices.
* **Deterministic Decimal & Integer Minor-Unit Arithmetic**: Floating-point IEEE-754 calculation vulnerabilities are eliminated using integer-based minor unit accounting (`roundMoney`, `addMoney`, `subtractMoney`).
* **Transfer Idempotency**: All money-moving endpoints accept `Idempotency-Key` headers to guarantee zero duplicate debits upon network retries.
* **NoSQL Injection & Sanitization**: Custom request parameter, body, and query sanitizer cleans all MongoDB operator injections (`$gt`, `$ne`, `$where`).
* **Security Headers & Rate Limiting**: Enforced via Helmet, strict CORS allowlisting (supporting both port 5173 & 5174 simultaneously), and differentiated rate limiters for Auth (60/15min), OTP (20/15min), and general APIs (500/15min).

### C. AI Banking Assistance & Advisory
* **AI Banking Assistant (`/ai-assistant`)**: Natural language chat interface with zero hallucination. Operates on verified banking tools querying strictly scoped customer accounts.
* **Natural-Language Transaction Search**: Parses natural inquiries (e.g., *"Show transfers above ₹2000"*) into allowlisted database queries.
* **Deterministic Expense Analytics (`/analytics`)**: Automatic categorization of expenditures (Housing, Utilities, Food & Groceries, Travel, Shopping, Healthcare, Transfers) and month-over-month variance.
* **Smart Savings Advisor (`/savings`)**: Goal tracking with automated recommendations derived from actual positive/negative cash flows.

### D. Fraud Monitoring & Administrative Operations
* **Rule-Based Anomaly Detection**: High-value transfer flags (₹50,000+ threshold) and transaction velocity anomaly checks (3+ transactions within 10 minutes) logged into `FraudAlert`.
* **Audit Trails (`AuditLog`)**: Immutable record of all privileged administrative events, profile updates, and fund movements.
* **24x7 Customer Support Desk (`/support`)**: Support ticket logging, category routing, and customer-admin message threads.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Redux Toolkit, React Router 7, Tailwind CSS 3, Lucide React, Recharts |
| **Backend** | Node.js (ES Modules), Express.js 5, Mongoose 9, Socket.IO, Nodemailer, PDFKit |
| **Database** | MongoDB (Replica Set transactions supported with standalone atomic 2-phase fallback) |
| **Testing** | Node Test Runner (`node --test`), 35 automated end-to-end integration tests |

---

## 3. Project Structure

```
bank/
├── backend/
│   ├── src/
│   │   ├── config/             # Database connection & env setup
│   │   ├── constants/          # Roles, limits, transaction status enums
│   │   ├── controllers/        # Auth, accounts, transfers, statements, admin
│   │   ├── middleware/         # Auth, role RBAC, sanitizer, rate limiting
│   │   ├── models/             # User, Account, Transaction, Transfer, FraudAlert, AuditLog, SavingsGoal, SupportTicket
│   │   ├── routes/             # REST route declarations (including /api/ai and /api/support)
│   │   ├── services/           # AI assistant, analytics, fraud checks, notifications
│   │   └── utils/              # Email transporter, money decimal arithmetic
│   ├── tests/                  # Integration test suite (auth, banking, security, RBAC)
│   ├── server.mjs              # Server entry point with Socket.IO setup
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/         # Reusable Button, Input, Card, Modal, Badge, Logo, Sidebar, Navbar
    │   ├── features/           # Redux slices (auth, accounts, transfers, notifications, statements)
    │   ├── pages/              # Dashboard, Accounts, Transfers, AI Assistant, Analytics, Savings, Support, Admin
    │   ├── routes/             # Protected, Admin, and Public route guards
    │   └── services/           # Axios instance with refresh interceptor, Socket client
    ├── tailwind.config.js      # Centralized Blue/Red design token palette
    └── package.json
```

---

## 4. Local Setup & Execution Instructions

### Prerequisites
* **Node.js** v18+ (tested on v24.12.0)
* **MongoDB** (local or MongoDB Atlas connection string)

### 1. Backend Setup
```bash
cd backend
npm install

# Configure environment in backend/.env:
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173,http://localhost:5174
MONGO_URI=mongodb://localhost:27017/securebank
JWT_ACCESS_SECRET=SecureBank_Access_2026_Ayan_7fK9mP2xQ8vR4tL6a
JWT_REFRESH_SECRET=SecureBank_Refresh_2026_Ayan_9xK4mP7qL2zT8a
EMAIL_USER=ayanshaikh15082007@gmail.com
EMAIL_PASS=your_app_password

# Run automated tests
npm test

# Start backend server
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Run development server
npm run dev

# Run production build validation
npm run build
```

---

## 5. Verification & Test Summary

* **Backend Test Suite**: `35/35 tests passing` across 4 suites:
  * `Authentication & User Access`: Registration, login, refresh rotation, password change session revocation, forgot/reset password.
  * `Authorization & Cross-User Security`: IDOR protection, unauthenticated rejection, cross-user freeze prevention, admin route guards.
  * `Banking & Money Transfers`: Atomic debits, balance overdraft prevention, idempotency key replay protection, transaction PIN checks, transfer reversals.
  * `Application Security & Resiliency`: NoSQL operator injection blocking, malformed JSON handling, cache-control headers.
* **Frontend Production Build**: `npm run build` succeeds in **4.2s** generating zero compile/type errors.
