// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Coins, MapPin, ShieldCheck } from 'lucide-react-native';
import { useAppTheme } from '../../src/theme/provider';
import { getLocalPublishedListings } from '../../src/features/listings/storage';

const CreateListingScreen = () => {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [listingCount, setListingCount] = useState(0);

  useEffect(() => {
    getLocalPublishedListings().then((listings) => setListingCount(listings.length));
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Earn beautifully</Text>
        <Text style={styles.title}>Turn your idle items into premium local income.</Text>
        <Text style={styles.subtitle}>
          Create a high-trust listing with geo visibility, a transparent 90/10 split, and clean premium presentation.
        </Text>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <Coins size={18} color={theme.colors.accentStrong} />
          <Text style={styles.metricValue}>90%</Text>
          <Text style={styles.metricLabel}>You keep</Text>
        </View>
        <View style={styles.metricCard}>
          <MapPin size={18} color={theme.colors.accentStrong} />
          <Text style={styles.metricValue}>Radius</Text>
          <Text style={styles.metricLabel}>Visibility control</Text>
        </View>
        <View style={styles.metricCard}>
          <ShieldCheck size={18} color={theme.colors.accentStrong} />
          <Text style={styles.metricValue}>{listingCount}</Text>
          <Text style={styles.metricLabel}>Local listings</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What you’ll configure</Text>
        <Text style={styles.cardLine}>Photos that make the item feel trusted and valuable.</Text>
        <Text style={styles.cardLine}>Locality and radius so discovery stays relevant.</Text>
        <Text style={styles.cardLine}>Daily price, deposit, and your exact lender net.</Text>
      </View>

      <TouchableOpacity style={styles.cta} onPress={() => router.push('/listing/create' as never)}>
        <Text style={styles.ctaText}>Start premium listing flow</Text>
        <ArrowRight size={18} color="#181411" />
      </TouchableOpacity>
    </ScrollView>
  );
};

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
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceAlt,
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
    lineHeight: 22,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: 8,
    ...theme.shadows.soft,
  },
  metricValue: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadows.soft,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  cardLine: {
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.accent,
    paddingVertical: 18,
    ...theme.shadows.medium,
  },
  ctaText: {
    color: '#181411',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default CreateListingScreen;



