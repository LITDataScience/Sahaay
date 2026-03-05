<!-- SPDX-Header-Start -->
SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
© 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
<!-- SPDX-Header-End -->

# प्रबिसि नगर कीजे सब काजा। हृदयँ राखि कोसलपुर राजा।।

## Hyperlocal P2P Borrowing Platform

Sahaay is a mobile-first platform that connects people in the same neighborhood or society for borrowing and lending items. Built specifically for the Indian market with UPI payments, micro-insurance, and community-focused features.

### Key Features

- **Mobile-First Design**: React Native app with Expo
- **Society-Focused**: Hyperlocal discovery within residential communities
- **Secure Payments**: UPI integration with deposit escrow system
- **Item Categories**: Electronics, tools, appliances, and more
- **Reputation System**: Rating and review system for trust
- **Logistics**: Scheduled pickup and drop-off services
- **Micro-Insurance**: Optional insurance coverage for borrowed items
- **AI-Powered**: LLM + RAG for smart recommendations and fraud detection

## Architecture

### Tech Stack

**Frontend:**

- React Native with Expo
- Expo Router (File-based universal routing)
- tRPC Client (End-to-end type safety)
- WatermelonDB (Offline-first local database with CRDT sync)
- Zustand (Local state management)
- Nativewind/Vanilla CSS (Styling)

**Backend:**

- Firebase Cloud Functions (Node.js/TypeScript)
- tRPC Server (Strict API contracts)
- Firebase Firestore (Primary Database)
- Typesense (Sub-10ms Typo-tolerant Vector Search)
- XState V5 (Deterministic Escrow State Machines)

**Infrastructure & DevOps:**

- pnpm Workspaces (Monorepo management)
- Docker Compose (Local Emulators, Typesense, Redis)
- GitHub Actions (CI/CD Pipeline)
- Expo Application Services (EAS Build/Submit)

### Project Structure (Monorepo)

```
Sahaay/
├── frontend/                  # React Native Application
│   ├── app/                   # Expo Router entrypoints & deep links
│   ├── src/
│   │   ├── app/               # Root layouts & global providers
│   │   ├── features/          # Composite business logic
│   │   ├── entities/          # Isolated domain models (User, Listing, Booking)
│   │   └── shared/            # Infrastructure (DB, tRPC API, UI components)
│   ├── eas.json               # EAS Cloud Build configuration
│   └── package.json           
├── firebase/                  # Backend infrastructure
│   ├── functions/             # Cloud Functions source code
│   │   └── src/
│   │       ├── router/        # tRPC router definitions
│   │       ├── services/      # Core business logic (BookingService, TypesenseSync)
│   │       ├── schemas/       # Zod DTO validation schemas
│   │       └── agents/        # AI orchestration logic
│   ├── firestore.rules        # Database security rules
│   └── firebase.json          # Firebase emulator configuration
├── docs/                      # Project Documentation
├── docker-compose.yml         # Local development environment definitions
└── pnpm-workspace.yaml        # Monorepo configuration
```

## Quick Start

### Prerequisites

