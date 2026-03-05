# Sahaay V3 — API Reference (tRPC)

**Date:** March 2026  
**Protocol:** tRPC over Firebase Cloud Functions  
**Validation:** Zod strict schema enforcement

---

## Overview

Sahaay uses **tRPC** as its sole API layer. There are no REST endpoints. All client-server communication is type-safe and validated at compile time.

The tRPC router is exported as a Firebase Cloud Function at `firebase/functions/src/router/index.ts`.

---

## Authentication

All tRPC procedures require Firebase Authentication. The `context` object carries the authenticated `uid` and is verified via Firebase AppCheck middleware.

---

## Procedures

### `booking.create`

Creates a new item booking with XState-driven escrow.

**Input Schema (`BookingRequestSchema`):**

```typescript
{
  itemId: string;           // Firestore document ID of the item
  startDate: string;        // ISO 8601 date string
  endDate: string;          // ISO 8601 date string
  idempotencyKey?: string;  // Client-generated key to prevent duplicate charges
}
```

**Output:**

```typescript
{
  bookingId: string;
  paymentId: string;
  status: "awaiting_payment";   // XState-guaranteed initial state
  totalAmount: number;          // baseAmount + deposit + platformFee (10%)
}
```

**Business Rules:**

- Item must exist and have `status: 'active'`
- Borrower cannot book their own item
- End date must be after start date
- Idempotency key prevents duplicate transactions on network retries

---

### `items.search` (via Typesense)

Item search is handled client-side via the Typesense JS client (`useTypesenseSearch.ts`), not through tRPC. Typesense provides sub-10ms typo-tolerant search with geospatial filtering.

**Client-Side Usage:**

```typescript
const { data, isLoading } = useTypesenseSearch({
  query: "power drill",
  filterBy: "category:Tools && location:(48.85, 2.35, 5 km)"
});
```

---

### `genius.chat`

AI-powered assistant using Gemini integration.

**Input:**

```typescript
{
  message: string;        // User's message to the AI assistant
  conversationId?: string; // Optional conversation thread ID
}
```

**Output:**

```typescript
{
  response: string;       // AI-generated response
  conversationId: string; // Thread identifier for follow-ups
}
```

---

## Firestore Triggers (Automatic)

These Cloud Functions trigger automatically on Firestore document events:

| Trigger | Event | Action |
|---------|-------|--------|
| `onItemWrite` | `items/{itemId}` written | Syncs item data to Typesense search index |
| `onItemCreated` | `items/{itemId}` created | Runs AI content moderation; flags unsafe listings |
| `onUserCreate` | User account created | Creates user profile document with default reputation |

---

## Error Handling

All tRPC procedures throw typed errors:

| Code | Meaning |
|------|---------|
| `UNAUTHENTICATED` | No valid Firebase Auth token |
| `FAILED_PRECONDITION` | AppCheck verification failed |
| `INVALID_ARGUMENT` | Zod schema validation failed |
| `INTERNAL` | Unexpected server error |
| `NOT_FOUND` | Referenced document does not exist |

---

## Rate Limiting

Firebase Cloud Functions enforce default rate limits. Custom Token Bucket rate limiting should be implemented at the tRPC middleware layer for production deployment.
