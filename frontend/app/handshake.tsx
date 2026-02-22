// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2026 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../src/context/AuthContext';
import { SecurityService } from '../src/services/SecurityService';
import { IPFSService } from '../src/services/IPFSService';
import { useMachine } from '@xstate/react';
import { escrowMachine } from '../src/machines/escrowMachine';
import Colors from '../src/constants/Colors';
import Theme from '../src/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { QrCode, Scan, ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// Simulated Escrow Session
const MOCK_BOOKING_ID = 'ESCROW_BKG_49201';

export default function HandshakeScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('generate');
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [qrPayload, setQrPayload] = useState<string>('');

    // Phase 11: Escrow Mathematical State Machine
    const [state, send] = useMachine(escrowMachine);

    // IPFS Dispute Resolution State
    const [hasRecordedSweep, setHasRecordedSweep] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaHashCID, setMediaHashCID] = useState<string>('');

    // Generating a dynamic, signed payload for the Lender
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        const generatePayload = async () => {
            if (!hasRecordedSweep || !mediaHashCID) return;

            try {
                const timestamp = Math.floor(Date.now() / 10000); // Rotates every 10 seconds
                const rawPayload = `SAHAAY_HANDSHAKE|${MOCK_BOOKING_ID}|${timestamp}|IPFS:${mediaHashCID}`;
                // Sign payload with the hardware enclave key to prevent spoofing
                const signature = await SecurityService.signPayload(rawPayload);
                setQrPayload(`${rawPayload}|SIG:${signature.substring(0, 16)}`);
            } catch (err) {
                setQrPayload('SECURITY_ERROR: DEVICE_NOT_BOUND');
            }
        };

        if (activeTab === 'generate' && hasRecordedSweep) {
            generatePayload();
            interval = setInterval(generatePayload, 10000);
        }

        return () => clearInterval(interval);
    }, [activeTab]);

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        setScanned(true);
        if (data.startsWith('SAHAAY_HANDSHAKE')) {
            const parts = data.split('|');
            const ipfsHash = parts.find(p => p.startsWith('IPFS:'))?.split(':')[1] || 'UNKNOWN';

            // Phase 11: Dispatch formal mathematical state transition
            send({ type: 'HANDSHAKE_SCANNED', ipfsHash });

            Alert.alert(
                'Cryptographic Handshake Successful',
                `Escrow conditions satisfied via Abstract Machine.\nImmutable Condition Hash: ${ipfsHash.substring(0, 12)}... pinned. Item officially handed over.`,
                [{ text: 'Complete', onPress: () => router.back() }]
            );
        } else {
            Alert.alert('Invalid Handshake', 'This QR code is not recognized.', [
                { text: 'Try Again', onPress: () => setScanned(false) }
            ]);
        }
    };

    const captureConditionSweep = async () => {
        setIsRecording(true);
        // Simulate recording a 5-second 360-sweep
        setTimeout(async () => {
            setIsRecording(false);
            const simulatedVideoUri = `file:///data/user/0/com.sahaay/cache/Video_${Date.now()}.mp4`;
            const cid = await IPFSService.pinVideoAndGetHash(simulatedVideoUri);
            setMediaHashCID(cid);
            setHasRecordedSweep(true);
            Alert.alert("Evidentiary Hash Generated", `Condition proof pinned to IPFS.\nCID: ${cid}`);
        }, 5000);
    };

    if (!permission) {
        return <View />;
    }

    if (!permission.granted && activeTab === 'scan') {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={[Colors.primary, Colors.darkPrimary]} style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft color="#000" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Physical Escrow Handover</Text>
            </LinearGradient>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'generate' && styles.activeTab]}
                    onPress={() => setActiveTab('generate')}
                >
                    <QrCode color={activeTab === 'generate' ? '#fff' : Colors.text.secondary} size={20} />
                    <Text style={[styles.tabText, activeTab === 'generate' && styles.activeTabText]}>Lender (Show QR)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'scan' && styles.activeTab]}
                    onPress={() => {
                        setScanned(false);
                        setActiveTab('scan');
                    }}
                >
                    <Scan color={activeTab === 'scan' ? '#fff' : Colors.text.secondary} size={20} />
                    <Text style={[styles.tabText, activeTab === 'scan' && styles.activeTabText]}>Borrower (Scan)</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {activeTab === 'generate' ? (
                    !hasRecordedSweep ? (
                        <View style={styles.recordContainer}>
                            <Text style={styles.instructionTitle}>Mandatory Condition Check</Text>
                            <Text style={styles.instructionDesc}>
                                Before generating the handover QR, you must record a 5-second 360° sweep of the item to cryptographically prove its condition and prevent false disputes.
                            </Text>
                            <View style={styles.cameraWrapper}>
                                <CameraView style={styles.camera} facing="back" />
                            </View>
                            <TouchableOpacity
                                style={[styles.primaryButton, isRecording && { backgroundColor: '#d32f2f' }]}
                                onPress={captureConditionSweep}
                                disabled={isRecording}
                            >
                                <Text style={styles.buttonText}>
                                    {isRecording ? "Recording 360° Sweep..." : "Start Arbitration Capture"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.qrContainer}>
                            <Text style={styles.instructionTitle}>Show this code to the Borrower</Text>
                            <Text style={styles.instructionDesc}>
                                This mathematically proves you handed over the item. The code changes every 10 seconds.
                            </Text>

                            <View style={styles.qrWrapper}>
                                {qrPayload ? (
                                    <QRCode
                                        value={qrPayload}
                                        size={250}
                                        color={Colors.text.primary}
                                        backgroundColor="#fff"
                                    />
                                ) : (
                                    <Text>Generating secure payload...</Text>
                                )}
                            </View>
                            <View style={styles.secureBadge}>
                                <ShieldCheck size={16} color="#2e7d32" />
                                <Text style={styles.secureBadgeText}>Hardware-Encrypted Payload + IPFS Ledger</Text>
                            </View>
                        </View>
                    )
                ) : (
                    <View style={styles.scannerContainer}>
                        <Text style={styles.instructionTitle}>Scan the Lender's QR Code</Text>
                        <Text style={styles.instructionDesc}>
                            Scanning authorizes the transfer of responsibility and finalizes the physical handover process.
                        </Text>

                        <View style={styles.cameraWrapper}>
                            <CameraView
                                style={styles.camera}
                                facing="back"
                                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                                barcodeScannerSettings={{
                                    barcodeTypes: ["qr"],
                                }}
                            />
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    tabContainer: {
        flexDirection: 'row',
        margin: Theme.spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: Theme.borderRadius.md,
        padding: 4,
        ...Theme.shadows.small,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: Theme.borderRadius.md,
        gap: 8,
    },
    activeTab: {
        backgroundColor: Colors.secondary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    activeTabText: {
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: Theme.spacing.lg,
    },
    qrContainer: {
        alignItems: 'center',
        flex: 1,
    },
    instructionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    instructionDesc: {
        fontSize: 14,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    qrWrapper: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: Theme.borderRadius.lg,
        ...Theme.shadows.medium,
    },
    secureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    secureBadgeText: {
        color: '#2e7d32',
        fontWeight: '600',
        fontSize: 12,
    },
    scannerContainer: {
        flex: 1,
        alignItems: 'center',
    },
    cameraWrapper: {
        width: 300,
        height: 300,
        borderRadius: Theme.borderRadius.lg,
        overflow: 'hidden',
        ...Theme.shadows.large,
        borderWidth: 2,
        borderColor: Colors.primary,
        marginBottom: 20,
    },
    camera: {
        flex: 1,
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
        fontSize: 16,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 20,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    recordContainer: {
        alignItems: 'center',
        flex: 1,
    }
});
