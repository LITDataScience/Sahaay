jest.mock(
    '@react-native-async-storage/async-storage',
    () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const firebaseUser = {
    uid: 'test_user',
    email: 'test@sahaay.com',
    phoneNumber: '+911234567890',
    isAnonymous: false,
};

jest.mock('@react-native-firebase/auth', () => {
    const authInstance = {
        currentUser: firebaseUser,
        onAuthStateChanged: jest.fn((callback) => {
            callback(firebaseUser);
            return jest.fn();
        }),
        signOut: jest.fn(),
        signInWithPhoneNumber: jest.fn(),
        signInAnonymously: jest.fn(async () => ({ user: firebaseUser })),
    };

    const auth = () => authInstance;
    auth.FirebaseAuthTypes = {};

    return auth;
});

jest.mock('@react-native-firebase/firestore', () => {
    const docRef = {
        get: jest.fn(async () => ({
            data: () => ({}),
        })),
        set: jest.fn(async () => undefined),
    };

    const firestoreInstance = {
        collection: jest.fn(() => ({
            doc: jest.fn(() => docRef),
        })),
    };

    const firestore = () => firestoreInstance;
    firestore.FieldValue = {
        serverTimestamp: jest.fn(() => 'server-timestamp'),
    };

    return firestore;
});

jest.mock('@react-native-firebase/functions', () => {
    const functionsInstance = {
        httpsCallable: jest.fn(() =>
            jest.fn(async () => ({
                data: {
                    success: true,
                    bookingId: 'booking_1',
                    status: 'pending',
                },
            }))
        ),
    };

    return () => functionsInstance;
});

jest.mock('./src/services/SecurityService', () => ({
    SecurityService: {
        bindDevice: jest.fn(async () => 'mock-public-key'),
        unbindDevice: jest.fn(async () => undefined),
    },
}));

jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(() => ({
        data: {
            baseAmount: 1500,
            depositAmount: 2000,
            platformFee: 0,
            totalAmount: 1500,
            days: 3,
        },
        isLoading: false,
    })),
}));

jest.mock('./src/theme/provider', () => ({
    useAppTheme: jest.fn(() => ({
        theme: {
            colors: {
                background: '#fff',
                surface: '#fff',
                surfaceAlt: '#f4f4f4',
                border: '#ddd',
                borderStrong: '#bbb',
                textPrimary: '#111',
                textSecondary: '#444',
                accent: '#f5c542',
                accentStrong: '#d97706',
            },
            radius: {
                md: 12,
                lg: 16,
            },
            shadows: {
                soft: {},
            },
        },
    })),
}));

jest.mock('./src/services/analytics', () => ({
    trackMarketplaceEvent: jest.fn(),
}));
