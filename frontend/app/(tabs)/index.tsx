// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { MapPin, Plus, SlidersHorizontal } from 'lucide-react-native';
import SearchBar from '../../src/shared/ui/SearchBar';
import CategoryChips from '../../src/features/listings/ui/CategoryChips';
import ItemCard from '../../src/features/listings/ui/ItemCard';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../src/theme/provider';
import { getLocalPublishedListings } from '../../src/features/listings/storage';
import { PublishedListing } from '../../src/features/listings/types';
import { useNearbyListings } from '../../src/entities/listing/api';
import { Routes } from '../../src/types/navigation';

const AnyFlashList = FlashList as any;

const categoriesData = ['All', 'Electronics', 'Tools', 'Appliances', 'Fashion', 'Sports'];

type FeedItem = {
  id: string;
  title: string;
  price: number;
  deposit: number;
  image: string;
  owner: string;
  distance: string;
  locality?: string;
  category?: string;
  raw: Record<string, unknown>;
};

const HomeScreen = () => {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [localListings, setLocalListings] = useState<FeedItem[]>([]);

  useEffect(() => {
    let active = true;

    getLocalPublishedListings().then((listings) => {
      if (active) {
        setLocalListings(listings.map(normalizeLocalListing));
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (active) {
          setLocation({
            lat: current.coords.latitude,
            lng: current.coords.longitude,
          });
        }
      } catch (error) {
        console.warn('Location lookup failed. Nearby ranking will stay generic.', error);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const nearbyListingsQuery = useNearbyListings({
    query: query.length >= 2 ? query : '',
    category,
    userLat: location?.lat,
    userLng: location?.lng,
    limit: 24,
  });

  const items = useMemo(() => {
    const remoteItems = (nearbyListingsQuery.data ?? []).map(normalizeRemoteItem);
    return mergeListings(remoteItems, localListings).filter((item) => {
      const matchesCategory = category === 'All' || item.category === category;
      const matchesQuery = query.length < 2 || item.title.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [category, localListings, nearbyListingsQuery.data, query]);

  const { width } = useWindowDimensions();
  const numColumns = width > 600 ? 3 : 2;
  const featuredLabel = useMemo(() => `${items.length} premium items nearby`, [items.length]);
  const isLoading = nearbyListingsQuery.isLoading && items.length === 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.surfaceAlt, theme.colors.backgroundMuted]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.eyebrow}>Borrow Genius</Text>
            <Text style={styles.title}>Sahaay</Text>
            <Text style={styles.subtitle}>Curated things from people near you.</Text>
          </View>
          <View style={styles.headerBadge}>
            <MapPin color={theme.colors.accentStrong} size={16} />
            <Text style={styles.headerBadgeText}>{featuredLabel}</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search for items to borrow..."
          />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.filterSection}>
          <CategoryChips
            categories={categoriesData}
            selected={category}
            onSelect={setCategory}
          />
          <TouchableOpacity style={styles.filterBtn}>
            <SlidersHorizontal color={theme.colors.textPrimary} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby premium listings</Text>
          <TouchableOpacity onPress={() => router.push(Routes.Listing.Create)}>
            <Text style={styles.sectionAction}>List yours</Text>
          </TouchableOpacity>
        </View>

        <AnyFlashList
          data={items}
          renderItem={({ item }: { item: FeedItem }) => (
            <ItemCard
              item={item}
              onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id, itemData: JSON.stringify(item.raw) } } as any)}
            />
          )}
          keyExtractor={(item: FeedItem) => item.id}
          numColumns={numColumns}
          estimatedItemSize={280}
          contentContainerStyle={styles.listContent}
          onRefresh={() => { }}
          refreshing={isLoading}
        />
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(Routes.Listing.Create)}
      >
        <Plus color="#181411" size={28} />
      </TouchableOpacity>
    </View>
  );
};

function normalizeRemoteItem(item: PublishedListing): FeedItem {
  const price = Number(item.price ?? item.pricePerDay ?? 0);
  const deposit = Number(item.deposit ?? 0);
  const title = String(item.title ?? 'Untitled item');
  const image = String(item.image ?? 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80');
  const owner = String(item.owner ?? item.ownerId ?? 'Trusted lender');
  const locality = String(item.locality ?? item.city ?? 'Nearby');
  const category = String(item.category ?? 'Electronics');

  return {
    id: String(item.id ?? `${title}-${price}`),
    title,
    price,
    deposit,
    image,
    owner,
    distance: item.distance || 'Near you',
    locality,
    category,
    raw: {
      ...item,
      price,
      deposit,
      image,
      owner,
      locality,
    },
  };
}

function normalizeLocalListing(item: PublishedListing): FeedItem {
  return {
    id: item.id,
    title: item.title,
    price: item.pricePerDay,
    deposit: item.deposit,
    image: item.image,
    owner: item.owner,
    distance: item.distance,
    locality: item.locality,
    category: item.category,
    raw: item,
  };
}

function mergeListings(remote: FeedItem[], local: FeedItem[]) {
  const map = new Map<string, FeedItem>();
  [...remote, ...local].forEach((item) => map.set(item.id, item));
  return [...map.values()];
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
  },
  headerContent: {
    marginBottom: 18,
    gap: 14,
  },
  eyebrow: {
    color: theme.colors.accentStrong,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontSize: 15,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    ...theme.shadows.soft,
  },
  headerBadgeText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  searchContainer: {
    marginTop: 5,
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  filterBtn: {
    padding: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionAction: {
    color: theme.colors.accentStrong,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
    elevation: 5,
  },
});

export default HomeScreen;
