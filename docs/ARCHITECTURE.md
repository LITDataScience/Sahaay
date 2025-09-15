<!-- SPDX-Header-Start -->
SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
© 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
<!-- SPDX-Header-End -->

# Sahaay Architecture

## System Overview

Sahaay is a hyperlocal peer-to-peer borrowing platform designed specifically for the Indian market. The architecture follows microservices principles with a mobile-first approach and AI-powered features.

## Architecture Principles

### 1. Mobile-First Design
- React Native with Expo for cross-platform development
- Offline-first capabilities for item browsing
- Progressive Web App (PWA) support for web users

### 2. API-First Approach
- RESTful API design with OpenAPI specification
- Versioned endpoints (v1, v2, etc.)
- Comprehensive API documentation

### 3. Security by Design
- JWT-based authentication
- Role-based access control (RBAC)
- Data encryption at rest and in transit
- Privacy-focused data handling

### 4. Scalable Infrastructure
- Containerized deployment with Docker
- Kubernetes orchestration for production
- Horizontal scaling capabilities
- CDN integration for static assets

## System Components

### Frontend Layer

#### React Native Application
```
frontend/
├── src/
│   ├── screens/          # Screen components
│   ├── components/       # Reusable UI components
│   ├── services/         # API service layer
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript type definitions
│   └── navigation/      # Navigation configuration
```

**Key Features:**
- Expo SDK integration
- React Navigation for routing
- Redux Toolkit for state management
- AsyncStorage for local data persistence
- Image picker and camera integration
- Location services integration

#### Component Architecture
- Atomic design principles
- Styled components with theme support
- Accessibility-first components
- Performance optimized with memoization

### Backend Layer

#### Node.js API Server
```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── models/         # Data models (Prisma)
│   ├── routes/         # API route definitions
│   ├── middleware/     # Express middleware
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript definitions
```

**Technology Stack:**
- Express.js framework
- TypeScript for type safety
- Prisma ORM for database operations
- JWT for authentication
- Redis for caching and sessions
- Rate limiting and security middleware

#### Database Layer

##### PostgreSQL Schema
```sql
-- Core entities
users (id, phone, name, society_id, reputation_score)
societies (id, name, city, lat, lng)
categories (id, name)
items (id, owner_id, title, category_id, pricing, location)
bookings (id, item_id, borrower_id, start_time, status)
payments (id, booking_id, amount, status, provider)
ratings (id, booking_id, rater_id, rating, comment)
```

**Database Design Principles:**
- UUID primary keys for security
- JSONB fields for flexible data storage
- Proper indexing for performance
- Foreign key constraints for data integrity
- Soft deletes for audit trails

### AI/ML Layer

#### MCP Orchestrator
```
agents/
├── mcp_orchestrator.md    # Master coordinator
├── owner_agent.md         # Product management
├── frontend_agent.md      # Mobile development
├── backend_agent.md       # API development
├── trust_agent.md         # Payments & security
├── ml_agent.md           # AI/ML features
└── qa_agent.md           # Testing & QA
```

#### RAG Pipeline
```
rag/
├── ingestion/            # Data ingestion pipeline
├── vectorstore/          # Vector database operations
├── retrieval/            # Document retrieval logic
└── generation/           # LLM integration
```

**AI Components:**
- HuggingFace Transformers for NLP
- LangChain for RAG workflows
- ChromaDB for vector storage
- Sentence Transformers for embeddings
- Fine-tuned models for domain adaptation

### Infrastructure Layer

#### Docker Containers
```dockerfile
# Backend container
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]

# Frontend container
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 19006
CMD ["npm", "start"]
```

#### Kubernetes Manifests
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: Sahaay-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: Sahaay-backend
  template:
    metadata:
      labels:
        app: Sahaay-backend
    spec:
      containers:
      - name: backend
        image: Sahaay/backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: database-url
