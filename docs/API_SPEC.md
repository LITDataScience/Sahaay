<!-- SPDX-Header-Start -->
SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
© 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
<!-- SPDX-Header-End -->

# Sahaay API Specification

## Overview

Sahaay uses RESTful API design with JSON responses. All endpoints require authentication except for signup/verification.

## Authentication

All authenticated requests must include the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## Base URL
```
https://api.Sahaay.com/v1
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": { ... }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Endpoints

### Authentication

#### POST /auth/signup
Register a new user with phone number.

**Request:**
```json
{
  "phone": "9876543210",
  "name": "John Doe",
  "societyId": "optional-society-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tempUserId": "uuid",
    "otpSent": true
  }
}
```

#### POST /auth/verify
Verify OTP and complete registration.

**Request:**
```json
{
  "tempUserId": "uuid",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "phone": "9876543210",
      "name": "John Doe",
      "verified": true
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Users

#### GET /users/me
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "phone": "9876543210",
    "name": "John Doe",
    "societyId": "society-uuid",
    "reputationScore": 4.8,
    "verified": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PATCH /users/me
Update user profile.

**Request:**
```json
{
  "name": "John Updated",
  "societyId": "new-society-uuid"
}
```

### Items

#### GET /items
Get paginated list of available items.

**Query Parameters:**
- `lat`, `lng`: Coordinates for location-based search
- `radius`: Search radius in kilometers (default: 2)
- `societyId`: Filter by society
- `categoryId`: Filter by category
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search query

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Professional Camera",
        "description": "Canon EOS DSLR",
        "categoryId": 1,
        "priceHour": 50,
        "priceDay": 500,
        "deposit": 5000,
        "location": { "lat": 28.6139, "lng": 77.2090 },
        "photos": ["url1", "url2"],
        "availability": ["weekdays", "weekends"],
        "owner": {
          "id": "uuid",
          "name": "John Doe",
          "reputationScore": 4.8
        },
        "distance": 1.2,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### POST /items
Create a new item listing.

**Request:**
```json
{
  "title": "Professional Camera",
  "description": "Canon EOS DSLR in excellent condition",
  "categoryId": 1,
  "priceHour": 50,
  "priceDay": 500,
  "deposit": 5000,
  "location": { "lat": 28.6139, "lng": 77.2090 },
  "photos": ["photo_url_1", "photo_url_2"],
  "availability": ["weekdays", "weekends"]
}
```

#### GET /items/{id}
Get detailed item information.

#### PATCH /items/{id}
Update item listing (owner only).

#### DELETE /items/{id}
Remove item listing (owner only).

### Bookings

#### POST /bookings
Create a new booking request.

**Request:**
```json
{
  "itemId": "item-uuid",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-17T10:00:00Z",
  "pickupOption": "self_pickup",
  "message": "Optional message to owner"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "uuid",
      "itemId": "item-uuid",
      "borrowerId": "borrower-uuid",
      "lenderId": "lender-uuid",
      "startTime": "2024-01-15T10:00:00Z",
      "endTime": "2024-01-17T10:00:00Z",
      "status": "requested",
      "depositHeld": false,
      "totalAmount": 1500,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "paymentUrl": "upi://pay?pa=...&am=1500"
  }
}
```

#### GET /bookings
Get user's bookings (as borrower or lender).

**Query Parameters:**
- `status`: Filter by status (requested, accepted, etc.)
- `role`: 'borrower' or 'lender'

#### GET /bookings/{id}
Get booking details.

#### PATCH /bookings/{id}/accept
Accept booking request (lender only).

#### PATCH /bookings/{id}/reject
Reject booking request (lender only).

#### POST /bookings/{id}/confirm-return
Confirm item return with photos.

**Request:**
```json
{
  "photos": ["return_photo_1", "return_photo_2"],
  "condition": "excellent",
  "notes": "Item returned in perfect condition"
}
```

### Payments

#### POST /payments/simulate
Simulate UPI payment (development only).

**Request:**
```json
{
  "bookingId": "booking-uuid",
  "amount": 1500,
  "type": "deposit"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "status": "completed",
    "transactionId": "simulated_txn_123",
    "amount": 1500,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /payments/{bookingId}
Get payment status for a booking.

### Ratings

#### POST /ratings
Submit rating for completed booking.

**Request:**
```json
{
  "bookingId": "booking-uuid",
  "rating": 5,
  "comment": "Great experience! Item was in perfect condition.",
  "asBorrower": true
}
```

### Categories

#### GET /categories
Get all item categories.

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      { "id": 1, "name": "Electronics" },
      { "id": 2, "name": "Tools" },
      { "id": 3, "name": "Appliances" },
      { "id": 4, "name": "Books" }
    ]
  }
}
```

### Societies

#### GET /societies
Get nearby societies.

**Query Parameters:**
- `lat`, `lng`: Coordinates
- `radius`: Search radius

#### GET /societies/{id}
Get society details.

## Error Codes

- `VALIDATION_ERROR`: Invalid input parameters
- `AUTHENTICATION_ERROR`: Invalid or missing token
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND_ERROR`: Resource not found
- `CONFLICT_ERROR`: Resource conflict (e.g., double booking)
- `PAYMENT_ERROR`: Payment processing failed
- `INTERNAL_ERROR`: Server error

## Rate Limits

- Authentication endpoints: 10 requests per minute
- Item listing/search: 100 requests per minute
- Booking operations: 50 requests per minute
- General endpoints: 200 requests per minute

## Webhooks

### Payment Webhook
```
POST /webhooks/payment
```

Called when payment status changes:
```json
{
  "event": "payment.completed",
  "bookingId": "uuid",
  "paymentId": "uuid",
  "status": "completed",
  "amount": 1500
}
```

## SDKs & Tools

### Postman Collection
Import `docs/Sahaay_API.postman_collection.json` for testing.

### cURL Examples

#### Signup
```bash
curl -X POST https://api.Sahaay.com/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "name": "John Doe"}'
```

#### Get Items
```bash
curl -X GET "https://api.Sahaay.com/v1/items?lat=28.6139&lng=77.2090&radius=2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```


