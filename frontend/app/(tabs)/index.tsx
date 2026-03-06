// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Search, MapPin, SlidersHorizontal } from 'lucide-react-native';
import SearchBar from '../../src/shared/ui/SearchBar';
import CategoryChips from '../../src/features/listings/ui/CategoryChips';
import ItemCard from '../../src/features/listings/ui/ItemCard';
import Colors from '../../src/constants/Colors';
import Theme from '../../src/constants/Theme';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

const AnyFlashList = FlashList as any;

const categoriesData = ['All', 'Electronics', 'Tools', 'Appliances', 'Fashion', 'Sports'];

const HomeScreen = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  // Phase 12: Supabase Realtime Feed
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchItems = async () => {
      setIsLoading(true);
      let q = supabase.from('items').select('*');
      if (category !== 'All') q = q.eq('category', category);
      if (query.length > 2) q = q.ilike('title', `%${query}%`);

      const { data, error: qError } = await q;

      if (active) {
        if (qError) {
          console.error(qError);
        } else {
          setItems(data as any[] || []);
        }
        setIsLoading(false);
      }
    };

    fetchItems();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('public:items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, fetchItems)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [category, query]);

  const { width } = useWindowDimensions();
  const numColumns = width > 600 ? 3 : 2;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.darkPrimary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Sahaay</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Search color="#fff" size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MapPin color="#fff" size={24} />
            </TouchableOpacity>
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
            <SlidersHorizontal color={Colors.text.primary} size={20} />
          </TouchableOpacity>
        </View>

        <AnyFlashList
          data={items}
          renderItem={({ item }: any) => (
            <ItemCard
              item={item}
              onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } } as any)}
            />
          )}
          keyExtractor={(item: any) => item.id}
          numColumns={numColumns}
          estimatedItemSize={280}
          contentContainerStyle={styles.listContent}
          onRefresh={() => { }}
          refreshing={isLoading}
        />
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/listing/create' as any)}
      >
        <Plus color="#fff" size={28} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
    padding: 5,
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
    backgroundColor: '#fff',
    borderRadius: 12,
    marginLeft: 10,
    ...Theme.shadows.small,
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
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.medium,
    elevation: 5,
  },
});

export default HomeScreen;
