// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import Colors from '../src/constants/Colors';
import Theme from '../src/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { LogIn, Phone, ArrowRight, Chrome, Facebook as FacebookIcon } from 'lucide-react-native';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const { loginWithPhoneOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [sentOtp, setSentOtp] = useState<string | null>(null);

  // Google Auth Request
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    // Client IDs should be added here
    androidClientId: '400664256540-20fahhlp2p0vecc1sjheohclrv4msbnu.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
  });

  // Facebook Auth Request
  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: 'YOUR_FACEBOOK_APP_ID',
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { authentication } = googleResponse;
      Alert.alert('Success', 'Google Login Successful (Token received)');
      // In a real app, you would send this token to your backend
    }
  }, [googleResponse]);

  useEffect(() => {
    if (fbResponse?.type === 'success') {
      const { authentication } = fbResponse;
      Alert.alert('Success', 'Facebook Login Successful (Token received)');
    }
  }, [fbResponse]);


  const handleSendOtp = () => {
    if (phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    // Generate demo OTP for local/dev usage
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSentOtp(code);
    setShowOtp(true);
    Alert.alert('OTP Sent', `Use ${code} to login (demo)`);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    await loginWithPhoneOtp(phone, otp);
    // Alert.alert('Success', 'Login successful!'); // Handled by AuthContext/Navigation
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <LinearGradient
            colors={[Colors.primary, Colors.darkPrimary]}
            style={styles.headerGradient}
          >
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>S</Text>
            </View>
            <Text style={styles.title}>Sahaay</Text>
            <Text style={styles.subtitle}>Borrow from your neighborhood</Text>
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
                <Phone size={20} color={Colors.text.placeholder} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor={Colors.text.placeholder}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                />
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleSendOtp}>
                <Text style={styles.primaryButtonText}>Continue</Text>
                <ArrowRight size={20} color={Colors.text.primary} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <LogIn size={20} color={Colors.text.placeholder} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor={Colors.text.placeholder}
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                />
              </View>

              {sentOtp && <Text style={styles.hint}>Demo OTP: {sentOtp}</Text>}

              <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyOtp}>
                <Text style={styles.primaryButtonText}>Verify & Login</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowOtp(false)} style={styles.textButton}>
                <Text style={styles.textButtonLabel}>Change Phone Number</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#DB4437' }]} // Google Red
              onPress={() => googlePromptAsync()}
              disabled={!googleRequest}
            >
              {/* Using generic icon/text as we don't have SVGs handy, Lucide icons are great */}
              <Chrome size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#4267B2' }]} // Facebook Blue
              onPress={() => fbPromptAsync()}
              disabled={!fbRequest}
            >
              <FacebookIcon size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Theme.shadows.medium,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.primary,
    opacity: 0.8,
  },
  formCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Theme.spacing.lg,
    marginTop: -40,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadows.large,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    height: 50,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  primaryButton: {
    backgroundColor: Colors.secondary,
    height: 50,
    borderRadius: Theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Theme.shadows.small,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary, // Yellow text on black button
  },
  textButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  textButtonLabel: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  hint: {
    textAlign: 'center',
    color: Colors.text.secondary,
    marginBottom: 12,
    fontSize: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.text.secondary,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.small,
  },
  socialButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default LoginScreen;


