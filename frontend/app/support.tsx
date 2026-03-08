import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Sparkles, LifeBuoy } from 'lucide-react-native';
import { useAppTheme } from '../src/theme/provider';
import { useAskSupportCopilot } from '../src/features/support/api';
import { trackMarketplaceEvent } from '../src/services/analytics';

export default function SupportScreen() {
    const { theme } = useAppTheme();
    const styles = createStyles(theme);
    const [question, setQuestion] = useState('How does verification approval work for secure bookings?');
    const supportMutation = useAskSupportCopilot();

    const ask = async () => {
        const trimmed = question.trim();
        if (!trimmed) {
            return;
        }

        trackMarketplaceEvent({
            name: 'support_question_asked',
            entityType: 'support',
            metadata: { questionLength: trimmed.length },
        });
        await supportMutation.mutateAsync(trimmed);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.hero}>
                <LifeBuoy size={22} color={theme.colors.accentStrong} />
                <Text style={styles.title}>Sahaay Support Copilot</Text>
                <Text style={styles.subtitle}>
                    Grounded answers over Sahaay docs, booking logic, and verification flows.
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Ask a question</Text>
                <TextInput
                    value={question}
                    onChangeText={setQuestion}
                    multiline
                    style={styles.input}
                    placeholder="Why is my booking locked until verification is approved?"
                    placeholderTextColor={theme.colors.textMuted}
                />
                <TouchableOpacity style={styles.cta} onPress={ask} disabled={supportMutation.isPending}>
                    {supportMutation.isPending ? <ActivityIndicator color="#181411" /> : (
                        <>
                            <Sparkles size={16} color="#181411" />
                            <Text style={styles.ctaText}>Ask Copilot</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {supportMutation.data && (
                <View style={styles.card}>
                    <Text style={styles.answerTitle}>Answer</Text>
                    <Text style={styles.answerBody}>{supportMutation.data.answer}</Text>
                    {supportMutation.data.citations.map((citation) => (
                        <Text key={citation} style={styles.citation}>Source: {citation}</Text>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: theme.spacing.md,
        gap: theme.spacing.md,
        paddingBottom: theme.spacing.xxl,
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
    card: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        ...theme.shadows.soft,
    },
    label: {
        color: theme.colors.bhasm,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 10,
        letterSpacing: 0.6,
    },
    input: {
        minHeight: 120,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        color: theme.colors.textPrimary,
        backgroundColor: theme.colors.surfaceElevated,
        textAlignVertical: 'top',
    },
    cta: {
        marginTop: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.accent,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    ctaText: {
        color: '#181411',
        fontWeight: '800',
    },
    answerTitle: {
        color: theme.colors.textPrimary,
        fontWeight: '800',
        marginBottom: 10,
        fontSize: 16,
    },
    answerBody: {
        color: theme.colors.textSecondary,
        lineHeight: 22,
    },
    citation: {
        color: theme.colors.accentStrong,
        marginTop: 10,
        fontSize: 12,
        fontWeight: '700',
    },
});
