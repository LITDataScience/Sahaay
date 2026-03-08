import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronRight, ImagePlus, Package2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../src/theme/provider';
import { LISTING_CATEGORIES, LISTING_CONDITIONS } from '../../src/features/listings/types';
import { useListingDraftStore } from '../../src/features/listings/store/useListingDraftStore';
import { useAnalyzeListingDraft } from '../../src/entities/listing/api';
import { trackMarketplaceEvent } from '../../src/services/analytics';

export default function CreateListingFlowScreen() {
    const router = useRouter();
    const { theme } = useAppTheme();
    const styles = createStyles(theme);
    const draft = useListingDraftStore();
    const analysisQuery = useAnalyzeListingDraft({
        title: draft.title.trim(),
        description: draft.description.trim(),
        category: draft.category,
        condition: draft.condition,
        images: draft.images,
    }, Boolean(draft.title || draft.description || draft.images.length));

    React.useEffect(() => {
        trackMarketplaceEvent({
            name: 'listing_draft_started',
            entityType: 'listing_draft',
            metadata: { stage: 'create' },
        });
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.9,
            selectionLimit: 4,
        });

        if (result.canceled) {
            return;
        }

        result.assets.forEach((asset) => {
            if (asset.uri) {
                draft.addImage(asset.uri);
            }
        });
    };

    const goNext = () => {
        if (!draft.title.trim() || draft.description.trim().length < 20 || draft.images.length === 0) {
            Alert.alert('Finish the basics', 'Add at least one photo, a title, and a description of 20+ characters.');
            return;
        }

        router.push('/listing/location' as never);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <LinearGradient colors={[theme.colors.surfaceAlt, theme.colors.background]} style={styles.hero}>
                <Text style={styles.eyebrow}>Luxury Listing Studio</Text>
                <Text style={styles.title}>Make your item look irresistible.</Text>
                <Text style={styles.subtitle}>
                    High-trust visuals, tight details, and premium presentation increase bookings and earnings.
                </Text>
            </LinearGradient>

            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Photos</Text>
                    <TouchableOpacity style={styles.inlineAction} onPress={pickImage}>
                        <ImagePlus size={16} color={theme.colors.accentStrong} />
                        <Text style={styles.inlineActionText}>Add images</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.imageGrid}>
                    {draft.images.map((uri) => (
                        <TouchableOpacity key={uri} onPress={() => draft.removeImage(uri)} style={styles.imageTile}>
                            <Image source={{ uri }} style={styles.image} />
                        </TouchableOpacity>
                    ))}

                    {draft.images.length < 4 && (
                        <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
                            <Camera size={18} color={theme.colors.textSecondary} />
                            <Text style={styles.imagePlaceholderText}>Add</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Core details</Text>

                <Text style={styles.label}>Title</Text>
                <TextInput
                    value={draft.title}
                    onChangeText={(value) => draft.setField('title', value)}
                    placeholder="Eg. Bosch Hammer Drill"
                    placeholderTextColor={theme.colors.textMuted}
                    style={styles.input}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                    value={draft.description}
                    onChangeText={(value) => draft.setField('description', value)}
                    placeholder="What makes it worth borrowing? Mention condition, use cases, accessories, and trust cues."
                    placeholderTextColor={theme.colors.textMuted}
                    style={[styles.input, styles.textArea]}
                    multiline
                    textAlignVertical="top"
                />

                <Text style={styles.label}>Category</Text>
                <View style={styles.choiceWrap}>
                    {LISTING_CATEGORIES.map((category) => {
                        const active = draft.category === category;
                        return (
                            <TouchableOpacity
                                key={category}
                                style={[styles.choiceChip, active && styles.choiceChipActive]}
                                onPress={() => draft.setField('category', category)}
                            >
                                <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{category}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.label}>Condition</Text>
                <View style={styles.choiceWrap}>
                    {LISTING_CONDITIONS.map((condition) => {
                        const active = draft.condition === condition;
                        return (
                            <TouchableOpacity
                                key={condition}
                                style={[styles.choiceChip, active && styles.choiceChipActive]}
                                onPress={() => draft.setField('condition', condition)}
                            >
                                <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
                                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={styles.previewCard}>
                <Package2 size={18} color={theme.colors.accentStrong} />
                <View style={styles.previewCopy}>
                    <Text style={styles.previewTitle}>Premium listing rule</Text>
                    <Text style={styles.previewBody}>
                        Clean title, strong photos, and exact locality signal trust faster than discounts.
                    </Text>
                </View>
            </View>

            {analysisQuery.data && (
                <View style={styles.previewCard}>
                    <Package2 size={18} color={theme.colors.accentStrong} />
                    <View style={styles.previewCopy}>
                        <Text style={styles.previewTitle}>AI polish</Text>
                        <Text style={styles.previewBody}>Readiness score: {analysisQuery.data.readinessScore}/100</Text>
                        <Text style={styles.previewBody}>
                            Suggested title: {analysisQuery.data.titleSuggestions[0] || 'Keep your current title'}
                        </Text>
                        <Text style={styles.previewBody}>
                            Suggested category: {analysisQuery.data.suggestedCategory || draft.category}
                        </Text>
                    </View>
                </View>
            )}

            <TouchableOpacity style={styles.cta} onPress={goNext}>
                <Text style={styles.ctaText}>Next: Location & Radius</Text>
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
            borderRadius: theme.radius.xl,
            padding: theme.spacing.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
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
            fontSize: 15,
            lineHeight: 22,
        },
        card: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadows.soft,
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.spacing.sm,
        },
        sectionTitle: {
            color: theme.colors.textPrimary,
            fontSize: 18,
            fontWeight: '700',
        },
        inlineAction: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        inlineActionText: {
            color: theme.colors.accentStrong,
            fontWeight: '700',
        },
        imageGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.spacing.sm,
        },
        imageTile: {
            width: 88,
            height: 88,
            borderRadius: theme.radius.md,
            overflow: 'hidden',
        },
        image: {
            width: '100%',
            height: '100%',
        },
        imagePlaceholder: {
            width: 88,
            height: 88,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.borderStrong,
            backgroundColor: theme.colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
        },
        imagePlaceholderText: {
            color: theme.colors.textSecondary,
            fontWeight: '600',
        },
        label: {
            color: theme.colors.bhasm,
            fontSize: 12,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            marginTop: theme.spacing.md,
            marginBottom: 8,
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
        textArea: {
            minHeight: 120,
        },
        choiceWrap: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
        },
        choiceChip: {
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surfaceAlt,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        choiceChipActive: {
            backgroundColor: theme.colors.accent,
            borderColor: theme.colors.accent,
        },
        choiceText: {
            color: theme.colors.textPrimary,
            fontWeight: '600',
        },
        choiceTextActive: {
            color: '#181411',
        },
        previewCard: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 12,
            backgroundColor: theme.colors.surfaceAlt,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
        },
        previewCopy: {
            flex: 1,
        },
        previewTitle: {
            color: theme.colors.textPrimary,
            fontWeight: '700',
            marginBottom: 4,
        },
        previewBody: {
            color: theme.colors.textSecondary,
            lineHeight: 20,
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
