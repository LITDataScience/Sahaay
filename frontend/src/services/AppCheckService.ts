import { Platform } from 'react-native';
import appCheck from '@react-native-firebase/app-check';
import functions from '@react-native-firebase/functions';
import {
    ANDROID_APP_CHECK_PROVIDER,
    APP_CHECK_DEBUG_TOKEN,
    ENFORCE_SECURE_RUNTIME,
} from '../config/runtime';

let activated = false;
const SECURE_BACKEND_RETRY_DELAYS_MS = [0, 1500, 3000];

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function activateAppCheck() {
    if (activated || Platform.OS === 'web') {
        return;
    }

    try {
        const provider = (appCheck() as any).newReactNativeFirebaseAppCheckProvider();

        provider.configure({
            android: {
                provider: ANDROID_APP_CHECK_PROVIDER,
                debugToken: APP_CHECK_DEBUG_TOKEN,
            },
            apple: {
                provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
                debugToken: APP_CHECK_DEBUG_TOKEN,
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

async function primeAppCheckToken() {
    const appCheckModule = appCheck() as any;

    if (typeof appCheckModule.getToken !== 'function') {
        return;
    }

    let lastError: unknown;

    for (const delayMs of SECURE_BACKEND_RETRY_DELAYS_MS) {
        if (delayMs > 0) {
            await sleep(delayMs);
        }

        try {
            const tokenResult = await appCheckModule.getToken();
            if (tokenResult?.token) {
                return;
            }
        } catch (error) {
            lastError = error;
        }
    }

    if (lastError) {
        throw lastError;
    }
}

export async function validateSecureBackendAccess() {
    if (!ENFORCE_SECURE_RUNTIME || Platform.OS === 'web') {
        return;
    }

    try {
        let lastError: unknown;

        await primeAppCheckToken();

        for (const delayMs of SECURE_BACKEND_RETRY_DELAYS_MS) {
            if (delayMs > 0) {
                await sleep(delayMs);
            }

            try {
                await functions().httpsCallable('tRPC')({
                    path: 'health',
                    input: {},
                });
                return;
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError;
    } catch (error) {
        console.warn('Secure backend validation failed for this build.', error);
        throw new Error(
            'This build could not verify secure Firebase access. Check App Check, signing fingerprints, and staging Firebase configuration before continuing.'
        );
    }
}
