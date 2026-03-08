// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, LogOut, Heart, ShoppingBag, List, Edit2, HelpCircle, ShieldAlert, ShieldCheck, Handshake, MoonStar, PlusCircle, Coins, ClipboardCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Routes } from '../../src/types/navigation';
import { useAppTheme } from '../../src/theme/provider';
import { getLocalPublishedListings } from '../../src/features/listings/storage';

const ProfileScreen = () => {
  const router = useRouter();
  const { theme, mode, toggleTheme } = useAppTheme();
  const styles = createStyles(theme);
  const { user, logout, updateProfile, refreshVerificationStatus } = useAuth();
  const initials = useMemo(() => user?.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'U', [user]);
  const [name, setName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [listingCount, setListingCount] = useState(0);

  useEffect(() => {
    getLocalPublishedListings().then((listings) => setListingCount(listings.length));
    refreshVerificationStatus();
  }, [refreshVerificationStatus]);

  const onSave = async () => {
    await updateProfile({ name });
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const menuItems = [
    { icon: List, label: 'My Listings', onPress: () => router.push(Routes.App.Home) },
    { icon: ShoppingBag, label: 'My Bookings', onPress: () => { } },
    { icon: Handshake, label: 'P2P Escrow Handover', onPress: () => router.push(Routes.Modals.Handshake) },
    { icon: Heart, label: 'My Reviews', onPress: () => { } },
    { icon: Settings, label: 'Settings', onPress: () => { } },
    { icon: HelpCircle, label: 'Support', onPress: () => router.push(Routes.Auth.Support) },
    ...(user?.role === 'admin'
      ? [{ icon: ClipboardCheck, label: 'Verification Review Console', onPress: () => router.push(Routes.Auth.AdminReviews) }]
      : []),
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <LinearGradient
          colors={[theme.colors.surfaceAlt, theme.colors.backgroundMuted]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
              <MoonStar size={16} color={theme.colors.textPrimary} />
              <Text style={styles.themeToggleText}>{mode === 'dark' ? 'Dark' : 'Light'}</Text>
            </TouchableOpacity>

            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Edit2 size={16} color={theme.colors.surface} />
              </TouchableOpacity>
            </View>

            <Text style={styles.name}>{user?.name || 'Guest User'}</Text>
            <Text style={styles.phone}>{user?.phone || '+91 98765 43210'}</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>4.8</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{listingCount}</Text>
                <Text style={styles.statLabel}>Listings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>90%</Text>
                <Text style={styles.statLabel}>You keep</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* KYC Verification Banner */}
      <View style={styles.verificationContainer}>
        {user?.isVerified ? (
          <View style={[styles.verificationCard, styles.verifiedCard]}>
            <View style={styles.verificationIcon}>
              <ShieldCheck size={24} color={theme.colors.success} />
            </View>
            <View style={styles.verificationTextContainer}>
              <Text style={styles.verifiedTitle}>Identity Verified</Text>
              <Text style={styles.verifiedSubtitle}>Your account is fully trusted.</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.verificationCard, styles.unverifiedCard]}
            onPress={() => router.push(Routes.Auth.Verification)}
          >
            <View style={[styles.verificationIcon, { backgroundColor: theme.colors.surfaceAlt }]}>
              <ShieldAlert size={24} color={theme.colors.danger} />
            </View>
            <View style={styles.verificationTextContainer}>
              <Text style={styles.unverifiedTitle}>
                {user?.verificationStatus === 'submitted' || user?.verificationStatus === 'under_review'
                  ? 'Verification Under Review'
                  : user?.verificationStatus === 'rejected'
                    ? 'Verification Rejected'
                    : user?.verificationStatus === 'needs_resubmission'
                      ? 'Resubmission Needed'
                      : 'Verification Pending'}
              </Text>
              <Text style={styles.unverifiedSubtitle}>
                {user?.verificationStatus === 'submitted' || user?.verificationStatus === 'under_review'
                  ? 'Our backend review pipeline is validating your KYC package now.'
                  : user?.verificationReviewNote || 'Complete KYC to borrow/lend items safely.'}
              </Text>
            </View>
            <View style={styles.verifyAction}>
              <Text style={styles.verifyActionText}>
                {user?.verificationStatus === 'submitted' || user?.verificationStatus === 'under_review' ? 'View Status' : 'Verify Now'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.earningsCard} onPress={() => router.push(Routes.Listing.Create)}>
          <View style={styles.earningsIcon}>
            <Coins size={20} color={theme.colors.accentStrong} />
          </View>
          <View style={styles.earningsCopy}>
            <Text style={styles.earningsTitle}>Launch a premium earning asset</Text>
            <Text style={styles.earningsSubtitle}>
              Add an item, set a visibility radius, and keep 90% of the rental revenue.
            </Text>
          </View>
          <PlusCircle size={18} color={theme.colors.accentStrong} />
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.editButtonText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              {isEditing ? (
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.colors.textMuted}
                />
              ) : (
                <Text style={styles.value}>{user?.name || 'Not set'}</Text>
              )}
            </View>
            {isEditing && (
              <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu</Text>
          <View style={styles.card}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, index === menuItems.length - 1 && styles.lastMenuItem]}
                onPress={item.onPress}
              >
                <View style={styles.menuIconContainer}>
                  <item.icon size={20} color={theme.colors.textPrimary} />
                </View>
                <Text style={styles.menuText}>{item.label}</Text>
                <item.icon size={16} color={theme.colors.textMuted} style={styles.chevron} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    height: 320,
    marginBottom: 20,
  },
  headerGradient: {
    flex: 1,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    paddingTop: 60,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  themeToggle: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  themeToggleText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.borderStrong,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: theme.colors.accentStrong,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.textPrimary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    opacity: 0.8,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: theme.colors.border,
  },
  verificationContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: -20,
    marginBottom: 20,
    zIndex: 10,
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    ...theme.shadows.soft,
  },
  verifiedCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  unverifiedCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  verificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  verificationTextContainer: {
    flex: 1,
  },
  verifiedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  verifiedSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  unverifiedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.danger,
  },
  unverifiedSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  verifyAction: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
  },
  verifyActionText: {
    color: '#181411',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 40,
  },
  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    padding: theme.spacing.md,
    marginBottom: 24,
  },
  earningsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsCopy: {
    flex: 1,
  },
  earningsTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    marginBottom: 4,
  },
  earningsSubtitle: {
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  editButtonText: {
    color: theme.colors.accentStrong,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 8,
  },
  saveButton: {
    backgroundColor: theme.colors.accent,
    padding: 12,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#181411',
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  chevron: {
    // Lucide icon style
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.danger,
    padding: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: 20,
    fontSize: 12,
  },
});

export default ProfileScreen;



