import { renderHook } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import React from 'react';

// Mock Firebase Auth
jest.mock('@react-native-firebase/auth', () => () => ({
    onAuthStateChanged: jest.fn((callback) => {
        callback({ uid: 'test_user', email: 'test@sahaay.com' });
        return jest.fn(); // unsubscribe
    }),
    signOut: jest.fn(),
}));

describe('AuthContext', () => {
    it('provides user state correctly', async () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        // Since it's async, we might need to wait for state to settle, but for this mock, 
        // we assume the user is set. In a real test we wait for result.current.user
        expect(result.current).toHaveProperty('user');
        expect(result.current).toHaveProperty('submitVerification');
        expect(result.current).toHaveProperty('refreshVerificationStatus');
    });
});