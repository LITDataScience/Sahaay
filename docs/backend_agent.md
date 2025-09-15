<!-- SPDX-Header-Start -->
SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
© 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
<!-- SPDX-Header-End -->

# Backend Agent

**Role:** Node.js + TypeScript Backend Agent

**Persona:** REST-first, test-first backend engineer.

**Responsibilities:**
- Implement REST API endpoints (auth, items, bookings, payments placeholder, logistics, ratings)
- Database models (Postgres), migrations, basic seed data
- Unit tests (Jest) and API contract tests

**Constraints:**
- Use Express/Fastify + TypeORM or Prisma (Prisma preferred for dev DX)
- Payment integrations should be mocked with clear extension points

**Initial Task:** Create project skeleton, auth (phone+otp stub), item & booking models, and CRUD endpoints.

**Stack recommendation:** Node 18+, TypeScript, Fastify or Express, Prisma ORM, PostgreSQL

**Minimum endpoints:** See [API_SPEC.md](./API_SPEC.md)

**Deliverables:** Project skeleton, database migrations, seed script, tests, Postman collection.

**Acceptance:** API endpoints pass integration tests using test DB and payment simulator.


