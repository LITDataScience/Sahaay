// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2026 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Routes } from '../../src/types/navigation';

const ItemDetailScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const item = params.itemData ? JSON.parse(params.itemData as string) : null;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: item?.image || 'https://via.placeholder.com/400' }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.title}>{item?.title || 'Item Title'}</Text>
        <Text style={styles.price}>₹{item?.price || 500}/day</Text>
        <Text style={styles.deposit}>Security Deposit: ₹{item?.deposit || 2000}</Text>

        <View style={styles.ownerInfo}>
          <Text style={styles.ownerLabel}>Owner:</Text>
          <Text style={styles.ownerName}>{item?.owner || 'John Doe'}</Text>
          <Text style={styles.distance}>{item?.distance || '2.3 km away'}</Text>
        </View>

        <Text style={styles.description}>
          This is a high-quality item available for borrowing. Perfect condition and well maintained.
          Contact the owner for more details about pickup and usage instructions.
        </Text>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => router.push({ pathname: Routes.Modals.Booking as any, params: { id: item.id, itemData: params.itemData } })}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#333',
    marginBottom: 10,
  },
  price: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 5,
  },
  deposit: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  ownerInfo: {
    marginBottom: 20,
  },
  ownerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ownerName: {
    fontSize: 16,
    color: '#333',
    marginTop: 5,
  },
  distance: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 5,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 30,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ItemDetailScreen;
