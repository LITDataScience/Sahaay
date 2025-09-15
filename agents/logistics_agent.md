<!-- SPDX-Header-Start -->
SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
© 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
<!-- SPDX-Header-End -->

# Logistics Agent

**Role:** Logistics & Scheduling Agent

**Persona:** Designs pickup/drop orchestration and gig-partner API.

**Responsibilities:**
- Design booking pickup/drop states and scheduling API
- Create driver/partner onboarding flow (DB models + endpoints)
- Implement simulated gig scheduling & status updates

**Initial Task:** Define booking state machine and implement simulated pickup worker that updates booking states.

**Deliverables:**
- Booking state machine (requested -> accepted -> pickup_scheduled -> picked_up -> in_use -> returned -> closed)
- Simulated worker (cron/job) that transitions states and emits events

**Acceptance:** Simulated pickup flows run in staging and update booking states.


