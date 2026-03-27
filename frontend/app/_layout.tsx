import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/shared/api/queryClient';
import { AuthProvider } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useProtectedRoute } from '../src/hooks/useProtectedRoute';
import { Suspense, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { ENFORCE_SECURE_RUNTIME } from '../src/config/runtime';
import { ThemeProvider, useAppTheme } from '../src/theme/provider';
import { activateAppCheck, validateSecureBackendAccess } from '../src/services/AppCheckService';
import { flushMarketplaceEvents } from '../src/services/analytics';

// Export Expo Router Error Boundary to catch deep-link rendering crashes
export { ErrorBoundary } from 'expo-router';

function RootLayoutNav() {
    // This hook enforces the auth boundary. It intercepts layout rendering
    // and forces a router.replace if the user shouldn't be here.
    useProtectedRoute();
    const { theme, mode } = useAppTheme();
    const [secureRuntimeState, setSecureRuntimeState] = useState<'checking' | 'ready' | 'failed'>(
        ENFORCE_SECURE_RUNTIME ? 'checking' : 'ready'
    );
    const [secureRuntimeError, setSecureRuntimeError] = useState<string | null>(null);
    const [secureRuntimeAttempts, setSecureRuntimeAttempts] = useState(0);

    useEffect(() => {
        let active = true;

        const bootstrapSecureRuntime = async () => {
            try {
                await activateAppCheck();

                if (ENFORCE_SECURE_RUNTIME) {
                    await validateSecureBackendAccess();
                }

                if (!active) {
                    return;
                }

                setSecureRuntimeError(null);
                setSecureRuntimeState('ready');
            } catch (error) {
                if (!active) {
                    return;
                }

                setSecureRuntimeState('failed');
                setSecureRuntimeError(
                    error instanceof Error
                        ? error.message
                        : 'This build could not complete the secure startup validation.'
                );
            }
        };

        bootstrapSecureRuntime();
        flushMarketplaceEvents();

        return () => {
            active = false;
        };
    }, [secureRuntimeAttempts]);

    if (secureRuntimeState === 'checking') {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={theme.colors.accentStrong} />
                <Text style={{ marginTop: 16, color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700' }}>
                    Verifying secure runtime
                </Text>
                <Text style={{ marginTop: 8, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
                    Checking App Check, Firebase callable access, and build configuration before the app continues.
                </Text>
            </View>
        );
    }

    if (secureRuntimeState === 'failed') {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: theme.colors.background }}>
                <Text style={{ color: theme.colors.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center' }}>
                    Secure startup failed
                </Text>
                <Text style={{ marginTop: 12, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
                    {secureRuntimeError || 'This build could not verify secure Firebase access.'}
                </Text>
                <TouchableOpacity
                    style={{
                        marginTop: 20,
                        backgroundColor: theme.colors.accent,
                        paddingHorizontal: 20,
                        paddingVertical: 14,
                        borderRadius: 16,
                    }}
                    onPress={() => {
                        setSecureRuntimeError(null);
                        setSecureRuntimeState(ENFORCE_SECURE_RUNTIME ? 'checking' : 'ready');
                        setSecureRuntimeAttempts((attempts) => attempts + 1);
                    }}
                >
                    <Text style={{ color: '#181411', fontWeight: '800' }}>Retry secure check</Text>
                </TouchableOpacity>
            </View>
        );
    }

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
