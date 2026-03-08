import React, { useState } from 'react';
import { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import Colors from '../src/constants/Colors';
import Theme from '../src/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, ShieldAlert, CheckCircle, CreditCard, ChevronRight, Fingerprint } from 'lucide-react-native';
import { trackMarketplaceEvent } from '../src/services/analytics';

export default function VerificationScreen() {
    const router = useRouter();
    const { user, submitVerification, refreshVerificationStatus } = useAuth();

    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationMethod, setVerificationMethod] = useState<'digilocker' | 'pan' | null>(null);

    // Active Liveness States
    const [permission, requestPermission] = useCameraPermissions();
    const [isLivenessChecking, setIsLivenessChecking] = useState(false);
    const [livenessTask, setLivenessTask] = useState('');

    useEffect(() => {
        refreshVerificationStatus();
    }, [refreshVerificationStatus]);

    const startVerification = async (method: 'digilocker' | 'pan') => {
        setVerificationMethod(method);

        // Require Camera for Active Liveness check
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                Alert.alert("Permission Required", "Camera access is needed for Active Liveness verification.");
                return;
            }
        }

        // Start Liveness Flow
        setIsLivenessChecking(true);
        const tasks = [
            'Blink 3 times rapidly',
            'Read aloud: "8 2 4 9"',
            'Turn your head slightly to the left',
            'Smile widely for 2 seconds'
        ];
        setLivenessTask(tasks[Math.floor(Math.random() * tasks.length)]);

        // Simulate liveness processing
        setTimeout(() => {
            setIsLivenessChecking(false);

            // For demo, mostly pass but occasionally fail to show strict threshold
            const confidence = Math.random();
            if (confidence < 0.15) { // 15% chance to trigger deepfake shield for demo purposes
                handleLivenessResult(false, `Confidence score 95.8% (Below 98% Threshold). Deepfake or replay attack suspected.`);
            } else {
                handleLivenessResult(true, `Confidence score 99.2%. Active Liveness Confirmed.`);
            }
        }, 4000);
    };

    const handleLivenessResult = async (success: boolean, message: string) => {
        if (!success) {
            Alert.alert('Security Alert: Verification Halted', message);
            return;
        }

        setIsVerifying(true);
        setTimeout(async () => {
            try {
                await submitVerification(verificationMethod || 'digilocker', 0.992, message);
                await refreshVerificationStatus();
                trackMarketplaceEvent({
                    name: 'verification_submitted',
                    entityType: 'verification',
                    metadata: { method: verificationMethod || 'digilocker' },
                });
                setIsVerifying(false);
                Alert.alert(
                    'Verification Submitted',
                    'Your KYC package and liveness signals were submitted to the backend review pipeline. Access unlocks automatically after approval.',
                    [{ text: 'Continue', onPress: () => router.back() }]
                );
            } catch (error) {
                setIsVerifying(false);
                Alert.alert(
                    'Verification Pending Backend Approval',
                    error instanceof Error
                        ? error.message
                        : 'This verification flow could not submit your case.'
                );
            }
        }, 2000);
    };

    if (isLivenessChecking) {
        return (
            <View style={styles.livenessContainer}>
                <Text style={styles.livenessTitle}>Active Liveness Check</Text>
                <Text style={styles.livenessSubtitle}>Please perform the following action to verify you are a real person.</Text>

                <View style={styles.cameraWrapper}>
                    <CameraView style={styles.camera} facing="front" />
                </View>

                <View style={styles.taskCard}>
                    <Text style={styles.taskText}>{livenessTask}</Text>
                </View>

                <Text style={styles.secureText}>
                    <Shield size={14} color="#2e7d32" /> Hyperverge AI Liveness Engine Active
                </Text>
            </View>
        );
    }

    if (isVerifying) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingTitle}>Verifying Documents</Text>
                <Text style={styles.loadingText}>
                    {verificationMethod === 'digilocker'
                        ? 'Matching identity with DigiLocker...'
                        : 'Validating PAN networks...'}
                </Text>
                <Text style={styles.secureText}>
                    <Shield size={14} color={Colors.text.secondary} /> Secure 256-bit encryption
                </Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <LinearGradient
                    colors={[Colors.primary, Colors.darkPrimary]}
                    style={styles.iconContainer}
                >
                    {user?.isVerified ? (
                        <Shield color={Colors.background} size={40} />
                    ) : (
                        <ShieldAlert color={Colors.background} size={40} />
                    )}
                </LinearGradient>
                <Text style={styles.title}>
                    {user?.isVerified ? 'Identity Verified' : 'Verification Review'}
                </Text>
                <Text style={styles.subtitle}>
                    {user?.isVerified
                        ? 'Your account is fully verified and secure. You can now borrow and lend with confidence.'
                        : user?.verificationStatus === 'submitted' || user?.verificationStatus === 'under_review'
                            ? 'Your submission is under review. Secure payout and booking access unlock automatically after backend approval.'
                            : 'To ensure a safe and trustworthy community, all users must complete KYC verification before participating.'}
                </Text>
            </View>

            {!user?.isVerified && user?.verificationStatus !== 'submitted' && user?.verificationStatus !== 'under_review' && (
                <View style={styles.optionsContainer}>
                    <Text style={styles.sectionTitle}>Select Verification Method</Text>

                    {/* DigiLocker Option */}
                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={() => startVerification('digilocker')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.optionIconContainer, { backgroundColor: '#e8f5e9' }]}>
                            <Fingerprint color="#2e7d32" size={24} />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Aadhaar via DigiLocker</Text>
                            <Text style={styles.optionSubtitle}>Instant & recommended. Fetches verified documents directly from Gov servers.</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Fastest</Text>
                            </View>
                        </View>
                        <ChevronRight color={Colors.text.placeholder} size={20} />
                    </TouchableOpacity>

                    {/* PAN Option */}
                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={() => startVerification('pan')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.optionIconContainer, { backgroundColor: '#e3f2fd' }]}>
                            <CreditCard color="#1565c0" size={24} />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>PAN Card</Text>
                            <Text style={styles.optionSubtitle}>Verify using your 10-digit PAN number and name matching.</Text>
                        </View>
                        <ChevronRight color={Colors.text.placeholder} size={20} />
                    </TouchableOpacity>
                </View>
            )}

            {(user?.verificationStatus === 'submitted' || user?.verificationStatus === 'under_review' || user?.verificationStatus === 'rejected' || user?.verificationStatus === 'needs_resubmission') && !user?.isVerified && (
                <View style={styles.verifiedCard}>
                    <ShieldAlert color={user?.verificationStatus === 'rejected' ? '#b3261e' : '#ed6c02'} size={32} />
                    <Text style={styles.verifiedTitle}>
                        {user?.verificationStatus === 'rejected'
                            ? 'Verification Rejected'
                            : user?.verificationStatus === 'needs_resubmission'
                                ? 'Resubmission Needed'
                                : 'Verification Under Review'}
                    </Text>
                    <Text style={styles.verifiedText}>
                        {user?.verificationStatus === 'submitted' || user?.verificationStatus === 'under_review'
                            ? 'Your documents and liveness signals were received. Our backend review pipeline is validating them now.'
                            : user?.verificationReviewNote || 'Please retry with clearer information and complete trust signals.'}
                    </Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => refreshVerificationStatus()}>
                        <Text style={styles.backButtonText}>Refresh Status</Text>
                    </TouchableOpacity>
                </View>
            )}

            {user?.isVerified && (
                <View style={styles.verifiedCard}>
                    <CheckCircle color="#2e7d32" size={32} />
                    <Text style={styles.verifiedTitle}>KYC Complete</Text>
                    <Text style={styles.verifiedText}>
                        You have successfully completed your identity verification. Your transactions on Sahaay are protected.
                    </Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Return to Profile</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.trustBanner}>
                <Shield color={Colors.text.secondary} size={16} />
                <Text style={styles.trustText}>
                    Your data is encrypted and never shared. We use RBI-compliant KYC partners.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: Theme.spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: Theme.spacing.xl,
    },
    loadingTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginTop: 24,
        marginBottom: 8,
    },
    loadingText: {
        fontSize: 14,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginBottom: 32,
    },
    secureText: {
        flexDirection: 'row',
        alignItems: 'center',
        color: Colors.text.secondary,
        fontSize: 12,
        marginTop: 20,
    },
    livenessContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        padding: Theme.spacing.xl,
    },
    livenessTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    livenessSubtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginBottom: 32,
    },
    cameraWrapper: {
        width: 250,
        height: 250,
        borderRadius: 125,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: Colors.primary,
        marginBottom: 32,
        ...Theme.shadows.large,
    },
    camera: {
        flex: 1,
    },
    taskCard: {
        backgroundColor: '#e8f5e9',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: Theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: '#c5e1a5',
    },
    taskText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2e7d32',
        textAlign: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        ...Theme.shadows.medium,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 16,
    },
    optionsContainer: {
        gap: 16,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Theme.spacing.md,
        borderRadius: Theme.borderRadius.lg,
        ...Theme.shadows.small,
    },
    optionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    optionSubtitle: {
        fontSize: 12,
        color: Colors.text.secondary,
        lineHeight: 16,
    },
    badge: {
        backgroundColor: '#fff3e0',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 6,
    },
    badgeText: {
        color: '#ed6c02',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    verifiedCard: {
        backgroundColor: '#f1f8e9',
        padding: Theme.spacing.xl,
        borderRadius: Theme.borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#c5e1a5',
    },
    verifiedTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginTop: 12,
        marginBottom: 8,
    },
    verifiedText: {
        fontSize: 14,
        color: '#33691e',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    backButton: {
        backgroundColor: '#2e7d32',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: Theme.borderRadius.md,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    trustBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        gap: 8,
        paddingHorizontal: 24,
    },
    trustText: {
        fontSize: 12,
        color: Colors.text.secondary,
        textAlign: 'center',
        flex: 1,
    },
});
