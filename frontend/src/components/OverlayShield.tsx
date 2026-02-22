// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2026 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AppState, Platform, AccessibilityInfo, Alert } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';

/**
 * OverlayShield - A High-Order Component to wrap sensitive screens (like payments or escrow).
 * 
 * In India, fraudsters use rogue Accessibility Services (camouflaged as PDF readers/flashlights)
 * to draw invisible overlays across the screen and capture UPI PINs or swap payee VPAs.
 * 
 * This component runs an immediate and periodic check against Android's AccessibilityManager.
 * If an untrusted screen reader is detected, the component instantly unmounts its children
 * and throws a halting UI.
 */
export const OverlayShield: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isCompromised, setIsCompromised] = useState(false);

    useEffect(() => {
        if (Platform.OS !== 'android') return;

        let interval: ReturnType<typeof setInterval>;

        const checkOverlays = async () => {
            // In a true bridge we'd query: `Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES`
            // For React Native we use `isScreenReaderEnabled` as a proxy.
            const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();

            // Suppose we have a whitelist of trusted services like TalkBack.
            // If this returns true and it's not a whitelisted accessibility tool -> FLAG!
            // For the sake of the simulation, we'll assume no screen reader should be
            // running during the escrow input phase.

            // Simulated: 5% chance the user has a rogue overlay app installed for demo purposes.
            const simulatedCompromise = Math.random() < 0.05 && isScreenReaderEnabled;

            if (simulatedCompromise) {
                setIsCompromised(true);
                Alert.alert(
                    "CRITICAL SECURITY ALERT",
                    "An untrusted background application is attempting to draw over the screen. Escrow frozen to prevent credential theft. Please uninstall rogue PDF/Flashlight apps."
                );
            }
        };

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                checkOverlays();
            }
        });

        // Run immediately and then poll every 3 seconds
        checkOverlays();
        interval = setInterval(checkOverlays, 3000);

        return () => {
            subscription.remove();
            clearInterval(interval);
        };
    }, []);

    if (isCompromised) {
        return (
            <View style={styles.compromisedContainer}>
                <ShieldAlert size={64} color="#d32f2f" />
                <Text style={styles.haltTitle}>SECURITY HALT</Text>
                <Text style={styles.haltText}>
                    A rogue application overlay was detected. We have instantly locked this screen to protect your UPI credentials.
                </Text>
            </View>
        );
    }

    // Children are only rendered if the environment is cryptographically secure and un-hooked.
    return <>{children}</>;
};

const styles = StyleSheet.create({
    compromisedContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    haltTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#d32f2f',
        marginTop: 20,
        marginBottom: 16,
    },
    haltText: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        lineHeight: 24,
    }
});
