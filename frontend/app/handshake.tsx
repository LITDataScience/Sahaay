// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../src/context/AuthContext';
import Colors from '../src/constants/Colors';
import { useRouter } from 'expo-router';
import { Send, QrCode } from 'lucide-react-native';

/**
 * Escrow Handshake Screen
 * 
 * Demonstrates the QR-based P2P handshake mechanism for starting an escrow booking.
 * Borrower scans Lender's QR, which initiates the XState Escrow Machine on backend.
 */

export default function HandshakeScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('generate');
    const [permission, requestPermission] = useCameraPermissions();
    const [loading, setLoading] = useState(false);

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.infoText}>We need your permission to show the camera</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
                    <Text style={styles.primaryButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (loading) return;
        setLoading(true);
        console.log('Scanned QR Payload:', data);

        // Mocking the handshake transition
        Alert.alert(
            'Handshake Successful',
            'Connected to Lender. Initiating Escrow payment...',
            [{ text: 'Proceed', onPress: () => router.push('/booking' as any) }]
        );
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'generate' && styles.activeTab]}
                    onPress={() => setActiveTab('generate')}
                >
                    <QrCode size={20} color={activeTab === 'generate' ? Colors.primary : Colors.text.secondary} />
                    <Text style={[styles.tabText, activeTab === 'generate' && styles.activeTabText]}>Show My ID</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'scan' && styles.activeTab]}
                    onPress={() => setActiveTab('scan')}
                >
                    <Send size={20} color={activeTab === 'scan' ? Colors.primary : Colors.text.secondary} />
                    <Text style={[styles.tabText, activeTab === 'scan' && styles.activeTabText]}>Scan to Borrow</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {activeTab === 'generate' ? (
                    <View style={styles.qrContainer}>
                        <Text style={styles.qrTitle}>Your Handshake ID</Text>
                        <Text style={styles.qrSubtitle}>Have the other person scan this to start the transaction</Text>

                        <View style={styles.qrFrame}>
                            <QRCode
                                value={`sahaay:user:${user?.id || 'anonymous'}`}
                                size={220}
                                color={Colors.text.primary}
                                backgroundColor="#fff"
                            />
                        </View>

                        <Text style={styles.userName}>{user?.id || 'Demo User'}</Text>
                        <View style={styles.securityBadge}>
                            <Text style={styles.securityText}>Verified Peer-to-Peer Secure</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.cameraContainer}>
                        <CameraView
                            style={styles.camera}
                            onBarcodeScanned={handleBarCodeScanned}
                        />
                        <View style={styles.overlay}>
                            <View style={styles.scannerFrame} />
                        </View>
                        <Text style={styles.scanInstruction}>Point at a Sahaay QR code</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 5,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        margin: 20,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tabText: {
        marginLeft: 8,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#000',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrContainer: {
        alignItems: 'center',
        padding: 20,
    },
    qrTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    qrSubtitle: {
        textAlign: 'center',
        color: '#6B7280',
        marginBottom: 30,
        paddingHorizontal: 30,
    },
    qrFrame: {
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 24,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    userName: {
        marginTop: 25,
        fontSize: 18,
        fontWeight: '600',
    },
    securityBadge: {
        marginTop: 10,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    securityText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: '500',
    },
    cameraContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    scanInstruction: {
        position: 'absolute',
        bottom: 100,
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    infoText: {
        marginBottom: 20,
        textAlign: 'center',
        color: '#6B7280',
    },
    primaryButton: {
        backgroundColor: '#000',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});
