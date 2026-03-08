import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, RotateCcw, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../src/theme/provider';
import { useAuth } from '../../src/context/AuthContext';
import { useOpsCopilotSummary, useReviewVerificationCase, useVerificationReviewQueue } from '../../src/features/support/api';
import { trackMarketplaceEvent } from '../../src/services/analytics';
import { Routes } from '../../src/types/navigation';

type ReviewDecision = 'approved' | 'rejected' | 'needs_resubmission';

export default function AdminReviewsScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { theme } = useAppTheme();
    const styles = createStyles(theme);
    const { user } = useAuth();
    const [notes, setNotes] = useState<Record<string, string>>({});
    const queueQuery = useVerificationReviewQueue(user?.role === 'admin', 50);
    const opsQuery = useOpsCopilotSummary(user?.role === 'admin');
    const reviewMutation = useReviewVerificationCase();

    const queueItems = React.useMemo(() => queueQuery.data?.items ?? [], [queueQuery.data]);
    const metrics = useMemo(() => {
        const submitted = queueItems.filter((item) => item.status === 'submitted').length;
        const underReview = queueItems.filter((item) => item.status === 'under_review').length;
        const resubmit = queueItems.filter((item) => item.status === 'needs_resubmission').length;
        return { submitted, underReview, resubmit, total: queueItems.length };
    }, [queueItems]);

    if (user?.role !== 'admin') {
        return (
            <View style={styles.emptyState}>
                <ShieldAlert size={28} color={theme.colors.danger} />
                <Text style={styles.emptyTitle}>Admin access required</Text>
                <Text style={styles.emptyBody}>This review console is only available to trusted Sahaay operators.</Text>
                <TouchableOpacity style={styles.primaryCta} onPress={() => router.replace(Routes.App.Profile)}>
                    <Text style={styles.primaryCtaText}>Back to profile</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleDecision = async (userId: string, decision: ReviewDecision) => {
        const reviewNote = (notes[userId] || '').trim();
        if (reviewNote.length < 3) {
            Alert.alert('Review note required', 'Add a short operator note before submitting a decision.');
            return;
        }

        await reviewMutation.mutateAsync({ userId, decision, reviewNote });
        trackMarketplaceEvent({
            name: 'admin_verification_reviewed',
            entityId: userId,
            entityType: 'verification',
            metadata: { decision },
        });
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['verification-review-queue'] }),
            queryClient.invalidateQueries({ queryKey: ['ops-copilot-summary'] }),
        ]);
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={queueQuery.isRefetching || opsQuery.isRefetching} onRefresh={() => {
                queueQuery.refetch();
                opsQuery.refetch();
            }} />}
        >
            <View style={styles.hero}>
                <ShieldCheck size={22} color={theme.colors.accentStrong} />
                <Text style={styles.title}>Verification Review Console</Text>
                <Text style={styles.subtitle}>
                    Premium operator surface for payout-critical identity decisions.
                </Text>
            </View>

            <View style={styles.metricRow}>
                <MetricCard label="Queue" value={String(metrics.total)} styles={styles} />
                <MetricCard label="Fresh" value={String(metrics.submitted)} styles={styles} />
                <MetricCard label="Resubmit" value={String(metrics.resubmit)} styles={styles} />
            </View>

            {opsQuery.data && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Ops copilot brief</Text>
                    <Text style={styles.cardBody}>{opsQuery.data.summary}</Text>
                </View>
            )}

            {queueQuery.isLoading ? (
                <View style={styles.emptyState}>
                    <ActivityIndicator size="large" color={theme.colors.accentStrong} />
                </View>
            ) : queueItems.length === 0 ? (
                <View style={styles.emptyState}>
                    <ShieldCheck size={28} color={theme.colors.success} />
                    <Text style={styles.emptyTitle}>Queue clear</Text>
                    <Text style={styles.emptyBody}>No verification cases are waiting on operator action right now.</Text>
                </View>
            ) : (
                queueItems.map((item) => (
                    <View key={item.userId} style={styles.caseCard}>
                        <View style={styles.caseHeader}>
                            <View>
                                <Text style={styles.caseName}>{item.name}</Text>
                                <Text style={styles.caseMeta}>{item.phone || 'Phone unavailable'} · {item.method?.toUpperCase() || 'UNKNOWN'}</Text>
                            </View>
                            <View style={styles.statusPill}>
                                <Text style={styles.statusPillText}>{humanizeStatus(item.status)}</Text>
                            </View>
                        </View>

                        <View style={styles.signalRow}>
                            <Text style={styles.signalLabel}>Liveness confidence</Text>
                            <Text style={styles.signalValue}>
                                {typeof item.livenessConfidence === 'number' ? `${Math.round(item.livenessConfidence * 100)}%` : 'N/A'}
                            </Text>
                        </View>
                        <View style={styles.signalRow}>
                            <Text style={styles.signalLabel}>Submitted</Text>
                            <Text style={styles.signalValue}>{formatTimestamp(item.submittedAt)}</Text>
                        </View>
                        {!!item.reviewNote && (
                            <View style={styles.reviewNoteBox}>
                                <Text style={styles.signalLabel}>Latest note</Text>
                                <Text style={styles.cardBody}>{item.reviewNote}</Text>
                            </View>
                        )}

                        <TextInput
                            value={notes[item.userId] ?? item.reviewNote ?? ''}
                            onChangeText={(value) => setNotes((prev) => ({ ...prev, [item.userId]: value }))}
                            style={styles.noteInput}
                            multiline
                            placeholder="Operator note: approval rationale, mismatch reason, or resubmission guidance."
                            placeholderTextColor={theme.colors.textMuted}
                        />

                        <View style={styles.actionRow}>
                            <DecisionButton
                                label="Approve"
                                icon={<CheckCircle2 size={16} color="#181411" />}
                                variant="gold"
                                onPress={() => handleDecision(item.userId, 'approved')}
                                disabled={reviewMutation.isPending}
                                styles={styles}
                            />
                            <DecisionButton
                                label="Resubmit"
                                icon={<RotateCcw size={16} color={theme.colors.textPrimary} />}
                                variant="neutral"
                                onPress={() => handleDecision(item.userId, 'needs_resubmission')}
                                disabled={reviewMutation.isPending}
                                styles={styles}
                            />
                            <DecisionButton
                                label="Reject"
                                icon={<XCircle size={16} color="#fff" />}
                                variant="danger"
                                onPress={() => handleDecision(item.userId, 'rejected')}
                                disabled={reviewMutation.isPending}
                                styles={styles}
                            />
                        </View>
                    </View>
                ))
            )}
        </ScrollView>
    );
}

