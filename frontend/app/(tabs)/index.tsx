// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, StatusBar } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Search, MapPin, SlidersHorizontal } from 'lucide-react-native';
import SearchBar from '../../src/shared/ui/SearchBar';
import CategoryChips from '../../src/features/listings/ui/CategoryChips';
import ItemCard, { Item } from '../../src/features/listings/ui/ItemCard';
import { categories as categoriesData } from '../../src/services/mockData';
import Colors from '../../src/constants/Colors';
import Theme from '../../src/constants/Theme';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Routes } from '../../src/types/navigation';
import { supabase } from '../../src/lib/supabase';

const HomeScreen = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  // Phase 12: Supabase Realtime Feed
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchItems = async () => {
      setIsLoading(true);
      let q = supabase.from('items').select('*');
      if (category !== 'All') q = q.eq('category', category);
      if (query.length > 2) q = q.ilike('title', `%${query}%`);

      const { data, error } = await q;

      if (active && data) {
        setItems(data as unknown as Item[]);
      }
      setIsLoading(false);
    };

    fetchItems();

    // Bind Realtime Subscription to instantly remove booked items
    const channel = supabase.channel('public:items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [category, query]);

  const { width } = useWindowDimensions();
  const numColumns = width >= 1100 ? 3 : width >= 768 ? 2 : 1;

  const renderItem = ({ item }: { item: Item }) => (
    <ItemCard item={item} onPress={() => router.push({ pathname: Routes.Dynamic.ItemDetails(item.id), params: { itemData: JSON.stringify(item) } })} />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <LinearGradient
          colors={[Colors.primary, Colors.darkPrimary]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Sahaay</Text>
              <Text style={styles.headerSubtitle}>Borrow from your neighborhood</Text>
            </View>
          </View>

          <View style={styles.searchWrapper}>
            <SearchBar value={query} onChangeText={setQuery} />
          </View>
        </LinearGradient>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.categoriesWrapper}>
          <CategoryChips categories={categoriesData} selected={category} onSelect={setCategory} />
        </View>

        <FlashList
          data={items}
          renderItem={renderItem as any}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={[styles.listContainer, numColumns > 1 && styles.listGrid]}
          showsVerticalScrollIndicator={false}
          numColumns={numColumns}
          // @ts-ignore - The package types do not correctly export the intrinsic FlatList props.
          estimatedItemSize={250}
        />
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/create' as any)}
        activeOpacity={0.8}
      >
        <Plus size={32} color={Colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.primary,
    ...Theme.shadows.medium,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.text.primary,
    opacity: 0.8,
  },
  searchWrapper: {
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
  },
  categoriesWrapper: {
    paddingVertical: 12,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  listGrid: {
    gap: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: Colors.primary, // Yellow FAB
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.large,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
});

export default HomeScreen;


