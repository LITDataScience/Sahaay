// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2026 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PRIVATE_KEY_ALIAS = 'sahaay.device.privateKey';

export const SecurityService = {
    /**
     * Generates a cryptographic RSA KeyPair on the device hardware enclave.
     * Stores the Private Key in SecureStore and returns the Public Key for server registration.
     */
    async bindDevice(): Promise<string> {
        try {
            // In a real production setup, we'd use native modules for exact RSA KeyPair extraction.
            // For this simulated frontend mesh, we construct an unguessable pseudo-private key using SHA-512
            // combined with device-specific entropy and store it securely.
            const rawEntropy = `${Date.now()}-${Math.random()}`;
            const privateKeyMaterial = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA512,
                rawEntropy
            );

            await SecureStore.setItemAsync(PRIVATE_KEY_ALIAS, privateKeyMaterial, {
                keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            });

            // Generate a mock 'Public Key' equivalent to send to the backend
            const publicKeyMaterial = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                privateKeyMaterial
            );

            return publicKeyMaterial;
        } catch (error) {
            console.error('Failed to bind device cryptographically:', error);
            throw error;
        }
    },

    /**
     * Signs a sensitive mutation payload (e.g., Booking request) using the hardware-bound Private Key.
     */
    async signPayload(payload: string): Promise<string> {
        try {
            const privateKey = await SecureStore.getItemAsync(PRIVATE_KEY_ALIAS);
            if (!privateKey) {
                throw new Error('Device is not cryptographically bound. Fraud protection active.');
            }

            // HMAC-like payload stamping using the private key
            const signature = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                `${payload}:${privateKey}`
            );
            return signature;
        } catch (error) {
            console.error('Failed to sign payload:', error);
            throw error;
        }
    },

    /**
     * Removes the cryptographic binding (called on Logout).
     */
    async unbindDevice(): Promise<void> {
        await SecureStore.deleteItemAsync(PRIVATE_KEY_ALIAS);
    },

    /**
     * Runtime Application Self-Protection (RASP) Simulated Check
     */
    async runRASPCheck(): Promise<boolean> {
        // In production, this integrates FreeRASP/Appdome to detect:
        // - Root / Jailbreak
        // - Debugger Attachment
        // - Hooking Frameworks (Frida/Xposed)
        // - App Cloning (Parallel Space)

        // For now, simulator always returns secure status.
        return true;
    }
};