function MetricCard({
    label,
    value,
    styles,
}: {
    label: string;
    value: string;
    styles: ReturnType<typeof createStyles>;
}) {
    return (
        <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{value}</Text>
            <Text style={styles.metricLabel}>{label}</Text>
        </View>
    );
}

function DecisionButton({
    label,
    icon,
    variant,
    onPress,
    disabled,
    styles,
}: {
    label: string;
    icon: React.ReactNode;
    variant: 'gold' | 'neutral' | 'danger';
    onPress: () => void;
    disabled?: boolean;
    styles: ReturnType<typeof createStyles>;
}) {
    const variantStyle = variant === 'gold'
        ? styles.actionApprove
        : variant === 'danger'
            ? styles.actionReject
            : styles.actionNeutral;
    const textStyle = variant === 'gold'
        ? styles.actionApproveText
        : variant === 'danger'
            ? styles.actionRejectText
            : styles.actionNeutralText;

    return (
        <TouchableOpacity style={[styles.actionButton, variantStyle, disabled && styles.actionDisabled]} onPress={onPress} disabled={disabled}>
            {icon}
            <Text style={textStyle}>{label}</Text>
        </TouchableOpacity>
    );
}

function humanizeStatus(status: string) {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatTimestamp(value: number | null) {
    if (!value) {
        return 'Just now';
    }

    return new Date(value).toLocaleString();
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) => StyleSheet.create({
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
        gap: 10,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.surfaceAlt,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    title: {
        color: theme.colors.textPrimary,
        fontSize: theme.typography.title.fontSize,
        fontWeight: theme.typography.title.fontWeight,
    },
    subtitle: {
        color: theme.colors.textSecondary,
        lineHeight: 22,
    },
    metricRow: {
        flexDirection: 'row',
        gap: 10,
    },
    metricCard: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        ...theme.shadows.soft,
    },
    metricValue: {
        color: theme.colors.accentStrong,
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 4,
    },
    metricLabel: {
        color: theme.colors.textSecondary,
        fontWeight: '700',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        ...theme.shadows.soft,
    },
    cardTitle: {
        color: theme.colors.textPrimary,
        fontWeight: '800',
        marginBottom: 8,
    },
    cardBody: {
        color: theme.colors.textSecondary,
        lineHeight: 21,
    },
    caseCard: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderStrong,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        ...theme.shadows.soft,
        gap: 12,
    },
    caseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        alignItems: 'flex-start',
    },
    caseName: {
        color: theme.colors.textPrimary,
        fontWeight: '800',
        fontSize: 16,
    },
    caseMeta: {
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    statusPill: {
        borderRadius: theme.radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 7,
        backgroundColor: theme.colors.surfaceAlt,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    statusPillText: {
        color: theme.colors.accentStrong,
        fontWeight: '800',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    signalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    signalLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    signalValue: {
        color: theme.colors.textPrimary,
        fontWeight: '700',
    },
    reviewNoteBox: {
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceAlt,
        padding: theme.spacing.md,
    },
    noteInput: {
        minHeight: 96,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        color: theme.colors.textPrimary,
        backgroundColor: theme.colors.surfaceElevated,
        textAlignVertical: 'top',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        borderRadius: theme.radius.md,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    actionApprove: {
        backgroundColor: theme.colors.accent,
    },
    actionApproveText: {
        color: '#181411',
        fontWeight: '800',
    },
    actionNeutral: {
        backgroundColor: theme.colors.surfaceAlt,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    actionNeutralText: {
        color: theme.colors.textPrimary,
        fontWeight: '800',
    },
    actionReject: {
        backgroundColor: theme.colors.danger,
    },
    actionRejectText: {
        color: '#fff',
        fontWeight: '800',
    },
    actionDisabled: {
        opacity: 0.6,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
        gap: 10,
    },
    emptyTitle: {
        color: theme.colors.textPrimary,
        fontSize: 18,
        fontWeight: '800',
    },
    emptyBody: {
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    primaryCta: {
        marginTop: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.accent,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    primaryCtaText: {
        color: '#181411',
        fontWeight: '800',
    },
});
