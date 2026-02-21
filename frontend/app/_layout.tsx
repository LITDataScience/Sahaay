import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/shared/api/queryClient';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import Colors from '../src/constants/Colors';
import { StatusBar } from 'expo-status-bar';

function RootLayoutNav() {
    const { user } = useAuth();

    return (
        <>
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: Colors.primary },
                    headerTintColor: Colors.text.primary,
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            >
                {!user ? (
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                ) : (
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                )}
                <Stack.Screen name="item/[id]" options={{ title: 'Item Details' }} />
                <Stack.Screen name="booking" options={{ title: 'Book Item' }} />
            </Stack>
            <StatusBar style="dark" />
        </>
    );
}

export default function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <RootLayoutNav />
            </AuthProvider>
        </QueryClientProvider>
    );
}
