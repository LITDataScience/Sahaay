// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2026 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

/**
 * Global Route Definitions ensuring Type-Safe deep linking across the app.
 * Using Expo Router's Href typing to prevent "magic string" navigation failures.
 */

import { Href } from 'expo-router';

export const Routes = {
    Auth: {
        Login: '/login' as Href<string>,
        Verification: '/verification' as Href<string>,
        Support: '/support' as Href<string>,
        AdminReviews: '/admin/reviews' as Href<string>,
    },
    App: {
        Root: '/(tabs)' as Href<string>,
        Home: '/(tabs)/index' as Href<string>,
        Search: '/(tabs)/search' as Href<string>,
        Inbox: '/(tabs)/inbox' as Href<string>,
        Profile: '/(tabs)/profile' as Href<string>,
    },
    Modals: {
        Booking: '/booking' as Href<string>,
        Handshake: '/handshake' as Href<string>,
    },
    Listing: {
        Create: '/listing/create' as Href<string>,
        Location: '/listing/location' as Href<string>,
        Pricing: '/listing/pricing' as Href<string>,
        Review: '/listing/review' as Href<string>,
    },
    Dynamic: {
        ItemDetails: (id: string): Href<string> => `/item/${id}` as Href<string>,
    }
} as const;
