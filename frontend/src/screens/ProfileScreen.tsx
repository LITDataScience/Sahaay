// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Colors from '../constants/Colors';
import Theme from '../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, LogOut, Heart, ShoppingBag, List, Edit2, User, HelpCircle } from 'lucide-react-native';

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout, updateProfile } = useAuth();
  const initials = useMemo(() => user?.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'U', [user]);
  const [name, setName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);

  const onSave = async () => {
    await updateProfile({ name });
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const menuItems = [
    { icon: List, label: 'My Listings', onPress: () => { } },
    { icon: ShoppingBag, label: 'My Bookings', onPress: () => { } },
    { icon: Heart, label: 'My Reviews', onPress: () => { } },
    { icon: Settings, label: 'Settings', onPress: () => { } },
    { icon: HelpCircle, label: 'Support', onPress: () => { } },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <LinearGradient
          colors={[Colors.primary, Colors.darkPrimary]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Edit2 size={16} color={Colors.surface} />
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
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Listings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>5</Text>
                <Text style={styles.statLabel}>Borrowed</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.content}>
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
                  <item.icon size={20} color={Colors.secondary} />
                </View>
                <Text style={styles.menuText}>{item.label}</Text>
                <item.icon size={16} color={Colors.text.placeholder} style={styles.chevron} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={20} color={Colors.surface} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 320,
    marginBottom: 20,
  },
  headerGradient: {
    flex: 1,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 60,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.secondary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary, // Dark text on yellow bg (if yellow is light enough) or white if dark bg
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: Colors.text.primary,
    opacity: 0.8,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: Theme.borderRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    justifyContent: 'space-between',
    ...Theme.shadows.medium,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.border,
  },
  content: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: 40,
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
    color: Colors.text.primary,
    marginBottom: 12,
  },
  editButtonText: {
    color: Colors.secondary, // Use secondary (black) or primary (yellow) based on preference
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    ...Theme.shadows.small,
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    color: Colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: Colors.text.primary, // Dark text on yellow button
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  chevron: {
    // Lucide icon style
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30', // Keep red for danger action
    padding: 16,
    borderRadius: Theme.borderRadius.md,
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
    color: Colors.text.secondary,
    marginTop: 20,
    fontSize: 12,
  },
});

export default ProfileScreen;



