import React, { useMemo } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, Coins, MapPin, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useAppTheme } from '../../src/theme/provider';
import { useListingDraftStore } from '../../src/features/listings/store/useListingDraftStore';
import { saveLocalPublishedListing } from '../../src/features/listings/storage';
import { createListingRemote, useAnalyzeListingDraft } from '../../src/entities/listing/api';
import { trackMarketplaceEvent } from '../../src/services/analytics';
import { Routes } from '../../src/types/navigation';

export default function ListingReviewScreen() {
    const router = useRouter();
    const { identityGate, logout } = useAuth();
    const { theme } = useAppTheme();
    const styles = createStyles(theme);
    const draft = useListingDraftStore();
    const analysisQuery = useAnalyzeListingDraft({
        title: draft.title.trim(),
        description: draft.description.trim(),
        category: draft.category,
        condition: draft.condition,
        images: draft.images,
        pricePerDay: Number(draft.pricePerDay || 0),
        deposit: Number(draft.deposit || 0),
        radiusKm: draft.radiusKm,
        payoutMethod: draft.payoutMethod,
        location: draft.location || undefined,
    }, true);

    const economics = useMemo(() => {
        const pricePerDay = Number(draft.pricePerDay || 0);
        const deposit = Number(draft.deposit || 0);
        const platformFee = Math.round(pricePerDay * 0.1);
        const lenderNet = Math.max(0, pricePerDay - platformFee);

        return { pricePerDay, deposit, platformFee, lenderNet };
    }, [draft.deposit, draft.pricePerDay]);

    const publishListing = async () => {
        if (!identityGate.canUsePayoutFlows) {
            if (identityGate.isAnonymousSession) {
                Alert.alert(
                    'Secure phone sign-in required',
                    identityGate.reason || 'Demo sessions cannot publish listings.',
                    [
                        { text: 'Not now', style: 'cancel' },
                        {
                            text: 'Sign out and continue',
                            onPress: async () => {
                                await logout();
                                router.replace(Routes.Auth.Login);
                            },
                        },
                    ]
                );
                return;
            }

            Alert.alert(
                'KYC required',
                identityGate.reason || 'Complete KYC verification before publishing listings.',
                [
                    { text: 'Later', style: 'cancel' },
                    { text: 'Verify now', onPress: () => router.push(Routes.Auth.Verification) },
                ]
            );
            return;
        }

        if (!draft.location) {
            Alert.alert('Location missing', 'Add a valid listing location before publishing.');
            return;
        }

        try {
            const remoteItem = await createListingRemote({
                title: draft.title.trim(),
                description: draft.description.trim(),
                category: draft.category,
                condition: draft.condition,
                images: draft.images,
                pricePerDay: economics.pricePerDay,
                deposit: economics.deposit,
                radiusKm: draft.radiusKm,
                payoutMethod: draft.payoutMethod,
                location: draft.location,
            });

            await saveLocalPublishedListing(remoteItem);
            draft.reset();
            trackMarketplaceEvent({
                name: 'listing_published',
                entityId: remoteItem.id,
                entityType: 'item',
                metadata: { pricePerDay: remoteItem.pricePerDay, category: remoteItem.category },
            });

            Alert.alert('Listing published', 'Your verified listing is now ready to appear in nearby discovery.');
            router.replace('/(tabs)' as never);
        } catch (error) {
            console.warn('Secure listing publish failed.', error);
            Alert.alert(
                'Secure publish unavailable',
                'We could not verify this listing against the backend right now. Your draft is still here, but it will not go live until the secure publish succeeds.'
            );
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.hero}>
                <Text style={styles.eyebrow}>Final Review</Text>
                <Text style={styles.title}>Your listing is almost ready to earn.</Text>
                <Text style={styles.subtitle}>
                    Review the presentation, radius, and 90/10 payout before going live.
                </Text>
            </View>

            <View style={styles.previewCard}>
                {draft.images[0] ? <Image source={{ uri: draft.images[0] }} style={styles.previewImage} /> : null}
                <View style={styles.previewContent}>
                    <Text style={styles.previewTitle}>{draft.title || 'Untitled listing'}</Text>
                    <Text style={styles.previewSubtitle}>
                        {draft.category} · {draft.condition}
                    </Text>
                    <Text style={styles.previewBody} numberOfLines={3}>
                        {draft.description}
                    </Text>
                </View>
            </View>

            <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                    <MapPin size={16} color={theme.colors.accentStrong} />
                    <Text style={styles.detailLabel}>Area</Text>
                    <Text style={styles.detailValue}>
                        {draft.location ? `${draft.location.locality}, ${draft.location.city}` : 'Not set'}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <ShieldCheck size={16} color={theme.colors.accentStrong} />
                    <Text style={styles.detailLabel}>Visibility</Text>
                    <Text style={styles.detailValue}>{draft.radiusKm} km radius</Text>
                </View>

                <View style={styles.detailRow}>
                    <Coins size={16} color={theme.colors.accentStrong} />
                    <Text style={styles.detailLabel}>Your daily net</Text>
                    <Text style={styles.detailValueStrong}>₹{economics.lenderNet}</Text>
                </View>

                <View style={styles.detailRow}>
                    <CheckCircle2 size={16} color={theme.colors.accentStrong} />
                    <Text style={styles.detailLabel}>Platform fee</Text>
                    <Text style={styles.detailValue}>₹{economics.platformFee}</Text>
                </View>
                {analysisQuery.data && (
                    <>
                        <View style={styles.detailRow}>
                            <ShieldCheck size={16} color={theme.colors.accentStrong} />
                            <Text style={styles.detailLabel}>AI readiness score</Text>
                            <Text style={styles.detailValueStrong}>{analysisQuery.data.readinessScore}/100</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <ShieldCheck size={16} color={theme.colors.accentStrong} />
                            <Text style={styles.detailLabel}>AI publish note</Text>
                            <Text style={styles.detailValue}>{analysisQuery.data.readinessSummary}</Text>
                        </View>
                    </>
                )}
            </View>

            <TouchableOpacity
                style={[styles.cta, !identityGate.canUsePayoutFlows && styles.ctaDisabled]}
                onPress={publishListing}
            >
                <Text style={styles.ctaText}>
                    {identityGate.canUsePayoutFlows ? 'Publish premium listing' : 'Verification required to publish'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        content: {
            padding: theme.spacing.md,
            paddingBottom: theme.spacing.xxl,
            gap: theme.spacing.md,
        },
        hero: {
            backgroundColor: theme.colors.surfaceAlt,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.xl,
            padding: theme.spacing.lg,
        },
        eyebrow: {
            color: theme.colors.accentStrong,
            fontSize: 12,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 10,
        },
        title: {
            color: theme.colors.textPrimary,
            fontSize: theme.typography.title.fontSize,
            fontWeight: theme.typography.title.fontWeight,
            marginBottom: 10,
        },
        subtitle: {
            color: theme.colors.textSecondary,
            lineHeight: 22,
        },
        previewCard: {
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
            overflow: 'hidden',
            ...theme.shadows.soft,
        },
        previewImage: {
            width: '100%',
            height: 220,
        },
        previewContent: {
            padding: theme.spacing.md,
        },
        previewTitle: {
            color: theme.colors.textPrimary,
            fontSize: 22,
            fontWeight: '800',
            marginBottom: 4,
        },
        previewSubtitle: {
            color: theme.colors.accentStrong,
            fontWeight: '700',
            marginBottom: 8,
        },
        previewBody: {
            color: theme.colors.textSecondary,
            lineHeight: 21,
        },
        detailCard: {
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.borderStrong,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
            ...theme.shadows.medium,
            gap: 14,
        },
        detailRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        },
        detailLabel: {
            flex: 1,
            color: theme.colors.textSecondary,
        },
        detailValue: {
            color: theme.colors.textPrimary,
            fontWeight: '700',
        },
        detailValueStrong: {
            color: theme.colors.accentStrong,
            fontWeight: '800',
        },
        cta: {
            backgroundColor: theme.colors.accent,
            borderRadius: theme.radius.lg,
            paddingVertical: 18,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadows.medium,
        },
        ctaDisabled: {
            opacity: 0.75,
        },
        ctaText: {
            color: '#181411',
            fontSize: 16,
            fontWeight: '800',
        },
    });
