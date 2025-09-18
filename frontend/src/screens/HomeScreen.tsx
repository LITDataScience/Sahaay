// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
import SearchBar from '../components/SearchBar';
import CategoryChips from '../components/CategoryChips';
import ItemCard, { Item } from '../components/ItemCard';
import { categories as categoriesData, searchItems } from '../services/mockData';

const HomeScreen = ({ navigation }: any) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const data = useMemo(() => searchItems(query, category), [query, category]);
  const { width } = useWindowDimensions();
  const numColumns = width >= 1100 ? 3 : width >= 768 ? 2 : 1;
  const renderItem = ({ item }: { item: Item }) => (
    <ItemCard item={item} onPress={() => navigation.navigate('ItemDetail', { item })} />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sahaay</Text>
        <Text style={styles.headerSubtitle}>Borrow from your neighborhood</Text>
      </View>

      <View style={styles.searchWrapper}>
        <SearchBar value={query} onChangeText={setQuery} />
      </View>

      <CategoryChips categories={categoriesData} selected={category} onSelect={setCategory} />

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContainer, numColumns > 1 && styles.listGrid]}
        showsVerticalScrollIndicator={false}
        numColumns={numColumns}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateListing')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  searchWrapper: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  listContainer: {
    padding: 15,
  },
  listGrid: {
    gap: 15,
  },
  
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HomeScreen;


