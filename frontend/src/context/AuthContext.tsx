// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2026 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import { SecurityService } from '../services/SecurityService';

export type User = {
  id: string;
  name: string;
  phone: string;
  avatarInitials: string;
  role: 'user' | 'admin';
  reputation: number;
  isVerified: boolean;
  kycStatus: 'pending' | 'verified' | 'failed';
  verificationStatus: 'not_started' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'needs_resubmission';
  verificationMethod: 'digilocker' | 'pan' | null;
  verificationReviewNote: string;
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
  submitVerification: (method: 'digilocker' | 'pan', livenessConfidence: number, notes?: string) => Promise<void>;
  refreshVerificationStatus: () => Promise<void>;
};

const STORAGE_KEY = 'sahaay.auth.user.v2';
const SESSION_MODE_KEY = 'sahaay.auth.session-mode.v1';

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
      const [raw, sessionMode] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(SESSION_MODE_KEY),
      ]);

      if (!firebaseUser) {
        if (sessionMode === 'demo' && raw) {
          const localUser = JSON.parse(raw) as User;
          setUser(localUser);
          setIdentityGate(buildIdentityGate(true, localUser));
          setIsLoading(false);
          return;
        }

        setUser(null);
        setIdentityGate({
          canUsePayoutFlows: false,
          isAnonymousSession: false,
          requiresKyc: true,
          reason: 'Complete secure phone sign-in before using listings or bookings.',
        });
        await Promise.all([
          AsyncStorage.removeItem(STORAGE_KEY),
          AsyncStorage.removeItem(SESSION_MODE_KEY),
        ]);
        setIsLoading(false);
        return;
      }

      const [profileSnap] = await Promise.all([
        firestore().collection('users').doc(firebaseUser.uid).get(),
      ]);

      const localUser = raw ? (JSON.parse(raw) as User) : null;
      const profile = profileSnap.data() || {};
      const hydratedUser = buildUserRecord(firebaseUser.uid, {
        phone: firebaseUser.phoneNumber || localUser?.phone || '',
        name: profile.name || localUser?.name || 'New User',
        role: profile.role ?? localUser?.role ?? 'user',
        reputationScore: profile.reputationScore ?? localUser?.reputation ?? 4.5,
        isVerified: profile.isVerified ?? localUser?.isVerified ?? false,
        kycStatus: profile.kycStatus ?? localUser?.kycStatus ?? 'pending',
        verificationStatus: profile.verificationStatus ?? localUser?.verificationStatus ?? 'not_started',
        verificationMethod: profile.verificationMethod ?? localUser?.verificationMethod ?? null,
        verificationReviewNote: profile.verificationReviewNote ?? localUser?.verificationReviewNote ?? '',
      });

      setUser(hydratedUser);
      setIdentityGate(buildIdentityGate(firebaseUser.isAnonymous, hydratedUser));
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(hydratedUser)),
        AsyncStorage.setItem(SESSION_MODE_KEY, 'firebase'),
      ]);
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
    let sessionMode: 'firebase' | 'demo' = pendingFirebaseConfirmation ? 'firebase' : 'demo';
    const normalizedPhone = normalizeIndianPhone(phone);

    if (pendingFirebaseConfirmation) {
      const credential = await pendingFirebaseConfirmation.confirm(otp);
      firebaseUser = credential?.user ?? null;
    } else {
      if (!pendingDemoOtp || pendingDemoOtp !== otp) {
        throw new Error('Invalid OTP. Please request a new code and try again.');
      }

      if (!firebaseUser) {
        try {
          const anonymousCredential = await auth().signInAnonymously();
          firebaseUser = anonymousCredential.user;
          sessionMode = 'firebase';
        } catch (error) {
          if (!isFirebaseConfigurationError(error)) {
            throw error;
          }

          console.warn('Firebase anonymous auth unavailable, continuing with local demo session.', error);
          sessionMode = 'demo';
        }
      }
    }

    if (sessionMode === 'firebase' && !firebaseUser) {
      throw new Error('Unable to establish a secure session.');
    }

    if (sessionMode === 'firebase' && firebaseUser) {
      const publicKey = await SecurityService.bindDevice();
      console.log('Device bound cryptographically with PK:', publicKey);

      const userRef = firestore().collection('users').doc(firebaseUser.uid);
      const profileSnap = await userRef.get();
      const previous = profileSnap.data() || {};
      const newUser = buildUserRecord(firebaseUser.uid, {
        phone: normalizedPhone,
        name: previous.name || 'New User',
        role: previous.role ?? 'user',
        reputationScore: previous.reputationScore ?? 4.5,
        isVerified: previous.isVerified ?? false,
        kycStatus: previous.kycStatus ?? 'pending',
        verificationStatus: previous.verificationStatus ?? 'not_started',
        verificationMethod: previous.verificationMethod ?? null,
        verificationReviewNote: previous.verificationReviewNote ?? '',
      });

      await userRef.set({
        name: newUser.name,
        phone: newUser.phone,
        publicKey,
        isVerified: newUser.isVerified,
        kycStatus: newUser.kycStatus,
        reputationScore: newUser.reputation,
        authProvider: pendingFirebaseConfirmation ? 'phone' : 'anonymous_demo',
        verificationStatus: previous.verificationStatus ?? 'not_started',
        verificationMethod: previous.verificationMethod ?? null,
        verificationReviewNote: previous.verificationReviewNote ?? '',
        updatedAt: firestore.FieldValue.serverTimestamp(),
        createdAt: previous.createdAt || firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      pendingFirebaseConfirmation = null;
      pendingDemoOtp = null;

      setUser(newUser);
      setIdentityGate(buildIdentityGate(firebaseUser.isAnonymous, newUser));
      await Promise.all([
        persist(newUser),
        AsyncStorage.setItem(SESSION_MODE_KEY, 'firebase'),
      ]);
      return;
    }

    let demoPublicKey = '';
    try {
      demoPublicKey = await SecurityService.bindDevice();
      console.log('Device bound cryptographically with PK:', demoPublicKey);
    } catch (error) {
      console.warn('Device binding unavailable in local demo session.', error);
    }

    const demoUser = buildUserRecord(`demo-${normalizedPhone.replace(/\D/g, '')}`, {
      phone: normalizedPhone,
      name: 'Demo User',
      role: 'user',
      reputationScore: 4.5,
      isVerified: false,
      kycStatus: 'pending',
      verificationStatus: 'not_started',
      verificationMethod: null,
      verificationReviewNote: demoPublicKey ? 'Local demo session active.' : 'Local demo session active without device binding.',
    });

    pendingFirebaseConfirmation = null;
    pendingDemoOtp = null;

    setUser(demoUser);
    setIdentityGate(buildIdentityGate(true, demoUser));
    await Promise.all([
      persist(demoUser),
      AsyncStorage.setItem(SESSION_MODE_KEY, 'demo'),
    ]);
  }, [persist]);

  const logout = useCallback(async () => {
    await SecurityService.unbindDevice();
    try {
      if (auth().currentUser) {
        await auth().signOut();
      }
    } catch (error) {
      if (!isFirebaseConfigurationError(error)) {
        throw error;
      }
    }
    pendingFirebaseConfirmation = null;
    pendingDemoOtp = null;
    setUser(null);
    setIdentityGate({
      canUsePayoutFlows: false,
      isAnonymousSession: false,
      requiresKyc: true,
      reason: 'Complete secure phone sign-in before using listings or bookings.',
    });
    await Promise.all([
      persist(null),
      AsyncStorage.removeItem(SESSION_MODE_KEY),
    ]);
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

  const refreshVerificationStatus = useCallback(async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return;
    }

    const response = await functions().httpsCallable('tRPC')({
      path: 'getVerificationStatus',
      input: {},
    });
    const data = response.data as {
      status: User['verificationStatus'];
      method: User['verificationMethod'];
      isVerified: boolean;
      kycStatus: User['kycStatus'];
      reviewNote: string;
    };

    setUser((prev) => {
      if (!prev) return prev;
      const nextUser: User = {
        ...prev,
        isVerified: data.isVerified,
        kycStatus: data.kycStatus,
        verificationStatus: data.status,
        verificationMethod: data.method,
        verificationReviewNote: data.reviewNote || '',
      };
      setIdentityGate(buildIdentityGate(currentUser.isAnonymous, nextUser));
      persist(nextUser);
      return nextUser;
    });
  }, [persist]);

  const submitVerification = useCallback(async (method: 'digilocker' | 'pan', livenessConfidence: number, notes?: string) => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return;
    }

    await functions().httpsCallable('tRPC')({
      path: 'submitVerification',
      input: {
        method,
        livenessConfidence,
        notes: notes || '',
      },
    });

    const nextUser: User = {
      ...(user || buildUserRecord(currentUser.uid, {
        phone: currentUser.phoneNumber || '',
        name: 'New User',
        role: 'user',
        reputationScore: 4.5,
        isVerified: false,
        kycStatus: 'pending',
        verificationStatus: 'not_started',
        verificationMethod: null,
        verificationReviewNote: '',
      })),
      verificationStatus: 'submitted',
      verificationMethod: method,
      verificationReviewNote: '',
      isVerified: false,
      kycStatus: 'pending',
    };

    setUser(nextUser);
    setIdentityGate(buildIdentityGate(currentUser.isAnonymous, nextUser));
    await persist(nextUser);
  }, [persist, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      identityGate,
      isLoading,
      requestPhoneOtp,
      loginWithPhoneOtp,
      logout,
      updateProfile,
      submitVerification,
      refreshVerificationStatus,
    }),
    [user, identityGate, isLoading, requestPhoneOtp, loginWithPhoneOtp, logout, updateProfile, submitVerification, refreshVerificationStatus]
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
    role: User['role'];
    isVerified: boolean;
    kycStatus: User['kycStatus'];
    verificationStatus: User['verificationStatus'];
    verificationMethod: User['verificationMethod'];
    verificationReviewNote: string;
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
    role: payload.role,
    reputation: payload.reputationScore,
    isVerified: payload.isVerified,
    kycStatus: payload.kycStatus,
    verificationStatus: payload.verificationStatus,
    verificationMethod: payload.verificationMethod,
    verificationReviewNote: payload.verificationReviewNote,
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

  if (!user || user.isVerified !== true || user.kycStatus !== 'verified' || user.verificationStatus !== 'approved') {
    return {
      canUsePayoutFlows: false,
      isAnonymousSession: false,
      requiresKyc: true,
      reason: user?.verificationStatus === 'submitted' || user?.verificationStatus === 'under_review'
        ? 'Your verification is under review. Publishing and booking unlock automatically after approval.'
        : 'Complete KYC verification before publishing listings or booking items.',
    };
  }

  return {
    canUsePayoutFlows: true,
    isAnonymousSession: false,
    requiresKyc: false,
    reason: null,
  };
}

function isFirebaseConfigurationError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = `${error.message}`.toUpperCase();
  return message.includes('CONFIGURATION_NOT_FOUND') || message.includes('AUTH/CONFIGURATION-NOT');
}
