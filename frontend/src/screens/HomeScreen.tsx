// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sitaram Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';

interface Item {
  id: string;
  title: string;
  price: number;
  deposit: number;
  image: string;
  owner: string;
  distance: string;
}

const mockItems: Item[] = [
  {
    id: '1',
    title: 'Professional Camera',
    price: 500,
    deposit: 5000,
    image: 'https://via.placeholder.com/150',
    owner: 'Rahul Sharma',
    distance: '2.3 km',
  },
  {
    id: '2',
    title: 'Gaming Laptop',
    price: 800,
    deposit: 8000,
    image: 'https://via.placeholder.com/150',
    owner: 'Priya Patel',
    distance: '1.8 km',
  },
  {
    id: '3',
    title: 'Power Drill Set',
    price: 300,
    deposit: 2000,
    image: 'https://via.placeholder.com/150',
    owner: 'Amit Kumar',
    distance: '3.1 km',
  },
];

const HomeScreen = ({ navigation }: any) => {
  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => navigation.navigate('ItemDetail', { item })}
    >
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemPrice}>₹{item.price}/day</Text>
        <Text style={styles.itemDeposit}>Deposit: ₹{item.deposit}</Text>
        <Text style={styles.itemOwner}>{item.owner}</Text>
        <Text style={styles.itemDistance}>{item.distance}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sahaay</Text>
        <Text style={styles.headerSubtitle}>Borrow from your neighborhood</Text>
      </View>

      <View style={styles.filters}>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>All Items</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Electronics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Tools</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={mockItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
  filters: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  listContainer: {
    padding: 15,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  itemImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  itemInfo: {
    flex: 1,
    padding: 15,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 3,
  },
  itemDeposit: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  itemOwner: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  itemDistance: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
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


