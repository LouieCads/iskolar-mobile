import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from '@/components/toast';
import { authService } from '@/services/auth.service';

// Validation 
const forgotPasswordSchema = z.object({
  email: z.string()
    .nonempty("Email is required")
    .email("Invalid email format"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const EXPO_API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ForgotPasswordPage() {
  const router = useRouter();
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

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToast({ visible: true, type, title, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2000);
  };

  // API 
  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      const email = data.email.trim().toLowerCase().slice(0, 254);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('error', 'Validation', 'Invalid email format');
        return;
      }

      const response = await fetch(`${EXPO_API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        // Store token if needed
        // await AsyncStorage.setItem('authToken', result.token);
        
        showToast('success', 'Success', result.message || 'OTP sent successfully to your email');
        setTimeout(() => {
          router.push({
            pathname: '/verify-otp',
            params: { email }
          });
        }, 1500);
      } else {
        showToast('error', 'Sending OTP Failed', result.message || 'Error sending OTP. Please try again later.');
      }
    } catch (error) {
      console.error("Login error:", error);
      showToast(
        'error',
        'Connection Error',
        `Failed to connect to server at ${EXPO_API_URL}`
      );
    } finally {
      setLoading(false);
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
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="keyboard-arrow-left" size={24} color="#F0F7FF" />
        </Pressable>
        <Text style={styles.headerTitle}>iSkolar</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.formContainer}>
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Forgot Password</Text>
            <View style={styles.noteRow}>
              <Text style={styles.noteText}>Take notes next time!</Text>
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Enter email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={value}
                  onChangeText={onChange}
                  editable={!loading}
                />
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          {/* Send OTP */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
          >
             {loading ? (
              <Text style={styles.buttonText}>Sending...</Text>
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
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
    marginBottom: 4,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#718096',
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#C4CBD5',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'BreeSerif_400Regular',
  },
  button: {
    backgroundColor: '#3A52A6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
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
});