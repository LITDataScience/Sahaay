import { Stack, Slot, ErrorBoundary } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/shared/api/queryClient';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import Colors from '../src/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useProtectedRoute } from '../src/hooks/useProtectedRoute';
import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';

// Export Expo Router Error Boundary to catch deep-link rendering crashes
export { ErrorBoundary } from 'expo-router';

function RootLayoutNav() {
    // This hook enforces the auth boundary. It intercepts layout rendering
    // and forces a router.replace if the user shouldn't be here.
    useProtectedRoute();

    return (
        <>
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: Colors.primary },
                    headerTintColor: Colors.text.primary,
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            >
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="item/[id]" options={{ title: 'Item Details' }} />
                <Stack.Screen name="booking" options={{ title: 'Book Item' }} />
                <Stack.Screen name="handshake" options={{ title: 'Escrow Handshake' }} />
                <Stack.Screen name="verification" options={{ title: 'KYC Verification' }} />
            </Stack>
            <StatusBar style="dark" />
        </>
    );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <Suspense fallback={
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    }>
                        <RootLayoutNav />
                    </Suspense>
                </AuthProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
