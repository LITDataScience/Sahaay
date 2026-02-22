// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2026 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../context/AuthContext';

/**
 * useProtectedRoute - An Expo Router specific hook for handling Auth state transitions.
 * 
 * It listens to the authentication state and the current navigation segment.
 * If a user tries to access an authenticated route (like /(tabs)/profile) while logged out,
 * it intercepts the render and redirects to /login.
 * 
 * If a user is logged in but tries to access /login, it redirects to the app root.
 */
export function useProtectedRoute() {
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        // Check if the current route segment belongs to the (app) group
        // If segments array is empty, we consider it root.
        const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login';

        if (!user && !inAuthGroup) {
            // Redirect unauthenticated users to login
            router.replace('/login' as any);
        } else if (user && inAuthGroup) {
            // Redirect authenticated users away from login
            router.replace('/(tabs)' as any);
        }
    }, [user, isLoading, segments]);
}