- [Node.js 20+](https://nodejs.org/) (Use `nvm` or newer)
- [pnpm 10+](https://pnpm.io/installation) (`npm install -g pnpm`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (For local emulators and Typesense)
- [EAS CLI](https://docs.expo.dev/build/setup/) (`npm install -g eas-cli`)

### 1. Zero-Config Monorepo Installation

We use `pnpm workspaces` to manage dependencies across the frontend and backend simultaneously.

```bash
# Clone the repository
git clone https://github.com/LITDataScience/Sahaay.git
cd Sahaay

# Install all dependencies globally across workspaces
pnpm install
```

### 2. Booting the Local Cloud Infrastructure (Docker)

Before starting the app or backend, you must spin up the local emulator suite. This isolates you from production data and boots up local instances of Firestore, Firebase Auth, and the Typesense Search Cluster.

```bash
# Ensure Docker Desktop is running, then boot the cluster in the background
docker-compose up -d

# Verify containers are running safely (Typesense + Firebase Emulator)
docker ps
```

### 3. Starting the Backend (Firebase Cloud Functions)

The backend must be running locally to intercept tRPC requests and sync database changes to Typesense.

```bash
# Navigate to the functions workspace
cd firebase/functions

# Run the TypeScript compiler in watch mode alongside the Firebase Emulator
pnpm run serve
```

*Your backend is now running at `http://127.0.0.1:5001`. The emulator UI is available at `http://localhost:4000`.*

### 4. Starting the Frontend (Expo / React Native)

Open a **new terminal window** at the repository root.

```bash
cd frontend

# Start the Expo Metro Bundler and clear cache
npx expo start -c
```

Press `a` to open on a connected Android device/emulator, or scan the QR code using the Expo Go app. To view the web version, press `w`.

## Mobile App Features

### Core Screens

- **Home Feed**: Browse nearby available items
- **Item Discovery**: Search and filter by category/location
- **Item Details**: Photos, pricing, owner info, reviews
- **Create Listing**: Add new items for lending
- **Booking Flow**: Reserve items with calendar integration
- **Profile**: Manage listings, bookings, and reputation
- **Chat**: Communicate with borrowers/lenders

### Key User Flows

1. **Borrowing Flow**: Discover → View Details → Book → Pay Deposit → Pickup → Return → Rate
2. **Lending Flow**: Create Listing → Receive Booking → Confirm → Handover → Receive Back → Rate
3. **Onboarding**: Phone OTP → Profile Setup → Society Selection → First Listing

## API Endpoints

### Authentication

- `POST /auth/signup` - Phone number registration
- `POST /auth/verify` - OTP verification
- `POST /auth/refresh` - Token refresh

### Items

- `GET /items` - List available items (with filters)
- `POST /items` - Create new listing
- `GET /items/:id` - Get item details
- `PATCH /items/:id` - Update listing
- `DELETE /items/:id` - Remove listing

### Bookings

- `POST /bookings` - Create booking request
- `GET /bookings` - List user bookings
- `GET /bookings/:id` - Get booking details
- `PATCH /bookings/:id` - Update booking status

### Payments

- `POST /payments/simulate` - Simulate UPI payment
- `GET /payments/:bookingId` - Get payment status

## AI Integration

### MCP Orchestrator

The Master Control Program coordinates specialized agents:

- **Owner Agent**: Product backlog and sprint planning
- **Frontend Agent**: React Native development
- **Backend Agent**: API development and testing
- **Trust Agent**: Payments and escrow management
- **ML Agent**: Recommendations and fraud detection
- **QA Agent**: Testing and quality assurance
- **Infra Agent**: DevOps and deployment

### RAG Pipeline

- **VectorDB**: Semantic search for item recommendations
- **LLM Integration**: HuggingFace models for chat and analysis
- **Fine-tuning**: Domain-specific model adaptation
- **Automation**: n8n workflows for process orchestration

## Database Schema

### Core Tables

- **users**: User profiles and reputation scores
- **societies**: Residential communities
- **categories**: Item categorization
- **items**: Available items for borrowing
- **bookings**: Rental transactions
- **payments**: Payment records and escrow
- **ratings**: User reviews and ratings

### Automated Verification

- **GitHub Actions**: Strict `tRPC` type-checking and `ESLint` compilation gates block invalid PRs.
- **EAS Build Gate**: Automated cloud pipeline executing Expo `preview` builds to guarantee native Android compilation.

### Local Testing

- End-to-End Type Safety guarantees via `tRPC`. If the backend schema changes, the frontend will throw compiler errors locally.
- Use `Firebase Emulator UI` (`localhost:4000`) to manipulate raw database tables and view local test data.

## Deployment

### Cloud Delivery (Vercel & Expo)

1. The React Native mobile applications are distributed via **Expo Application Services (EAS)**.
2. The Backend infrastructure is hosted serverlessly on **Google Cloud Platform (Firebase)**.
3. The Typesense cluster is self-hosted or deployed via **Typesense Cloud**.

**To build a new Android APK:**

```bash
cd frontend
eas build --platform android --profile preview
```

## KPIs & Metrics

### User Metrics

- Weekly Active Users (WAU)
- Booking conversion rate
- Average booking value
- Repeat borrower rate
- User retention (30-day)

### Business Metrics

- Gross merchandise value (GMV)
- Take rate (revenue/GMV)
- Customer acquisition cost (CAC)
- Lifetime value (LTV)

## Security & Compliance

### Data Protection

- Phone number and location privacy
- Encrypted payment data
- Secure OTP generation
- GDPR-compliant data handling

### Trust & Safety

- Identity verification (optional)
- Deposit escrow system
- Dispute resolution process
- Fraud detection algorithms

## Roadmap

### Phase 1 (MVP)

- Core borrowing/lending functionality
- Society-based discovery
- Payment simulator
- Basic reputation system

### Phase 2

- Real UPI integration
- Logistics partner integration
- Micro-insurance API
- Advanced AI recommendations

### Phase 3

- Multi-city expansion
- B2B partnerships
- Advanced analytics
- Mobile app store launch

## Contributing

This project uses the MCP (Master Control Program) orchestration system. All development work is coordinated through specialized agents. See `/agents` directory for agent responsibilities and contribution guidelines.

## License

This repository is provided under a proprietary evaluation license. See [LICENSE](../LICENSE) for terms. No commercial or production use is permitted without a separate written agreement with Sahaay Technologies Pvt. Ltd.

## Legal

See [LEGAL.md](./LEGAL.md) for links to Terms of Use, Privacy Policy, Security Policy, Code of Conduct, Contributing and CLA, Trademark policy, and notices.

## Contact

For questions or support, please reach out to the development team or create an issue in this repository.

---

**MADE IN BHARAT  WITH  for the people**
