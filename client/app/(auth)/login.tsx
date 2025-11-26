import { useState, useEffect } from 'react';
import { View, Text, Image, Pressable, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from '@/components/toast';
import LoadingScreen from '@/components/loading-screen';
import { authService } from '@/services/auth.service';

// Validation 
const loginSchema = z.object({
  email: z.string()
    .nonempty("Email is required")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'),
  password: z.string()
    .nonempty("Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const EXPO_API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur", 
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToast({ visible: true, type, title, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2000);
  };

  // API 
  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      const email = data.email.trim().toLowerCase().slice(0, 254);
      const password = data.password.trim().slice(0, 128);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('error', 'Validation', 'Invalid email format');
        return;
      }

      const response = await fetch(`${EXPO_API_URL}/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          rememberMe: rememberMe,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        await authService.storeToken(result.token);

        showToast('success', 'Success', result.message || 'Login successful!');
        
        setShowLoadingScreen(true);

        setTimeout(() => {
          router.push('../(onboarding)/welcome'); 
        }, 1750);
      } else {
        showToast('error', 'Login Failed', result.message || 'Invalid credentials');
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

  if (showLoadingScreen) {
    return <LoadingScreen />;
  }

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
            <Text style={styles.title}>Log In</Text>
            <View style={styles.signUpRow}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <Pressable onPress={() => router.push('/register')}>
                <Text style={styles.signUpLink}>Sign up</Text>
              </Pressable>
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

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder="Enter password"
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

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <Pressable 
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              disabled={loading}
            >
              <View style={styles.checkbox}>
                {rememberMe && (
                  <MaterialIcons name="check" size={16} color="#3A52A6" />
                )}
              </View>
              <Text style={styles.rememberMeText}>Remember Me</Text>
            </Pressable>

            <Pressable 
              onPress={() => router.push('/forgot-password')}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </Pressable>
          </View>

          {/* Sign In */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.buttonText}>Logging in...</Text>
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
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
    height: 225,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 32,
    paddingTop: 110,
    color: '#F0F7FF',
  },
  content: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 25,
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
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signUpText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#718096',
  },
  signUpLink: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#3A52A6',
    textDecorationLine: 'underline',
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#C4CBD5',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7FF',
  },
  rememberMeText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#718096',
  },
  forgotPasswordText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#3A52A6',
  },
  button: {
    backgroundColor: '#3A52A6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#3A52A6',
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