// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { LogIn, Phone, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { ENABLE_DEMO_AUTH } from '../src/config/runtime';
import { useAppTheme } from '../src/theme/provider';
import { isSupportedIndianPhoneInput, sanitizeIndianPhoneInput } from '../src/utils/phone';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const { requestPhoneOtp, loginWithPhoneOtp } = useAuth();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);


  const handleSendOtp = () => {
    if (!isSupportedIndianPhoneInput(phone)) {
      Alert.alert('Error', 'Please enter a valid Indian mobile number.');
      return;
    }

    setIsBusy(true);
    requestPhoneOtp(phone)
      .then((result) => {
        setSentOtp(result.mode === 'demo' ? result.code ?? null : null);
        setShowOtp(true);
        Alert.alert(
          'OTP Sent',
          result.mode === 'demo' && ENABLE_DEMO_AUTH
            ? `Use ${result.code} to continue (secure demo fallback).`
            : 'Enter the OTP sent to your phone.'
        );
      })
      .catch((error) => {
        Alert.alert('Unable to send OTP', error instanceof Error ? error.message : 'Please try again.');
      })
      .finally(() => setIsBusy(false));
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsBusy(true);
      await loginWithPhoneOtp(phone, otp);
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <LinearGradient
            colors={[theme.colors.surfaceAlt, theme.colors.backgroundMuted]}
            style={styles.headerGradient}
          >
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>S</Text>
            </View>
            <Text style={styles.title}>Sahaay</Text>
            <Text style={styles.subtitle}>Borrow genius for your neighborhood.</Text>
          </LinearGradient>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.instructionText}>
            {showOtp ? 'Enter the code sent to your phone' : 'Enter your phone number to continue'}
          </Text>

          {!showOtp ? (
            <>
              <View style={styles.inputContainer}>
                <Phone size={20} color={theme.colors.textMuted} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(value) => setPhone(sanitizeIndianPhoneInput(value))}
                  maxLength={12}
                />
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleSendOtp} disabled={isBusy}>
                {isBusy ? <ActivityIndicator color="#181411" /> : (
                  <>
                    <Text style={styles.primaryButtonText}>Continue</Text>
                    <ArrowRight size={20} color="#181411" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <LogIn size={20} color={theme.colors.textMuted} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                />
              </View>

              {ENABLE_DEMO_AUTH && sentOtp && <Text style={styles.hint}>Demo OTP: {sentOtp}</Text>}

              <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyOtp} disabled={isBusy}>
                {isBusy ? <ActivityIndicator color="#181411" /> : <Text style={styles.primaryButtonText}>Verify & Login</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowOtp(false)} style={styles.textButton}>
                <Text style={styles.textButtonLabel}>Change Phone Number</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.securityCard}>
            <ShieldCheck size={16} color={theme.colors.accentStrong} />
            <View style={styles.securityCopy}>
              <Text style={styles.securityTitle}>Secure session foundation</Text>
              <Text style={styles.securityBody}>
                Firebase-backed identity, device binding, and App Check work together to protect listings and payouts.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    height: 300,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: theme.colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...theme.shadows.medium,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.accent,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    opacity: 0.8,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 20,
    marginTop: -40,
    borderRadius: theme.radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    height: 50,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...theme.shadows.soft,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181411',
  },
  textButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  textButtonLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  hint: {
    textAlign: 'center',
    color: theme.colors.accentStrong,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: '700',
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
  },
  securityCopy: {
    flex: 1,
  },
  securityTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  securityBody: {
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});

export default LoginScreen;
