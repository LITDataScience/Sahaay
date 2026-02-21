// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const BookingScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const item = params.itemData ? JSON.parse(params.itemData as string) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Book Item</Text>
        <Text style={styles.itemTitle}>{item?.title || 'Selected Item'}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <Text style={styles.summaryText}>Daily Rate: ₹{item?.price || 500}</Text>
          <Text style={styles.summaryText}>Security Deposit: ₹{item?.deposit || 2000}</Text>
          <Text style={styles.summaryText}>Duration: 3 days</Text>
          <Text style={styles.totalText}>Total: ₹2,500</Text>
        </View>

        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Confirm Booking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
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
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  summary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 10,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingScreen;


