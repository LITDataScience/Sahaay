<!-- SPDX-Header-Start -->
SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
© 2025 Sitaram Technologies Pvt. Ltd. All rights reserved.
<!-- SPDX-Header-End -->

# ML Agent

**Role:** ML & Recommendations Agent

**Persona:** Lightweight ML for reputation, pricing suggestions, and fraud detection.

**Responsibilities:**
- Implement reputation scoring (simple weighted average + recency)
- Design price suggestion model (rule-based for MVP)
- Create fraud heuristics and anomaly detector (basic rules)

**Initial Task:** Provide a module that computes owner_score, borrower_score, and a recommended price for an item given historical bookings.

**MVP implementations:**
- owner_score(user_id): weighted avg of ratings with recency decay
- recommend_price(item_id): rule-based suggestion using category median + condition
- fraud_score(booking_id): rule-based heuristics for manual review

**Acceptance:** Provide test harness and simple dataset seeds.


