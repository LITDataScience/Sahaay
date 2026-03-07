import { Platform } from 'react-native';
import appCheck from '@react-native-firebase/app-check';

let activated = false;

export async function activateAppCheck() {
    if (activated || Platform.OS === 'web') {
        return;
    }

    try {
        const provider = (appCheck() as any).newReactNativeFirebaseAppCheckProvider();

        provider.configure({
            android: {
                provider: __DEV__ ? 'debug' : 'playIntegrity',
                debugToken: process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN,
            },
            apple: {
                provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
                debugToken: process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN,
            },
        });

        await (appCheck() as any).initializeAppCheck({
            provider,
            isTokenAutoRefreshEnabled: true,
        });
        activated = true;
    } catch (error) {
        console.warn('App Check activation failed. Firebase callable hardening will stay degraded until configured.', error);
    }
}
