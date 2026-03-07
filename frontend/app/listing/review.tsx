import React, { useMemo } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, Coins, MapPin, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useAppTheme } from '../../src/theme/provider';
import { useListingDraftStore } from '../../src/features/listings/store/useListingDraftStore';
import { saveLocalPublishedListing } from '../../src/features/listings/storage';
import { createListingRemote } from '../../src/entities/listing/api';

export default function ListingReviewScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useAppTheme();
    const styles = createStyles(theme);
    const draft = useListingDraftStore();

    const economics = useMemo(() => {
        const pricePerDay = Number(draft.pricePerDay || 0);
        const deposit = Number(draft.deposit || 0);
        const platformFee = Math.round(pricePerDay * 0.1);
        const lenderNet = Math.max(0, pricePerDay - platformFee);

        return { pricePerDay, deposit, platformFee, lenderNet };
    }, [draft.deposit, draft.pricePerDay]);

    const publishListing = async () => {
        if (!draft.location) {
            Alert.alert('Location missing', 'Add a valid listing location before publishing.');
            return;
        }

        const baseListing = {
            title: draft.title.trim(),
            description: draft.description.trim(),
            category: draft.category,
            condition: draft.condition,
            image: draft.images[0],
            images: draft.images,
            price: economics.pricePerDay,
            pricePerDay: economics.pricePerDay,
            deposit: economics.deposit,
            radiusKm: draft.radiusKm,
            owner: user?.name || 'You',
            ownerId: user?.id || 'local-user',
            distance: `${draft.radiusKm} km visibility`,
            locality: draft.location.locality,
            city: draft.location.city,
            state: draft.location.state,
            payoutMethod: draft.payoutMethod,
            status: 'active' as const,
        };

        let publishedListing = {
            id: `local_${Date.now()}`,
            ...baseListing,
            createdAt: Date.now(),
        };

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

            publishedListing = {
                ...publishedListing,
                ...remoteItem,
                id: remoteItem.id,
            };
        } catch (error) {
            console.warn('Remote listing publish failed, preserving premium local-first publish.', error);
        }

        await saveLocalPublishedListing(publishedListing);
        draft.reset();

        Alert.alert('Listing published', 'Your item is now ready to appear in nearby discovery.');
        router.replace('/(tabs)' as never);
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
            </View>

            <TouchableOpacity style={styles.cta} onPress={publishListing}>
                <Text style={styles.ctaText}>Publish premium listing</Text>
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
        ctaText: {
            color: '#181411',
            fontSize: 16,
            fontWeight: '800',
        },
    });
