// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../src/context/AuthContext';
import { useMachine } from '@xstate/react';
import { escrowMachine } from '../src/machines/escrowMachine';
import { initiateBookingRemote } from '../src/entities/booking/api';
import { getBookingQuoteRemote } from '../src/entities/listing/api';
import { useAppTheme } from '../src/theme/provider';
import { trackMarketplaceEvent } from '../src/services/analytics';
import { Routes } from '../src/types/navigation';

const BookingScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user, identityGate, logout } = useAuth();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const item = params.itemData ? JSON.parse(params.itemData as string) : null;
  const [durationDays, setDurationDays] = useState(3);

  // Phase 11: Bind formal escrow state machine
  const [state, send] = useMachine(escrowMachine);

  const isProcessing = state.matches('awaiting_payment') || state.matches('funding_escrow');
  const startDate = useMemo(() => {
    const value = new Date();
    value.setHours(12, 0, 0, 0);
    return value;
  }, []);
  const endDate = useMemo(() => {
    const value = new Date(startDate);
    value.setDate(value.getDate() + durationDays);
    return value;
  }, [durationDays, startDate]);
  const quoteQuery = useQuery({
    queryKey: ['booking-quote', item?.id, durationDays],
    queryFn: () => getBookingQuoteRemote({
      itemId: item.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
    enabled: Boolean(item?.id && user),
  });

  useEffect(() => {
    if (!item?.id) return;
    trackMarketplaceEvent({
      name: 'booking_screen_opened',
      entityId: item.id,
      entityType: 'item',
      metadata: { durationDays },
    });
  }, [durationDays, item?.id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Book Item</Text>
        <Text style={styles.itemTitle}>{item?.title || 'Selected Item'}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <Text style={styles.summaryText}>Daily Rate: ₹{quoteQuery.data?.baseAmount ? Math.round(quoteQuery.data.baseAmount / quoteQuery.data.days) : item?.price || 500}</Text>
          <Text style={styles.summaryText}>Security Deposit: ₹{quoteQuery.data?.depositAmount ?? item?.deposit ?? 2000}</Text>
          <Text style={styles.summaryText}>Platform Fee: ₹{quoteQuery.data?.platformFee ?? 0}</Text>
          <Text style={styles.summaryText}>Duration: {durationDays} days</Text>
          <Text style={styles.totalText}>Total: ₹{quoteQuery.data?.totalAmount ?? 0}</Text>
        </View>

        <View style={styles.durationRow}>
          {[1, 3, 7].map((days) => (
            <TouchableOpacity
              key={days}
              style={[styles.durationChip, durationDays === days && styles.durationChipActive]}
              onPress={() => setDurationDays(days)}
            >
              <Text style={[styles.durationChipText, durationDays === days && styles.durationChipTextActive]}>{days} day{days > 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.bookButton, isProcessing && { backgroundColor: '#9e9e9e' }]}
          onPress={async () => {
            if (!user) return;
            if (!item?.id) {
              Alert.alert('Item unavailable', 'This item is missing a valid backend identifier.');
              return;
            }

            if (!identityGate.canUsePayoutFlows) {
              if (identityGate.isAnonymousSession) {
                Alert.alert(
                  'Secure phone sign-in required',
                  identityGate.reason || 'Demo sessions cannot initiate protected bookings.',
                  [
                    { text: 'Not now', style: 'cancel' },
                    {
                      text: 'Sign out and continue',
                      onPress: async () => {
                        await logout();
                        router.replace(Routes.Auth.Login);
                      },
                    },
                  ]
                );
                return;
              }

              Alert.alert(
                'KYC required',
                identityGate.reason || 'Complete KYC verification before booking items.',
                [
                  { text: 'Later', style: 'cancel' },
                  { text: 'Verify now', onPress: () => router.push(Routes.Auth.Verification) },
                ]
              );
              return;
            }

            try {
              const response = await initiateBookingRemote({
                itemId: item.id,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              });

              send({
                type: 'INITIATE_BOOKING',
                bookingId: response.bookingId,
                lenderId: item?.ownerId || item?.lenderId || 'UNKNOWN_LENDER',
                borrowerId: user.id,
                amount: item?.price || 500,
              });

              Alert.alert(
                'Protected booking started',
                'Your booking has been created on the secure backend and is awaiting escrow payment confirmation.',
                [{ text: 'OK' }]
              );
              trackMarketplaceEvent({
                name: 'booking_initiated',
                entityId: response.bookingId,
                entityType: 'booking',
                metadata: { itemId: item.id, totalAmount: quoteQuery.data?.totalAmount ?? null, durationDays },
              });
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Secure booking could not be created.';
              Alert.alert('Booking blocked', message);
            }
          }}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookButtonText}>
              {quoteQuery.isLoading ? 'Loading secure quote...' : identityGate.canUsePayoutFlows ? 'Initiate Protected Booking' : 'Verification Required'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surfaceAlt,
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  summary: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: theme.radius.lg,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.accentStrong,
    marginTop: 10,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  durationChip: {
    flex: 1,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  durationChipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  durationChipText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  durationChipTextActive: {
    color: '#181411',
  },
  bookButton: {
    backgroundColor: theme.colors.accentStrong,
    padding: 20,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginBottom: 15,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  cancelButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingScreen;


