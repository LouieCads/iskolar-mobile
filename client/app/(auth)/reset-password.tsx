import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from '@/components/toast';
import { authService } from '@/services/auth.service';

// Validation 
const resetPasswordSchema = z.object({
  password: z.string()
    .nonempty("Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[@$!%*?&]/, "Password must contain at least one special character (@$!%*?&)"),
  confirmPassword: z.string()
    .nonempty("Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const EXPO_API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = (params.email as string)?.trim().toLowerCase().slice(0, 254);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const { control, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur", 
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToast({ visible: true, type, title, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2000);
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!email) {
      showToast('error', 'Error', 'Email not found. Please start the password reset process again.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${EXPO_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: data.password.trim().slice(0, 128),
          confirmPassword: data.confirmPassword.trim().slice(0, 128),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast('success', 'Success', result.message || 'Password reset successful! Please login');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        showToast('error', 'Reset Failed', result.message || 'Failed to reset password. Please try again later.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
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
        {/* Back Button */}
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}
          disabled={loading}
        >
          <MaterialIcons name="keyboard-arrow-left" size={24} color="#F0F7FF" />
        </Pressable>
        <Text style={styles.headerTitle}>iSkolar</Text>
      </View>

      {/* Content Card */}
      <View style={styles.content}>
        <View style={styles.formContainer}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Create a new secure password</Text>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder="Enter new password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={value}
                    onChangeText={onChange}
                    editable={!loading}
                  />
                  <Pressable
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={20}
                      color="#718096"
                    />
                  </Pressable>
                </View>
              )}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={[styles.input, errors.confirmPassword && styles.inputError]}
                    placeholder="Confirm new password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={value}
                    onChangeText={onChange}
                    editable={!loading}
                  />
                  <Pressable
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    <MaterialIcons
                      name={showConfirmPassword ? "visibility" : "visibility-off"}
                      size={20}
                      color="#718096"
                    />
                  </Pressable>
                </View>
              )}
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
            )}
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password must contain:</Text>
            <Text style={styles.requirementText}>• At least 8 characters</Text>
            <Text style={styles.requirementText}>• One uppercase letter (A-Z)</Text>
            <Text style={styles.requirementText}>• One lowercase letter (a-z)</Text>
            <Text style={styles.requirementText}>• One number (0-9)</Text>
            <Text style={styles.requirementText}>• One special character (@$!%*?&)</Text>
          </View>

          {/* Reset Button */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.buttonText}>Resetting...</Text>
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
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
  subtitle: {
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
  passwordInputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 48,
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#C4CBD5',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 10,
    padding: 4,
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
  requirementsContainer: {
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  requirementsTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#3A52A6',
    marginBottom: 8,
  },
  requirementText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
    color: '#4A5568',
    marginBottom: 4,
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