const rawAppEnv =
    process.env.EXPO_PUBLIC_APP_ENV ??
    (__DEV__ ? 'development' : 'production');

const rawAndroidAppCheckProvider = (
    process.env.EXPO_PUBLIC_ANDROID_APP_CHECK_PROVIDER ?? ''
).trim().toLowerCase();

export const APP_ENV = rawAppEnv.toLowerCase();
export const ENABLE_DEMO_AUTH = process.env.EXPO_PUBLIC_ENABLE_DEMO_AUTH === 'true';

export const ANDROID_APP_CHECK_PROVIDER: 'debug' | 'playIntegrity' =
    rawAndroidAppCheckProvider === 'debug'
        ? 'debug'
        : rawAndroidAppCheckProvider === 'playintegrity' || rawAndroidAppCheckProvider === 'play_integrity'
            ? 'playIntegrity'
            : APP_ENV === 'production'
                ? 'playIntegrity'
                : 'debug';

export const APP_CHECK_DEBUG_TOKEN = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN;
export const ENFORCE_SECURE_RUNTIME =
    process.env.EXPO_PUBLIC_ENFORCE_SECURE_RUNTIME === 'true' || APP_ENV === 'production';
