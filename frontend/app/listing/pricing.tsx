import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Wallet } from 'lucide-react-native';
import { useAppTheme } from '../../src/theme/provider';
import { useListingDraftStore } from '../../src/features/listings/store/useListingDraftStore';
import { useAnalyzeListingDraft } from '../../src/entities/listing/api';

export default function ListingPricingScreen() {
    const router = useRouter();
    const { theme } = useAppTheme();
    const styles = createStyles(theme);
    const draft = useListingDraftStore();
    const pricePerDay = Number(draft.pricePerDay || 0);
    const deposit = Number(draft.deposit || 0);
    const analysisQuery = useAnalyzeListingDraft({
        title: draft.title,
        description: draft.description,
        category: draft.category,
        condition: draft.condition,
        pricePerDay,
        deposit,
        radiusKm: draft.radiusKm,
        payoutMethod: draft.payoutMethod,
        location: draft.location || undefined,
        images: draft.images,
    }, Boolean(draft.title || pricePerDay || deposit));

    const economics = useMemo(() => {
        const platformFee = Math.round(pricePerDay * 0.1);
        const lenderNet = Math.max(0, pricePerDay - platformFee);

        return {
            platformFee,
            lenderNet,
            deposit,
        };
    }, [deposit, pricePerDay]);

    const goNext = () => {
        if (!pricePerDay || pricePerDay <= 0) {
            Alert.alert('Pricing missing', 'Set a valid daily price before moving to review.');
            return;
        }

        router.push('/listing/review' as never);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.hero}>
                <Text style={styles.eyebrow}>90 / 10 Earnings Engine</Text>
                <Text style={styles.title}>Transparent pricing builds trust and repeat demand.</Text>
                <Text style={styles.subtitle}>
                    Borrowers should understand the price instantly. Lenders should see their net at a glance.
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Set your economics</Text>

                <Text style={styles.label}>Price per day</Text>
                <TextInput
                    value={draft.pricePerDay}
                    onChangeText={(value) => draft.setField('pricePerDay', value.replace(/[^0-9]/g, ''))}
                    placeholder="650"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="number-pad"
                    style={styles.input}
                />

                <Text style={styles.label}>Security deposit</Text>
                <TextInput
                    value={draft.deposit}
                    onChangeText={(value) => draft.setField('deposit', value.replace(/[^0-9]/g, ''))}
                    placeholder="2500"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="number-pad"
                    style={styles.input}
                />

                <Text style={styles.label}>Payout method</Text>
                <View style={styles.payoutRow}>
                    {(['upi', 'bank'] as const).map((method) => {
                        const active = draft.payoutMethod === method;
                        return (
                            <TouchableOpacity
                                key={method}
                                style={[styles.payoutChip, active && styles.payoutChipActive]}
                                onPress={() => draft.setField('payoutMethod', method)}
                            >
                                <Text style={[styles.payoutChipText, active && styles.payoutChipTextActive]}>
                                    {method.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={styles.revenueCard}>
                <View style={styles.revenueHeader}>
                    <Wallet size={18} color={theme.colors.accentStrong} />
                    <Text style={styles.revenueTitle}>Daily earnings preview</Text>
                </View>

                <View style={styles.moneyRow}>
                    <Text style={styles.moneyLabel}>Borrower pays</Text>
                    <Text style={styles.moneyValue}>₹{pricePerDay || 0}</Text>
                </View>
                <View style={styles.moneyRow}>
                    <Text style={styles.moneyLabel}>Platform fee (10%)</Text>
                    <Text style={styles.moneyValue}>₹{economics.platformFee}</Text>
                </View>
                <View style={styles.moneyRow}>
                    <Text style={styles.moneyLabel}>Your net (90%)</Text>
                    <Text style={styles.moneyValueStrong}>₹{economics.lenderNet}</Text>
                </View>
                <View style={styles.moneyRow}>
                    <Text style={styles.moneyLabel}>Refundable deposit</Text>
                    <Text style={styles.moneyValue}>₹{economics.deposit}</Text>
                </View>
                {analysisQuery.data && (
                    <>
                        <View style={styles.moneyRow}>
                            <Text style={styles.moneyLabel}>AI suggested price</Text>
                            <Text style={styles.moneyValue}>₹{analysisQuery.data.suggestedPricePerDay ?? pricePerDay}</Text>
                        </View>
                        <View style={styles.moneyRow}>
                            <Text style={styles.moneyLabel}>AI suggested deposit</Text>
                            <Text style={styles.moneyValue}>₹{analysisQuery.data.suggestedDeposit ?? deposit}</Text>
                        </View>
                    </>
                )}
            </View>

            <TouchableOpacity style={styles.cta} onPress={goNext}>
                <Text style={styles.ctaText}>Next: Review & Publish</Text>
                <ChevronRight size={18} color="#181411" />
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
        card: {
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
            ...theme.shadows.soft,
        },
        sectionTitle: {
            color: theme.colors.textPrimary,
            fontSize: 18,
            fontWeight: '700',
            marginBottom: theme.spacing.sm,
        },
        label: {
            color: theme.colors.bhasm,
            fontSize: 12,
            fontWeight: '700',
            textTransform: 'uppercase',
            marginTop: theme.spacing.sm,
            marginBottom: 8,
            letterSpacing: 0.6,
        },
        input: {
            backgroundColor: theme.colors.surfaceElevated,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: 14,
            color: theme.colors.textPrimary,
            fontSize: 15,
        },
        payoutRow: {
            flexDirection: 'row',
            gap: 10,
        },
        payoutChip: {
            flex: 1,
            paddingVertical: 14,
            alignItems: 'center',
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceAlt,
        },
        payoutChipActive: {
            backgroundColor: theme.colors.accent,
            borderColor: theme.colors.accent,
        },
        payoutChipText: {
            color: theme.colors.textPrimary,
            fontWeight: '700',
        },
        payoutChipTextActive: {
            color: '#181411',
        },
        revenueCard: {
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.borderStrong,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
            ...theme.shadows.medium,
        },
        revenueHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: theme.spacing.md,
        },
        revenueTitle: {
            color: theme.colors.textPrimary,
            fontSize: 18,
            fontWeight: '800',
        },
        moneyRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        moneyLabel: {
            color: theme.colors.textSecondary,
            fontSize: 14,
        },
        moneyValue: {
            color: theme.colors.textPrimary,
            fontWeight: '700',
        },
        moneyValueStrong: {
            color: theme.colors.accentStrong,
            fontWeight: '800',
            fontSize: 16,
        },
        cta: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: theme.colors.accent,
            borderRadius: theme.radius.lg,
            paddingVertical: 18,
            ...theme.shadows.medium,
        },
        ctaText: {
            color: '#181411',
            fontSize: 16,
            fontWeight: '800',
        },
    });
