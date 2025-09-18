<!-- SPDX-Header-Start -->
SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
© 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
<!-- SPDX-Header-End -->

## Sahaay Website/App - Changes Implemented and Run Guide

### Overview

This document summarizes the recent frontend updates for the Sahaay website/app and explains how to run the project locally (web and native via Expo). The changes add an interactive home experience, a login portal, and a profile section with persistent authentication, while keeping the codebase easily editable.

### What Changed

- Navigation and App Shell
  - Added bottom tab navigation (Home, Create, Profile) and a stack for details and booking.
  - Centralized auth state using a lightweight `AuthContext` with AsyncStorage persistence.
  - Entry updated to support gesture handler and themed navigation.

- New/Updated Files (frontend)
  - `src/context/AuthContext.tsx`: Persistent auth, login (phone + OTP mock), logout, profile update.
  - `src/components/SearchBar.tsx`: Reusable search input.
  - `src/components/CategoryChips.tsx`: Horizontal category selector chips.
  - `src/components/ItemCard.tsx`: Item card used in lists and grid.
  - `src/services/mockData.ts`: Categories and mock items; simple search helper.
  - `src/screens/HomeScreen.tsx`: Interactive feed with search, filters, and responsive grid (OLX-like on web).
  - `src/screens/LoginScreen.tsx`: Phone → OTP flow wired to `AuthContext`.
  - `src/screens/ProfileScreen.tsx`: Shows user details; name is editable; logout button.
  - `App.tsx`: Tabs + Stack navigation and conditional routing based on auth status.
  - `babel.config.js`: Enables Reanimated plugin for navigation.

- Dependencies Installed (frontend)
  - `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`
  - `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-reanimated`
  - `@react-native-async-storage/async-storage`
  - Expo plugins used in `app.json`: `expo-location`, `expo-image-picker`, `expo-notifications`

### How to Run

Prerequisites:
- Node.js 18+ and pnpm installed

Install deps (from repo root or `frontend/`):

```bash
cd frontend
pnpm install
```

Start for Web (localhost):

```bash
pnpm web
```

This starts Expo Web and opens the app at a local URL (e.g., http://localhost:19006). If you encounter a plugin resolution error, ensure the plugins are installed (they are included in the lockfile and install step above).

Start for Mobile (Expo Go):

```bash
pnpm start
```

Then press `w` for web, `a` for Android, or `i` for iOS. You can also scan the QR code with Expo Go.

### Using the App

- Login: Navigate to the Login screen (shown by default when not authenticated), enter a 10-digit phone number, request OTP, enter a 6-digit OTP, and verify.
- Home: Search using the search bar, switch categories using chips, and open an item to see details. Grid becomes 1/2/3 columns based on browser width.
- Create: Placeholder screen to publish listings.
- Profile: Edit your display name and Logout.

### Editing

- Update mock items and categories in `frontend/src/services/mockData.ts`.
- Adjust UI via components in `frontend/src/components/*`.
- Auth logic is centralized in `frontend/src/context/AuthContext.tsx`.

### Notes

- These changes are frontend-only and use mock data for the catalog and a mock OTP verification flow. Hook them to backend APIs when ready.


