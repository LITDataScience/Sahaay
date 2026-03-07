import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { ChevronRight, LocateFixed, MapPin, ShieldEllipsis } from 'lucide-react-native';
import { useAppTheme } from '../../src/theme/provider';
import { LISTING_RADIUS_OPTIONS } from '../../src/features/listings/types';
import { useListingDraftStore } from '../../src/features/listings/store/useListingDraftStore';

export default function ListingLocationScreen() {
    const router = useRouter();
    const { theme } = useAppTheme();
    const styles = createStyles(theme);
    const draft = useListingDraftStore();
    const [manualLocality, setManualLocality] = useState(draft.location?.locality ?? '');
    const [manualCity, setManualCity] = useState(draft.location?.city ?? '');
    const [manualState, setManualState] = useState(draft.location?.state ?? '');

    const locationLabel = useMemo(() => {
        if (!draft.location) {
            return 'Not selected yet';
        }

        return [draft.location.locality, draft.location.city, draft.location.state].filter(Boolean).join(', ');
    }, [draft.location]);

    const useCurrentLocation = async () => {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
            Alert.alert('Location denied', 'Enable location to auto-fill the listing area and visibility radius.');
            return;
        }

        const current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        const places = await Location.reverseGeocodeAsync({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
        });

        const place = places[0];

        draft.setLocation({
            lat: current.coords.latitude,
            lng: current.coords.longitude,
            locality: place?.district || place?.subregion || place?.city || 'Your area',
            city: place?.city || place?.subregion || 'Unknown city',
            state: place?.region || 'Unknown state',
        });
    };

    const saveManualLocation = () => {
        if (!manualLocality.trim() || !manualCity.trim() || !manualState.trim()) {
            Alert.alert('Missing location', 'Enter locality, city, and state so the radius can be applied correctly.');
            return;
        }

        draft.setLocation({
            lat: draft.location?.lat ?? 0,
            lng: draft.location?.lng ?? 0,
            locality: manualLocality.trim(),
            city: manualCity.trim(),
            state: manualState.trim(),
        });
    };

    const goNext = () => {
        if (!draft.location) {
            saveManualLocation();
        }

        if (!useListingDraftStore.getState().location) {
            return;
        }

        router.push('/listing/pricing' as never);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.hero}>
                <Text style={styles.eyebrow}>Geo Visibility</Text>
                <Text style={styles.title}>Decide exactly who gets to see your item.</Text>
                <Text style={styles.subtitle}>
                    Precise locality and radius control keeps listings relevant, premium, and safe.
                </Text>
            </View>

            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Listing area</Text>
                    <TouchableOpacity style={styles.locationAction} onPress={useCurrentLocation}>
                        <LocateFixed size={16} color={theme.colors.accentStrong} />
                        <Text style={styles.locationActionText}>Use current location</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.locationPreview}>
                    <MapPin size={18} color={theme.colors.accentStrong} />
                    <Text style={styles.locationPreviewText}>{locationLabel}</Text>
                </View>

                <Text style={styles.label}>Locality</Text>
                <TextInput
                    value={manualLocality}
                    onChangeText={setManualLocality}
                    placeholder="Eg. Koramangala 5th Block"
                    placeholderTextColor={theme.colors.textMuted}
                    style={styles.input}
                />

                <Text style={styles.label}>City</Text>
                <TextInput
                    value={manualCity}
                    onChangeText={setManualCity}
                    placeholder="Eg. Bengaluru"
                    placeholderTextColor={theme.colors.textMuted}
                    style={styles.input}
                />

                <Text style={styles.label}>State</Text>
                <TextInput
                    value={manualState}
                    onChangeText={setManualState}
                    placeholder="Eg. Karnataka"
                    placeholderTextColor={theme.colors.textMuted}
                    style={styles.input}
                />

                <TouchableOpacity style={styles.secondaryButton} onPress={saveManualLocation}>
                    <Text style={styles.secondaryButtonText}>Save location details</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Visibility radius</Text>
                <Text style={styles.helperText}>
                    Only people inside this radius should discover the item in search and nearby feeds.
                </Text>

                <View style={styles.radiusGrid}>
                    {LISTING_RADIUS_OPTIONS.map((radius) => {
                        const active = draft.radiusKm === radius;
                        return (
                            <TouchableOpacity
                                key={radius}
                                style={[styles.radiusChip, active && styles.radiusChipActive]}
                                onPress={() => draft.setField('radiusKm', radius)}
                            >
                                <Text style={[styles.radiusChipText, active && styles.radiusChipTextActive]}>
                                    {radius} km
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={styles.noteCard}>
                <ShieldEllipsis size={18} color={theme.colors.accentStrong} />
                <View style={styles.noteCopy}>
                    <Text style={styles.noteTitle}>Why this matters</Text>
                    <Text style={styles.noteBody}>
                        Tight radius targeting improves conversion, reduces bad requests, and makes your listing feel exclusive.
                    </Text>
                </View>
            </View>

            <TouchableOpacity style={styles.cta} onPress={goNext}>
                <Text style={styles.ctaText}>Next: Pricing & Earnings</Text>
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
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.spacing.md,
        },
        sectionTitle: {
            color: theme.colors.textPrimary,
            fontSize: 18,
            fontWeight: '700',
        },
        locationAction: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        locationActionText: {
            color: theme.colors.accentStrong,
            fontWeight: '700',
        },
        locationPreview: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.sm,
        },
        locationPreviewText: {
            flex: 1,
            color: theme.colors.textPrimary,
            fontWeight: '600',
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
        },
        secondaryButton: {
            marginTop: theme.spacing.md,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.borderStrong,
            paddingVertical: 14,
            backgroundColor: theme.colors.surfaceAlt,
        },
        secondaryButtonText: {
            color: theme.colors.textPrimary,
            fontWeight: '700',
        },
        helperText: {
            color: theme.colors.textSecondary,
            lineHeight: 20,
            marginBottom: theme.spacing.md,
        },
        radiusGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
        },
        radiusChip: {
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surfaceAlt,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        radiusChipActive: {
            backgroundColor: theme.colors.accent,
            borderColor: theme.colors.accent,
        },
        radiusChipText: {
            color: theme.colors.textPrimary,
            fontWeight: '700',
        },
        radiusChipTextActive: {
            color: '#181411',
        },
        noteCard: {
            flexDirection: 'row',
            gap: 12,
            backgroundColor: theme.colors.surfaceAlt,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
        },
        noteCopy: {
            flex: 1,
        },
        noteTitle: {
            color: theme.colors.textPrimary,
            fontWeight: '700',
            marginBottom: 4,
        },
        noteBody: {
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
