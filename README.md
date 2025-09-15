<!-- SPDX-Header-Start -->
SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
© 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
<!-- SPDX-Header-End -->

# प्रबिसि नगर कीजे सब काजा। हृदयँ राखि कोसलपुर राजा।।

##  Hyperlocal P2P Borrowing Platform

Sahaay is a mobile-first platform that connects people in the same neighborhood or society for borrowing and lending items. Built specifically for the Indian market with UPI payments, micro-insurance, and community-focused features.

###  Key Features

- ** Mobile-First Design**: React Native app with Expo
- ** Society-Focused**: Hyperlocal discovery within residential communities
- ** Secure Payments**: UPI integration with deposit escrow system
- ** Item Categories**: Electronics, tools, appliances, and more
- ** Reputation System**: Rating and review system for trust
- ** Logistics**: Scheduled pickup and drop-off services
- ** Micro-Insurance**: Optional insurance coverage for borrowed items
- ** AI-Powered**: LLM + RAG for smart recommendations and fraud detection

##  Architecture

### Tech Stack

**Frontend:**
- React Native with TypeScript
- Expo for development and deployment
- React Navigation for routing
- Axios for API communication

**Backend:**
- Node.js with Express
- TypeScript for type safety
- Prisma ORM with PostgreSQL
- JWT authentication
- Payment simulator for UPI flows

**AI/ML:**
- HuggingFace Transformers
- LangChain for RAG pipelines
- VectorDB for semantic search
- Unsloth for fine-tuning
- CrewAI for agent orchestration

**Infrastructure:**
- Docker containers
- GitHub Actions CI/CD
- PostgreSQL database
- Redis for caching

### Project Structure

```
Sahaay/
├── agents/                    # MCP Agent files
│   ├── owner_agent.md
│   ├── frontend_agent.md
│   ├── backend_agent.md
│   ├── trust_agent.md
│   ├── logistics_agent.md
│   ├── ml_agent.md
│   ├── qa_agent.md
│   ├── infra_agent.md
│   ├── growth_agent.md
│   ├── legal_agent.md
│   ├── design_agent.md
│   └── mcp_orchestrator.md
├── backend/                   # Node.js API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   └── types/
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── frontend/                  # React Native app
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   ├── utils/
│   │   └── types/
│   └── package.json
├── rag/                       # RAG pipeline
├── finetune/                  # Model fine-tuning
├── automation/                # n8n workflows
├── tests/                     # Test suites
├── docs/                      # Documentation
└── requirements.txt           # Python dependencies
```

##  Quick Start

### Prerequisites

- Node.js 18+
- Python 3.12+ (for AI components)
- PostgreSQL
- Expo CLI (for mobile development)

### Backend Setup

```bash
cd backend
npm install
# Copy .env.example to .env and configure
cp .env.example .env
# Set up database
npx prisma generate
npx prisma migrate dev
# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
# Start Expo development server
npm start
# Or run on specific platform
npm run android  # Android
npm run ios      # iOS
npm run web      # Web
```

### Python Environment (AI Components)

```bash
# Activate virtual environment
E:\pythonProject\venv312\Scripts\activate
# Install dependencies
pip install -r requirements.txt
```

##  Mobile App Features

### Core Screens
- ** Home Feed**: Browse nearby available items
- ** Item Discovery**: Search and filter by category/location
- ** Item Details**: Photos, pricing, owner info, reviews
- ** Create Listing**: Add new items for lending
- ** Booking Flow**: Reserve items with calendar integration
- ** Profile**: Manage listings, bookings, and reputation
- ** Chat**: Communicate with borrowers/lenders

### Key User Flows
1. **Borrowing Flow**: Discover → View Details → Book → Pay Deposit → Pickup → Return → Rate
2. **Lending Flow**: Create Listing → Receive Booking → Confirm → Handover → Receive Back → Rate
3. **Onboarding**: Phone OTP → Profile Setup → Society Selection → First Listing

##  API Endpoints

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

##  AI Integration

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

##  Database Schema

### Core Tables
- **users**: User profiles and reputation scores
- **societies**: Residential communities
- **categories**: Item categorization
- **items**: Available items for borrowing
- **bookings**: Rental transactions
- **payments**: Payment records and escrow
- **ratings**: User reviews and ratings

## 🧪 Testing Strategy

### Backend Tests
- Unit tests for controllers and services
- Integration tests for API endpoints
- Database tests with test containers

### Frontend Tests
- Component unit tests
- Navigation flow tests
- E2E tests with Detox

### AI Tests
- Model accuracy validation
- RAG pipeline performance tests
- Agent orchestration tests

##  Deployment

### Development
```bash
# Backend
npm run dev
# Frontend
npm start
# Database
docker run -p 5432:5432 postgres:15
```

### Remove all `node_modules` to reclaim space; they’ll be reinstalled on demand
```
Get-ChildItem -Directory -Filter node_modules -Recurse -Force | Remove-Item -Recurse -Force
```

### Find largest `top-level` folders
```
Get-ChildItem -Directory | ForEach-Object {
  $size = (Get-ChildItem -Recurse -Force -File -ErrorAction SilentlyContinue $_.FullName | Measure-Object Length -Sum).Sum
  [pscustomobject]@{ Name = $_.Name; SizeGB = [math]::Round($size/1GB,2) }
} | Sort-Object SizeGB -Descending
```

### Production
- Docker containers for all services
- Kubernetes manifests for orchestration
- GitHub Actions for CI/CD
- PostgreSQL with connection pooling
- Redis for caching and sessions

##  KPIs & Metrics

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

##  Security & Compliance

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

##  Roadmap

### Phase 1 (MVP)
-  Core borrowing/lending functionality
-  Society-based discovery
-  Payment simulator
-  Basic reputation system

### Phase 2
-  Real UPI integration
-  Logistics partner integration
-  Micro-insurance API
-  Advanced AI recommendations

### Phase 3
-  Multi-city expansion
-  B2B partnerships
-  Advanced analytics
-  Mobile app store launch

##  Contributing

This project uses the MCP (Master Control Program) orchestration system. All development work is coordinated through specialized agents. See `/agents` directory for agent responsibilities and contribution guidelines.

##  License

This repository is provided under a proprietary evaluation license. See `LICENSE` for terms. No commercial or production use is permitted without a separate written agreement with Sahaay Technologies Pvt. Ltd.

##  Legal

See `LEGAL.md` for links to Terms of Use, Privacy Policy, Security Policy, Code of Conduct, Contributing and CLA, Trademark policy, and notices.

##  Contact

For questions or support, please reach out to the development team or create an issue in this repository.

---

**MADE IN BHARAT  WITH  for the people**



