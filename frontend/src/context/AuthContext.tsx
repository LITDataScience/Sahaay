// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type User = {
  id: string;
  name: string;
  phone: string;
  avatarInitials: string;
  reputation: number;
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  loginWithPhoneOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
};

const STORAGE_KEY = 'sahaay.auth.user.v1';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setUser(JSON.parse(raw));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (u: User | null) => {
    if (u) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const loginWithPhoneOtp = useCallback(async (phone: string, _otp: string) => {
    // Simulate verification success and create a user profile
    const initials = 'U';
    const newUser: User = {
      id: Math.random().toString(36).slice(2),
      name: 'New User',
      phone,
      avatarInitials: initials,
      reputation: 4.5,
    };
    setUser(newUser);
    await persist(newUser);
  }, [persist]);

  const logout = useCallback(async () => {
    setUser(null);
    await persist(null);
  }, [persist]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...updates };
      persist(merged);
      return merged;
    });
  }, [persist]);

  const value = useMemo<AuthContextValue>(() => ({ user, isLoading, loginWithPhoneOtp, logout, updateProfile }), [user, isLoading, loginWithPhoneOtp, logout, updateProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};


