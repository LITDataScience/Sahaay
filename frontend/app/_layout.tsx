import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/shared/api/queryClient';
import { AuthProvider } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useProtectedRoute } from '../src/hooks/useProtectedRoute';
import { Suspense, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ThemeProvider, useAppTheme } from '../src/theme/provider';
import { activateAppCheck } from '../src/services/AppCheckService';
import { flushMarketplaceEvents } from '../src/services/analytics';

// Export Expo Router Error Boundary to catch deep-link rendering crashes
export { ErrorBoundary } from 'expo-router';

function RootLayoutNav() {
    // This hook enforces the auth boundary. It intercepts layout rendering
    // and forces a router.replace if the user shouldn't be here.
    useProtectedRoute();
    const { theme, mode } = useAppTheme();

    useEffect(() => {
        activateAppCheck();
        flushMarketplaceEvents();
    }, []);

    return (
        <>
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: theme.colors.surfaceElevated },
                    headerTintColor: theme.colors.textPrimary,
                    headerTitleStyle: { fontWeight: '700' },
                    contentStyle: { backgroundColor: theme.colors.background },
                }}
            >
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="item/[id]" options={{ title: 'Item Details' }} />
                <Stack.Screen name="booking" options={{ title: 'Book Item' }} />
                <Stack.Screen name="handshake" options={{ title: 'Escrow Handshake' }} />
                <Stack.Screen name="verification" options={{ title: 'KYC Verification' }} />
                <Stack.Screen name="support" options={{ title: 'Support Copilot' }} />
                <Stack.Screen name="admin/reviews" options={{ title: 'Verification Review Console' }} />
                <Stack.Screen name="listing/create" options={{ title: 'Create Listing' }} />
                <Stack.Screen name="listing/location" options={{ title: 'Listing Location' }} />
                <Stack.Screen name="listing/pricing" options={{ title: 'Listing Pricing' }} />
                <Stack.Screen name="listing/review" options={{ title: 'Review Listing' }} />
            </Stack>
            <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        </>
    );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <AuthProvider>
                        <Suspense fallback={
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <ActivityIndicator size="large" color="#C9A227" />
                            </View>
                        }>
                            <RootLayoutNav />
                        </Suspense>
                    </AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