```

## Data Flow

### User Registration Flow
1. User enters phone number
2. Backend generates OTP
3. SMS sent via Twilio/MSG91
4. User verifies OTP
5. JWT token generated
6. User profile created

### Item Discovery Flow
1. User opens app with location permission
2. Frontend requests nearby items
3. Backend queries PostgreSQL with geospatial search
4. Items filtered by availability and reputation
5. Results cached in Redis
6. Frontend displays items with distance calculation

### Booking Flow
1. User selects item and dates
2. Frontend validates availability
3. Backend creates booking record
4. Payment URL generated (UPI simulator)
5. User completes payment
6. Booking status updated
7. Notifications sent to both parties

## Security Architecture

### Authentication & Authorization
- JWT tokens with refresh mechanism
- Role-based permissions (user, admin, moderator)
- API key authentication for third-party integrations
- Session management with Redis

### Data Protection
- PII encryption using AES-256
- TLS 1.3 for all communications
- CSP headers for XSS protection
- Rate limiting to prevent abuse
- Input validation and sanitization

### Payment Security
- UPI payment simulation for MVP
- Escrow system for deposits
- PCI DSS compliance preparation
- Fraud detection algorithms
- Transaction logging and audit trails

## Performance Optimization

### Frontend Optimizations
- Code splitting with React.lazy
- Image optimization and lazy loading
- Virtualized lists for large datasets
- Memoization of expensive calculations
- Offline data synchronization

### Backend Optimizations
- Database query optimization
- Redis caching layer
- Connection pooling
- Horizontal scaling with load balancer
- CDN for static assets

### Database Optimizations
- Proper indexing strategy
- Query result caching
- Database connection pooling
- Read replicas for high availability
- Backup and recovery procedures

## Monitoring & Observability

### Application Monitoring
- Structured logging with Winston
- Error tracking with Sentry
- Performance monitoring with New Relic
- Custom business metrics

### Infrastructure Monitoring
- Kubernetes metrics collection
- Container resource monitoring
- Database performance monitoring
- Network and security monitoring

### Business Intelligence
- User behavior analytics
- Conversion funnel tracking
- A/B testing framework
- Revenue and growth metrics

## Deployment Strategy

### Development Environment
- Local development with hot reload
- Docker Compose for local services
- Automated testing with GitHub Actions
- Preview deployments for feature branches

### Staging Environment
- Full infrastructure replication
- Automated deployment from main branch
- Integration testing suite
- Performance testing and load testing

### Production Environment
- Blue-green deployment strategy
- Rolling updates with zero downtime
- Multi-region deployment for high availability
- Automated rollback capabilities
- Disaster recovery procedures

## Scaling Strategy

### Horizontal Scaling
- Stateless application design
- Load balancer configuration
- Database read replicas
- Redis cluster for caching
- CDN for static content delivery

### Vertical Scaling
- Resource monitoring and alerts
- Auto-scaling based on metrics
- Database optimization and indexing
- Query performance monitoring
- Memory and CPU optimization

### Geographic Scaling
- Multi-region database replication
- Content delivery network
- Regional API endpoints
- Data localization compliance
- Cross-region failover

## Disaster Recovery

### Backup Strategy
- Automated database backups
- File system snapshots
- Configuration backups
- Cross-region backup replication

### Recovery Procedures
- Point-in-time recovery
- Automated failover systems
- Data consistency verification
- Business continuity planning

### Business Continuity
- Service level agreements (SLAs)
- Incident response procedures
- Communication protocols
- Stakeholder management

## Future Considerations

### Technology Evolution
- GraphQL API migration
- Microservices decomposition
- Event-driven architecture
- Serverless function integration

### Feature Roadmap
- Real-time chat integration
- Advanced AI recommendations
- Blockchain-based trust system
- IoT device integration
- Multi-language support

### Market Expansion
- International localization
- Regulatory compliance expansion
- Partnership integrations
- Enterprise features for large communities

This architecture provides a solid foundation for Sahaay's growth while maintaining flexibility for future enhancements and scaling requirements.


