// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2026 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { SecurityService } from '../services/SecurityService';

export type User = {
  id: string;
  name: string;
  phone: string;
  avatarInitials: string;
  reputation: number;
  isVerified: boolean;
  kycStatus: 'pending' | 'verified' | 'failed';
};

export type IdentityGate = {
  canUsePayoutFlows: boolean;
  isAnonymousSession: boolean;
  requiresKyc: boolean;
  reason: string | null;
};

type AuthContextValue = {
  user: User | null;
  identityGate: IdentityGate;
  isLoading: boolean;
  requestPhoneOtp: (phone: string) => Promise<{ mode: 'firebase' | 'demo'; code?: string }>;
  loginWithPhoneOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  verifyUser: (success: boolean) => Promise<void>;
};

const STORAGE_KEY = 'sahaay.auth.user.v2';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
let pendingFirebaseConfirmation: FirebaseAuthTypes.ConfirmationResult | null = null;
let pendingDemoOtp: string | null = null;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [identityGate, setIdentityGate] = useState<IdentityGate>({
    canUsePayoutFlows: false,
    isAnonymousSession: false,
    requiresKyc: true,
    reason: 'Complete secure phone sign-in before using listings or bookings.',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Firebase Auth State Listener for App Hydration
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIdentityGate({
          canUsePayoutFlows: false,
          isAnonymousSession: false,
          requiresKyc: true,
          reason: 'Complete secure phone sign-in before using listings or bookings.',
        });
        await AsyncStorage.removeItem(STORAGE_KEY);
        setIsLoading(false);
        return;
      }

      const [raw, profileSnap] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        firestore().collection('users').doc(firebaseUser.uid).get(),
      ]);

      const localUser = raw ? (JSON.parse(raw) as User) : null;
      const profile = profileSnap.data() || {};
      const hydratedUser = buildUserRecord(firebaseUser.uid, {
        phone: firebaseUser.phoneNumber || localUser?.phone || '',
        name: profile.name || localUser?.name || 'New User',
        reputationScore: profile.reputationScore ?? localUser?.reputation ?? 4.5,
        isVerified: profile.isVerified ?? localUser?.isVerified ?? false,
        kycStatus: profile.kycStatus ?? localUser?.kycStatus ?? 'pending',
      });

      setUser(hydratedUser);
      setIdentityGate(buildIdentityGate(firebaseUser.isAnonymous, hydratedUser));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(hydratedUser));
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const persist = useCallback(async (u: User | null) => {
    if (u) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const requestPhoneOtp = useCallback(async (phone: string) => {
    const normalizedPhone = normalizeIndianPhone(phone);

    try {
      pendingFirebaseConfirmation = await auth().signInWithPhoneNumber(normalizedPhone);
      pendingDemoOtp = null;

      return { mode: 'firebase' as const };
    } catch (error) {
      console.warn('Firebase phone auth unavailable, using secure demo OTP fallback.', error);
      pendingFirebaseConfirmation = null;
      pendingDemoOtp = String(Math.floor(100000 + Math.random() * 900000));

      return { mode: 'demo' as const, code: pendingDemoOtp };
    }
  }, []);

  const loginWithPhoneOtp = useCallback(async (phone: string, otp: string) => {
    let firebaseUser = auth().currentUser;

    if (pendingFirebaseConfirmation) {
      const credential = await pendingFirebaseConfirmation.confirm(otp);
      firebaseUser = credential?.user ?? null;
    } else {
      if (!pendingDemoOtp || pendingDemoOtp !== otp) {
        throw new Error('Invalid OTP. Please request a new code and try again.');
      }

      if (!firebaseUser) {
        const anonymousCredential = await auth().signInAnonymously();
        firebaseUser = anonymousCredential.user;
      }
    }

    if (!firebaseUser) {
      throw new Error('Unable to establish a secure session.');
    }

    const publicKey = await SecurityService.bindDevice();
    console.log('Device bound cryptographically with PK:', publicKey);

    const userRef = firestore().collection('users').doc(firebaseUser.uid);
    const profileSnap = await userRef.get();
    const previous = profileSnap.data() || {};
    const newUser = buildUserRecord(firebaseUser.uid, {
      phone: normalizeIndianPhone(phone),
      name: previous.name || 'New User',
      reputationScore: previous.reputationScore ?? 4.5,
      isVerified: previous.isVerified ?? false,
      kycStatus: previous.kycStatus ?? 'pending',
    });

    await userRef.set({
      name: newUser.name,
      phone: newUser.phone,
      publicKey,
      isVerified: newUser.isVerified,
      kycStatus: newUser.kycStatus,
      reputationScore: newUser.reputation,
      authProvider: pendingFirebaseConfirmation ? 'phone' : 'anonymous_demo',
      updatedAt: firestore.FieldValue.serverTimestamp(),
      createdAt: previous.createdAt || firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    pendingFirebaseConfirmation = null;
    pendingDemoOtp = null;

    setUser(newUser);
    setIdentityGate(buildIdentityGate(firebaseUser.isAnonymous, newUser));
    await persist(newUser);
  }, [persist]);

  const logout = useCallback(async () => {
    await SecurityService.unbindDevice();
    await auth().signOut();
    pendingFirebaseConfirmation = null;
    pendingDemoOtp = null;
    setUser(null);
    setIdentityGate({
      canUsePayoutFlows: false,
      isAnonymousSession: false,
      requiresKyc: true,
      reason: 'Complete secure phone sign-in before using listings or bookings.',
    });
    await persist(null);
  }, [persist]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) {
      return;
    }

    const merged = { ...user, ...updates };
    setUser(merged);
    setIdentityGate(buildIdentityGate(auth().currentUser?.isAnonymous === true, merged));
    await persist(merged);

    if (auth().currentUser) {
      await firestore().collection('users').doc(auth().currentUser!.uid).set({
        name: updates.name,
        phone: updates.phone,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }, [persist, user]);

  const verifyUser = useCallback(async (success: boolean) => {
    if (success) {
      throw new Error('Live KYC approval must be issued by the backend review pipeline. This client flow cannot self-verify a payout account yet.');
    }

    if (!user) {
      return;
    }

    const nextUser: User = {
      ...user,
      isVerified: success,
      kycStatus: success ? 'verified' : 'failed'
    };

    setUser(nextUser);
    setIdentityGate(buildIdentityGate(auth().currentUser?.isAnonymous === true, nextUser));
    await persist(nextUser);

    if (auth().currentUser && nextUser) {
      await firestore().collection('users').doc(auth().currentUser!.uid).set({
        isVerified: nextUser.isVerified,
        kycStatus: nextUser.kycStatus,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }, [persist, user]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, identityGate, isLoading, requestPhoneOtp, loginWithPhoneOtp, logout, updateProfile, verifyUser }),
    [user, identityGate, isLoading, requestPhoneOtp, loginWithPhoneOtp, logout, updateProfile, verifyUser]
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

function normalizeIndianPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('91') ? `+${digits}` : `+91${digits}`;
}

function buildUserRecord(
  uid: string,
  payload: {
    phone: string;
    name: string;
    reputationScore: number;
    isVerified: boolean;
    kycStatus: User['kycStatus'];
  }
): User {
  const initials = payload.name
    .split(' ')
    .filter(Boolean)
    .map((chunk) => chunk[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return {
    id: uid,
    name: payload.name,
    phone: payload.phone,
    avatarInitials: initials,
    reputation: payload.reputationScore,
    isVerified: payload.isVerified,
    kycStatus: payload.kycStatus,
  };
}

function buildIdentityGate(isAnonymousSession: boolean, user: User | null): IdentityGate {
  if (isAnonymousSession) {
    return {
      canUsePayoutFlows: false,
      isAnonymousSession: true,
      requiresKyc: true,
      reason: 'Secure phone sign-in is required before publishing listings or booking items.',
    };
  }

  if (!user || user.isVerified !== true || user.kycStatus !== 'verified') {
    return {
      canUsePayoutFlows: false,
      isAnonymousSession: false,
      requiresKyc: true,
      reason: 'Complete KYC verification before publishing listings or booking items.',
    };
  }

  return {
    canUsePayoutFlows: true,
    isAnonymousSession: false,
    requiresKyc: false,
    reason: null,
  };
}
