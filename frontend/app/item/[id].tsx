// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2026 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Sparkles, ShieldCheck, MapPin } from 'lucide-react-native';
import { useItemDetail } from '../../src/entities/listing/api';
import { useAppTheme } from '../../src/theme/provider';
import { trackMarketplaceEvent } from '../../src/services/analytics';
import { Routes } from '../../src/types/navigation';

const ItemDetailScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const fallbackItem = params.itemData ? JSON.parse(params.itemData as string) : null;
  const itemId = String(params.id || fallbackItem?.id || '');
  const detailQuery = useItemDetail({ itemId }, Boolean(itemId));
  const item = detailQuery.data || fallbackItem;

  useEffect(() => {
    if (!itemId) return;
    trackMarketplaceEvent({
      name: 'item_opened',
      entityId: itemId,
      entityType: 'item',
      metadata: { source: 'item_detail' },
    });
  }, [itemId]);

  if (detailQuery.isLoading && !item) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={theme.colors.accentStrong} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: item?.image || 'https://via.placeholder.com/400' }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.title}>{item?.title || 'Item Title'}</Text>
        <Text style={styles.price}>₹{item?.price || 500}/day</Text>
        <Text style={styles.deposit}>Security Deposit: ₹{item?.deposit || 2000}</Text>

        <View style={styles.aiCard}>
          <Sparkles size={16} color={theme.colors.accentStrong} />
          <Text style={styles.aiText}>{item?.aiSummary || 'Nearby premium listing with balanced value and trust.'}</Text>
        </View>

        <View style={styles.ownerInfo}>
          <View style={styles.ownerRow}>
            <Text style={styles.ownerLabel}>Owner</Text>
            <View style={styles.badge}>
              <ShieldCheck size={12} color={theme.colors.accentStrong} />
              <Text style={styles.badgeText}>{item?.verificationLevel === 'verified' ? 'Verified' : 'Pending review'}</Text>
            </View>
          </View>
          <Text style={styles.ownerName}>{item?.owner || 'John Doe'}</Text>
          <View style={styles.distanceRow}>
            <MapPin size={14} color={theme.colors.accentStrong} />
            <Text style={styles.distance}>{item?.distance || '2.3 km away'}</Text>
          </View>
        </View>

        <Text style={styles.description}>
          {item?.description || 'This is a high-quality item available for borrowing. Perfect condition and well maintained.'}
        </Text>

        {!!item?.matchReasons?.length && (
          <View style={styles.reasonsBlock}>
            <Text style={styles.reasonsTitle}>Why this is a strong match</Text>
            {item.matchReasons.map((reason: string) => (
              <Text key={reason} style={styles.reasonItem}>• {reason}</Text>
            ))}
          </View>
        )}

        {!!item?.similarItems?.length && (
          <View style={styles.reasonsBlock}>
            <Text style={styles.reasonsTitle}>Similar options nearby</Text>
            {item.similarItems.map((similar: any) => (
              <TouchableOpacity
                key={similar.id}
                style={styles.similarCard}
                onPress={() => router.replace({ pathname: Routes.Dynamic.ItemDetails(similar.id), params: { id: similar.id } } as any)}
              >
                <Text style={styles.similarTitle}>{similar.title}</Text>
                <Text style={styles.similarMeta}>₹{similar.pricePerDay || similar.price}/day · {similar.distance}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => router.push({ pathname: Routes.Modals.Booking as any, params: { id: item.id, itemData: JSON.stringify(item) } })}
        >
          <Text style={styles.bookButtonText}>Get secure quote</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  price: {
    fontSize: 20,
    color: theme.colors.accentStrong,
    fontWeight: '600',
    marginBottom: 5,
  },
  deposit: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  aiCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
    marginBottom: 20,
  },
  aiText: {
    flex: 1,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  ownerInfo: {
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 16,
  },
  ownerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ownerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  ownerName: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginTop: 5,
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.surfaceAlt,
  },
  badgeText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  distance: {
    fontSize: 14,
    color: theme.colors.accentStrong,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  reasonsBlock: {
    marginBottom: 20,
  },
  reasonsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  reasonItem: {
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  similarCard: {
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
  },
  similarTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  similarMeta: {
    color: theme.colors.textSecondary,
  },
  bookButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    padding: 15,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#181411',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ItemDetailScreen;
