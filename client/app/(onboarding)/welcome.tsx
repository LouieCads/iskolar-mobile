import { View, Text, Image, Pressable, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { authService } from '@/services/auth.service';

export default function WelcomePage() {
  const router = useRouter();
  
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const checkUserRole = async () => {
      try {
        const hasToken = await authService.hasValidToken();
        if (!hasToken) {
          router.push('/login');
          return;
        }

        const result = await authService.getProfileStatus();

        if (result.user?.role === 'student' && result.user?.profile_completed) {
          router.replace('../(student)/home');
        } else if (result.user?.role === 'sponsor' && result.user?.profile_completed) {
          router.replace('../(sponsor)/my-scholarships');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };

    checkUserRole();
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity }]}>
        <Image 
          source={require('../../assets/images/iskolar.png')} 
          style={styles.image}
        />
      </Animated.View>

      {/* Welcome */}
      <Animated.View style={{ opacity: textOpacity }}>
        <Text style={styles.title}>Welcome to iSkolar</Text>
        <Text style={styles.tagline}>Connecting Students and Sponsors</Text>
      </Animated.View>
      
      {/* Get Started Button */}
      <Animated.View style={{ opacity: buttonOpacity }}>
        <Pressable
          onPress={() => router.replace('/role-selection')}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    paddingVertical: 175,
    paddingHorizontal: 50,
  },
  logoContainer: {
    alignItems: 'center',
  },
  image: {
    width: 250,
    height: 250,
  },
  title: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 30,
    textAlign: 'center',
    color: '#3A52A6',
    lineHeight: 28,
  },
  tagline: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    textAlign: 'center',
    color: '#3A52A6',
    lineHeight: 28,
  },
  button: {
    backgroundColor: '#EFA508',
    paddingVertical: 15,
    paddingHorizontal: 90,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 50,
  },
  buttonText: {
    color: '#F0F7FF',
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});