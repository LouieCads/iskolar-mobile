import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from '@/components/toast';
import { authService } from '@/services/auth.service';

const EXPO_API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function VerifyOTPPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = (params.email as string)?.trim().toLowerCase().slice(0, 254);
  
  const [otp, setOtp] = useState('');
  const [isVerifying , setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const hasToken = await authService.hasValidToken();
        if (hasToken) {
          const result = await authService.getProfileStatus();

          if (result.user?.role === 'student' && result.user?.profile_completed) {
            router.replace('../(student)/home');
          } else if (result.user?.role === 'sponsor' && result.user?.profile_completed) {
            router.replace('../(sponsor)/my-scholarships');
          }
        }
      } catch (e) {
        // Ignore
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToast({ visible: true, type, title, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2000);
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      showToast('error', 'Error', 'Please enter OTP code');
      return;
    }

    const cleanOtp = otp.replace(/\D/g, '').slice(0, 6);
    if (cleanOtp.length !== 6) {
      showToast('error', 'Error', 'OTP must be 6 digits');
      return;
    }

    if (!email) {
      showToast('error', 'Error', 'Email not found. Please go back and try again.');
      return;
    }

    try {
      setIsVerifying(true);

      const response = await fetch(`${EXPO_API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: cleanOtp,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast('success', 'Success', result.message || 'OTP verified successfully!');
        setTimeout(() => {
          router.push({
            pathname: '/reset-password',
            params: { email: email }
          });
        }, 1500);
      } else {
        showToast('error', 'Verification Failed', result.message || 'Invalid OTP code');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      showToast(
        'error',
        'Connection Error',
        `Failed to connect to server at ${EXPO_API_URL}`
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      showToast('error', 'Error', 'Email not found. Please go back and try again.');
      return;
    }

    try {
      setIsResending(true);

      const response = await fetch(`${EXPO_API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast('success', 'Success', 'New OTP sent to your email');
        setOtp(''); // Clear previous OTP
      } else {
        showToast('error', 'Error', result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      showToast('error', 'Connection Error', 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <LinearGradient
      colors={['#3A52A6', '#3A52A6', '#607EF2']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.container}
    >
      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
      />

      {/* Header */}
      <View style={styles.header}>
        {/* Back */}
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}
          disabled={isVerifying || isResending}
        >
          <MaterialIcons name="keyboard-arrow-left" size={24} color="#F0F7FF" />
        </Pressable>
        <Text style={styles.headerTitle}>iSkolar</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.formContainer}>
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to
            </Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          {/* OTP */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>OTP Code</Text>
            <TextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor="#9CA3AF"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isVerifying}
            />
          </View>

          {/* Resend */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <Pressable onPress={handleResendOTP} disabled={isResending}>
              <Text style={[styles.resendLink, isResending && styles.linkDisabled]}>
                Resend OTP
              </Text>
            </Pressable>
          </View>

          {/* Verify */}
          <Pressable
            onPress={handleVerifyOTP}
            style={[styles.button, (isVerifying || isResending) && styles.buttonDisabled]}
            disabled={isVerifying || isResending}
          >
            {isVerifying ? (
              <Text style={styles.buttonText}>Verifying...</Text>
            ) : isResending ? (
              <Text style={styles.buttonText}>Resending...</Text>
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    height: 200,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 32,
    paddingTop: 90,
    color: '#F0F7FF',
  },
  content: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  formContainer: {
    flex: 1,
  },
  titleSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 24,
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  emailText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#3A52A6',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#4A5568',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    paddingHorizontal: 75,
    paddingVertical: 12,
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 24,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#C4CBD5',
    textAlign: 'center',
    letterSpacing: 8,
  },
    resendContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3A52A6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#4A5FB5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#F0F7FF',
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  resendText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#718096',
  },
  resendLink: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#3A52A6',
    textDecorationLine: 'underline',
  },
  linkDisabled: {
    opacity: 0.5,
  },
});