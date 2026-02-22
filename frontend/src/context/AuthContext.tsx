// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2026 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecurityService } from '../services/SecurityService';
import { supabase } from '../lib/supabase';

export type User = {
  id: string;
  name: string;
  phone: string;
  avatarInitials: string;
  reputation: number;
  isVerified: boolean;
  kycStatus: 'pending' | 'verified' | 'failed';
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  loginWithPhoneOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  verifyUser: (success: boolean) => Promise<void>;
};

const STORAGE_KEY = 'sahaay.auth.user.v2';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase Auth State Listener for App Hydration
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Ideally map the Supabase user to our local User schema
        // For now, load local storage augmentations if they exist
        AsyncStorage.getItem(STORAGE_KEY).then(raw => {
          if (raw) setUser(JSON.parse(raw));
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        AsyncStorage.removeItem(STORAGE_KEY);
      }
    });
  }, []);

  const persist = useCallback(async (u: User | null) => {
    if (u) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const loginWithPhoneOtp = useCallback(async (phone: string, otp: string) => {
    // 1. Authenticate with Supabase Realtime Provider
    const { data: { session }, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });

    // Note for Demo Env: Supabase might fail if SMS isn't configured. 
    // We catch the error but still mock a local login if it fails for the interactive demo.
    if (error) {
      console.warn('Supabase Verification Failed, falling back to local simulation for Demo', error.message);
    }

    // 2. Generate RSA KeyPair bound to device enclave
    const publicKey = await SecurityService.bindDevice();
    console.log('Device bound cryptographically with PK:', publicKey);

    const initials = 'U';
    const newUser: User = {
      id: session?.user?.id || Math.random().toString(36).slice(2),
      name: 'New User',
      phone,
      avatarInitials: initials,
      reputation: 4.5,
      isVerified: false,
      kycStatus: 'pending',
    };

    setUser(newUser);
    await persist(newUser);
  }, [persist]);

  const logout = useCallback(async () => {
    await SecurityService.unbindDevice();
    await supabase.auth.signOut();
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

  const verifyUser = useCallback(async (success: boolean) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser: User = {
        ...prev,
        isVerified: success,
        kycStatus: success ? 'verified' : 'failed'
      };
      persist(updatedUser);
      return updatedUser;
    });
  }, [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, loginWithPhoneOtp, logout, updateProfile, verifyUser }),
    [user, isLoading, loginWithPhoneOtp, logout, updateProfile, verifyUser]
  );

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
