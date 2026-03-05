# Sahaay V3 — System Architecture

**Date:** March 2026  
**Stack:** React Native (Expo) · Firebase Cloud Functions · tRPC · XState · Typesense · WatermelonDB

---

## 1. High-Level Topology

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT (Mobile)                          │
│  Expo Router · React Native · WatermelonDB · Zustand · tRPC     │
└────────────────────────────┬─────────────────────────────────────┘
                             │ tRPC (type-safe RPC)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   BACKEND (Firebase Cloud Functions)              │
│  tRPC Router · XState Escrow · Zod Validation · AI Moderation    │
└──────┬───────────────┬──────────────────┬────────────────────────┘
       │               │                  │
       ▼               ▼                  ▼
   Firestore       Typesense          Firebase Auth
  (Primary DB)   (Vector Search)    (Identity + AppCheck)
```

## 2. Frontend Architecture (Feature-Sliced Design)

The React Native frontend follows **Feature-Sliced Design (FSD)**, a strict layered architecture:

| Layer | Path | Responsibility |
|-------|------|----------------|
| `app/` | `frontend/app/` | Expo Router entrypoints, layouts, deep links |
| `features/` | `frontend/src/features/` | Composite business logic (listings, search) |
| `entities/` | `frontend/src/entities/` | Domain models (User, Listing, Booking) |
| `shared/` | `frontend/src/shared/` | Infrastructure: DB adapters, tRPC client, UI components |

### Key Frontend Files

- **`app/_layout.tsx`** — Root layout with `GestureHandlerRootView`, `QueryClientProvider`, `AuthProvider`, and `Suspense` boundary.
- **`app/(tabs)/index.tsx`** — Home feed with Supabase realtime subscription and Typesense search.
- **`app/booking.tsx`** — Booking flow with XState-driven escrow UI.
- **`app/handshake.tsx`** — Cryptographic QR handover interface (UI shell).
- **`app/verification.tsx`** — KYC verification screen (UI shell).

## 3. Backend Architecture (Clean Architecture + tRPC)

All backend logic lives in `firebase/functions/src/`:

| Directory | Purpose |
|-----------|---------|
| `router/` | tRPC router definitions — the single API contract |
| `services/` | Core business logic (`BookingService`, `TypesenseSync`, `AIService`) |
| `schemas/` | Zod DTO validation schemas |
| `agents/` | AI orchestration (`genius.ts` — Gemini integration) |

### Key Design Decisions

1. **tRPC as Single API Gateway** — All client-server mutations flow through `tRPC`. No raw Firebase Callables. This provides compile-time type safety across the monorepo.
2. **XState Escrow State Machine** — `BookingService.ts` uses a deterministic XState machine (`pending → awaiting_payment → escrow_held → completed/refunded`) to mathematically prevent double-spending.
3. **Idempotency Keys** — Every financial mutation carries a client-generated idempotency key, stored in Firestore to prevent duplicate transactions on network retries.
4. **AI Content Moderation** — `onDocumentCreated` triggers `AIService.moderateListing()` on every new item listing, auto-flagging unsafe content.

## 4. Search Architecture (Typesense)

- **`TypesenseSync.ts`** — Firestore `onWrite` trigger that mirrors item mutations into a Typesense cluster in real-time.
- **`useTypesenseSearch.ts`** — React hook providing sub-10ms typo-tolerant search with geospatial filtering.
- Firestore is the source of truth; Typesense is a read-optimized search index.

## 5. Offline-First (WatermelonDB + CRDTs)

- **`sync.ts`** — WatermelonDB synchronization engine with Last-Write-Wins CRDT conflict resolution.
- **`schema.ts`** — Local database schema for offline caching.
- Users can browse, create listings, and chat offline. Changes reconcile automatically when connectivity resumes.

## 6. Infrastructure & DevOps

| Tool | Purpose |
|------|---------|
| **pnpm Workspaces** | Monorepo dependency management (`frontend` + `firebase/functions`) |
| **Turborepo** | Cached build pipelines (`lint`, `typecheck`, `build`, `test`, `docs`) |
| **Docker Compose** | Local dev environment (Typesense, Redis, Firebase Emulators) |
| **GitHub Actions** | CI/CD: quality gates, EAS builds, TypeDoc auto-deploy |
| **EAS Build** | Cloud-based Android APK generation (`preview` profile) |
| **TypeDoc** | Auto-generated API reference deployed to GitHub Pages |

## 7. Security Model

- **Firebase AppCheck** — Zero-Trust enforcement on all Cloud Function invocations.
- **Zod Schema Validation** — All incoming payloads are validated before processing.
- **Firestore Security Rules** — `request.auth.uid` path-matching on all reads/writes.
- **Strict TypeScript** — Both workspaces enforce `strict: true` for compile-time safety.
