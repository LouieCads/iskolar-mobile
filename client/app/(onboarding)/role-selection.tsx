import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Toast from '@/components/toast';
import { authService } from '@/services/auth.service';

const EXPO_API_URL = process.env.EXPO_PUBLIC_API_URL;

type RoleType = 'student' | 'sponsor' | null;

export default function RoleSelectionPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
  });

  const slideAnim = useRef(new Animated.Value(-1000)).current;
  const studentAnim = useRef(new Animated.Value(0)).current;
  const sponsorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const checkUserRole = async () => {
      try {
        const hasToken = await authService.hasValidToken();
        if (!hasToken) {
          router.push('/login');
          return;
        }

        const result = await authService.getProfileStatus();
        
        if (result.user?.has_selected_role && result.user?.role) {
          router.replace({
            pathname: '/profile-setup',
            params: { role: result.user.role }
          });
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };

    checkUserRole();
  }, []);

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToast({ visible: true, type, title, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2000);
  };

  const handleRoleSelect = (role: RoleType) => {
    setSelectedRole(role);

    Animated.parallel([
      Animated.timing(studentAnim, {
        toValue: role === 'student' ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(sponsorAnim, {
        toValue: role === 'sponsor' ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleContinue = async () => {
    if (!selectedRole) return;

    try {
      setLoading(true);
      
      const result = await authService.selectRole(selectedRole);
      
      if (result.success) {
        const roleText = selectedRole === 'student' ? 'Student' : 'Sponsor';
        showToast('success', 'Role Selected', `You have selected ${roleText} role`);
        
        setTimeout(() => {
          router.push({
            pathname: '/profile-setup',
            params: { role: selectedRole }
          });
        }, 2000);
      } else {
        if (result.message?.includes('already selected your role')) {
          showToast('error', 'Role Already Selected', result.message);
          setTimeout(() => {
            router.push({
              pathname: '/profile-setup',
              params: { role: result.currentRole }
            });
          }, 2000);
        } else {
          showToast('error', 'Error', result.message || 'Failed to select role');
        }
      }
    } catch (error) {
      console.error('Role selection error:', error);
      showToast(
        'error',
        'Connection Error',
        'Failed to connect to server'
      );
    } finally {
      setLoading(false);
    }
  };

  const studentBg = studentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F0F7FF', '#EFA508'],
  });
  const sponsorBg = sponsorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F0F7FF', '#31D0AA'],
  });

  const studentTextColor = studentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#EFA508', '#F0F7FF'],
  });
  const sponsorTextColor = sponsorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#31D0AA', '#F0F7FF'],
  });

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
    >
      <Toast visible={toast.visible} type={toast.type} title={toast.title} message={toast.message} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="keyboard-arrow-left" size={24} color="#3A52A6" />
        </Pressable>
      </View>

      {/* Subheader */}
      <View style={styles.subheader}>
        <Text style={styles.title}>Welcome to iSkolar</Text>
        <Text style={styles.subtitle}>Select your role</Text>
      </View>

      {/* Role Cards */}
      <View style={styles.cardsContainer}>
        {/* Student Card */}
        <Pressable onPress={() => handleRoleSelect('student')}>
          <Animated.View
            style={[
              styles.roleCard,
              {
                borderColor: '#EFA508',
                shadowColor: '#EFA508',
                backgroundColor: studentBg,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="school"
                size={36}
                color={selectedRole === 'student' ? '#F0F7FF' : '#EFA508'}
              />
            </View>
            <Animated.Text style={[styles.roleTitle, { color: studentTextColor }]}>
              iStudent
            </Animated.Text>
            <Animated.Text style={[styles.roleSubtitle, { color: studentTextColor }]}>
              Scholarship seeker
            </Animated.Text>
            <Animated.Text
              style={[
                styles.roleDescription,
                {
                  color: studentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#2D3748', '#F0F7FF'],
                  }),
                },
              ]}
            >
              Apply for scholarships, upload your credentials, and receive financial support for your education journey.
            </Animated.Text>
          </Animated.View>
        </Pressable>

        {/* Sponsor Card */}
        <Pressable onPress={() => handleRoleSelect('sponsor')}>
          <Animated.View
            style={[
              styles.roleCard,
              {
                borderColor: '#31D0AA',
                shadowColor: '#31D0AA',
                backgroundColor: sponsorBg,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="hand-heart"
                size={36}
                color={selectedRole === 'sponsor' ? '#F0F7FF' : '#31D0AA'}
              />
            </View>
            <Animated.Text style={[styles.roleTitle, { color: sponsorTextColor }]}>
              iSponsor
            </Animated.Text>
            <Animated.Text style={[styles.roleSubtitle, { color: sponsorTextColor }]}>
              Scholarship Provider
            </Animated.Text>
            <Animated.Text
              style={[
                styles.roleDescription,
                {
                  color: sponsorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#2D3748', '#F0F7FF'],
                  }),
                },
              ]}
            >
              Create scholarship programs, support deserving students, and make a positive impact on education.
            </Animated.Text>
          </Animated.View>
        </Pressable>
      </View>

      {/* Select Button */}
      <View style={styles.buttonContainer}>
        <Pressable
          onPress={handleContinue}
          style={[styles.button, (!selectedRole || loading) && styles.buttonDisabled]}
          disabled={!selectedRole || loading}
        >
          <Text style={[styles.buttonText, (!selectedRole || loading) && styles.buttonTextDisabled]}>
            {loading ? 'Selecting...' : 'Select'}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    paddingTop: 75,
    paddingBottom: 65,
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  backButton: {
    position: 'absolute',
    top: -25,
    left: -6,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subheader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 32,
    color: '#3A52A6',
  },
  subtitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    color: '#3A52A6',
  },
  cardsContainer: {
    flex: 1,
    gap: 16,
  },
  roleCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 8,
  },
  roleTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 24,
    marginBottom: 2,
  },
  roleSubtitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    marginBottom: 16,
  },
  roleDescription: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    textAlign: 'auto',
    lineHeight: 20,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#3A52A6',
    paddingVertical: 16,
    paddingHorizontal: 128,
    borderRadius: 12,
    shadowColor: '#3A52A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#F0F7FF',
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
  },
  buttonTextDisabled: {
    color: '#F0F7FF',
  },
});